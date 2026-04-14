import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()
const prisma: any = new PrismaClient()

// 获取用户可访问的所有组织节点（包含自己及所有子节点）
async function getAccessibleOrgIds(orgId: string | null): Promise<string[]> {
  if (!orgId) return []

  const orgIds = new Set<string>([orgId])

  // 递归获取所有子节点
  async function collectChildren(parentId: string) {
    const children = await prisma.organization.findMany({
      where: { parentId }
    })
    for (const child of children) {
      orgIds.add(child.id)
      await collectChildren(child.id)
    }
  }

  await collectChildren(orgId)
  return Array.from(orgIds)
}

// 检查是否是超管（admin、拥有 *:* 权限）
function isSuperAdmin(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false
  return permissions.includes('*:*') || permissions.includes('admin')
}

// 检查是否是集团层面（type = 'group'）
async function isGroupLevel(orgId: string | null): Promise<boolean> {
  if (!orgId) return false
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  return org?.type === 'group'
}

// 获取所有组织（树形结构）
router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string
    
    const orgs = await prisma.organization.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: [{ sort: 'asc' }]
    })
    
    // 构建树形结构
    const tree = buildOrgTree(orgs)
    res.json({ success: true, data: tree })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取组织列表失败' })
  }
})

// 构建组织树形结构
function buildOrgTree(orgs: any[]): any[] {
  const map: any = {}
  const roots: any[] = []
  
  orgs.forEach(org => {
    map[org.id] = { ...org, children: [] }
  })
  
  orgs.forEach(org => {
    if (org.parentId && map[org.parentId]) {
      map[org.parentId].children.push(map[org.id])
    } else {
      roots.push(map[org.id])
    }
  })
  
  return roots
}

// 获取所有任务（带数据权限过滤）
router.get('/tasks', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const tenantId = req.query.tenantId as string

    // 超管不受限制
    if (isSuperAdmin(user.permissions)) {
      const tasks = await prisma.task.findMany({
        where: tenantId ? { tenantId } : {},
        orderBy: { createdAt: 'desc' }
      })
      return res.json({ success: true, data: tasks })
    }

    // 普通用户：获取自己及子组织的任务
    const accessibleOrgIds = await getAccessibleOrgIds(user.orgId)

    // 获取下发到这些组织的任务
    const targets = await prisma.taskTarget.findMany({
      where: {
        targetType: 'organization',
        targetId: { in: accessibleOrgIds }
      },
      select: { taskId: true }
    })

    const taskIds = [...new Set(targets.map((t: any) => t.taskId))]

    // 获取这些任务，并确保属于同一租户
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        tenantId: tenantId || user.tenantId
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: tasks })
  } catch (error: any) {
    console.error('Error getting tasks:', error)
    res.status(500).json({ success: false, message: '获取任务列表失败: ' + (error?.message || '未知错误') })
  }
})

// 创建任务（仅集团层面可创建）
router.post('/tasks', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // 检查是否是超管
    if (!isSuperAdmin(user.permissions)) {
      // 检查是否是集团层面
      const isGroup = await isGroupLevel(user.orgId)
      if (!isGroup) {
        return res.status(403).json({ success: false, message: '只有集团层面可以创建任务' })
      }
    }

    const { tenantId, tableId, name, description, deadline, requireLogin, allowAnonymous, targetOrgIds, createdBy } = req.body

    // 创建任务（始终使用当前用户的租户ID，防止跨租户创建）
    const task = await (prisma.task as any).create({
      data: {
        tenantId: user.tenantId,
        tableId,
        name,
        description,
        deadline: deadline ? new Date(deadline) : null,
        requireLogin: requireLogin || false,
        allowAnonymous: allowAnonymous !== false,
        createdBy: createdBy || 'system'
      }
    })
    
    // 如果指定了目标组织，创建下发记录
    if (targetOrgIds && targetOrgIds.length > 0) {
      const targets = await Promise.all(
        targetOrgIds.map((orgId: string, index: number) => 
          (prisma.taskTarget as any).create({
            data: {
              taskId: task.id,
              targetType: 'organization',
              targetId: orgId,
              targetName: `组织${index + 1}`,
              fillToken: generateToken()
            }
          })
        )
      )
      
      // 更新任务状态为已下发
      await (prisma.task as any).update({
        where: { id: task.id },
        data: { status: 'published' }
      })
      
      return res.json({ 
        success: true, 
        data: { ...task, targets },
        message: '任务创建并下发成功' 
      })
    }
    
    res.json({ success: true, data: task, message: '任务创建成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '创建任务失败' })
  }
})

// 获取任务详情
router.get('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    
    const task = await (prisma.task as any).findUnique({
      where: { id },
      include: {
        table: {
          include: { fields: true }
        },
        targets: {
          include: {
            submissions: true
          }
        }
      }
    })
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    
    // 计算统计
    const stats = {
      total: task.targets.length,
      submitted: task.targets.filter((t: any) => t.status === 'submitted').length,
      pending: task.targets.filter((t: any) => t.status === 'pending').length,
      filling: task.targets.filter((t: any) => t.status === 'filling').length,
      overdue: task.targets.filter((t: any) => t.status === 'overdue').length
    }
    
    res.json({ success: true, data: { ...task, stats } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取任务详情失败' })
  }
})

// 下发任务给组织（仅集团层面）
router.post('/tasks/:id/publish', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // 检查是否是超管
    if (!isSuperAdmin(user.permissions)) {
      const isGroup = await isGroupLevel(user.orgId)
      if (!isGroup) {
        return res.status(403).json({ success: false, message: '只有集团层面可以下发任务' })
      }
    }

    const id = req.params.id
    const { targetOrgIds } = req.body
    
    if (!targetOrgIds || targetOrgIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择下发目标' })
    }
    
    // 创建下发记录
    const targets = await Promise.all(
      targetOrgIds.map((orgId: string) => {
        return (prisma.taskTarget as any).create({
          data: {
            taskId: id,
            targetType: 'organization',
            targetId: orgId,
            targetName: `组织`,
            fillToken: generateToken()
          }
        })
      })
    )
    
    // 更新任务状态
    await (prisma.task as any).update({
      where: { id },
      data: { status: 'published' }
    })
    
    res.json({ success: true, data: targets, message: '任务下发成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '任务下发失败' })
  }
})

// 获取填写链接
router.get('/fill/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token
    
    const target = await (prisma.taskTarget as any).findUnique({
      where: { fillToken: token },
      include: {
        task: {
          include: {
            table: {
              include: { fields: true }
            }
          }
        },
        submissions: {
          where: { status: 'submitted' },
          orderBy: { submittedAt: 'desc' },
          take: 1
        }
      }
    })
    
    if (!target) {
      return res.status(404).json({ success: false, message: '填写链接无效' })
    }
    
    // 检查截止日期
    if (target.task.deadline && new Date(target.task.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: '已超过截止日期' })
    }
    
    res.json({ 
      success: true, 
      data: {
        taskId: target.task.id,
        taskName: target.task.name,
        table: target.task.table,
        targetId: target.id,
        requireLogin: target.task.requireLogin,
        submittedData: target.submissions[0]?.data || null
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取填写信息失败' })
  }
})

// 提交填写数据
router.post('/fill/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token
    const { data, userId, userName } = req.body
    
    const target = await (prisma.taskTarget as any).findUnique({
      where: { fillToken: token },
      include: { task: true }
    })
    
    if (!target) {
      return res.status(404).json({ success: false, message: '填写链接无效' })
    }
    
    if (target.task.deadline && new Date(target.task.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: '已超过截止日期' })
    }
    
    // 创建或更新提交记录
    const existing = await (prisma.taskSubmission as any).findFirst({
      where: { targetId: target.id, status: 'submitted' }
    })
    
    if (existing) {
      // 已提交，更新数据
      await (prisma.taskSubmission as any).update({
        where: { id: existing.id },
        data: { 
          data: JSON.stringify(data),
          submittedAt: new Date()
        }
      })
    } else {
      // 新提交
      await (prisma.taskSubmission as any).create({
        data: {
          taskId: target.taskId,
          targetId: target.id,
          userId,
          userName,
          data: JSON.stringify(data),
          status: 'submitted',
          submittedAt: new Date()
        }
      })
      
      // 更新目标状态
      await (prisma.taskTarget as any).update({
        where: { id: target.id },
        data: { status: 'submitted' }
      })
    }
    
    res.json({ success: true, message: '提交成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '提交失败' })
  }
})

// 发送催办
router.post('/tasks/:id/remind', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const { targetIds, type, content } = req.body
    
    const task = await (prisma.task as any).findUnique({
      where: { id },
      include: { targets: true }
    })
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    
    const targetsToRemind = targetIds 
      ? task.targets.filter((t: any) => targetIds.includes(t.id))
      : task.targets.filter((t: any) => t.status !== 'submitted')
    
    // 创建催办记录
    await Promise.all(
      targetsToRemind.map((target: any) => 
        (prisma.reminder as any).create({
          data: {
            taskId: id,
            targetId: target.id,
            type: type || 'system',
            content: content || `请尽快完成「${task.name}」的填写`
          }
        })
      )
    )
    
    res.json({ 
      success: true, 
      message: `已向 ${targetsToRemind.length} 个目标发送催办` 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '催办失败' })
  }
})

// 获取任务统计
router.get('/tasks/:id/stats', async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    
    const task = await (prisma.task as any).findUnique({
      where: { id },
      include: {
        targets: {
          include: { submissions: true }
        }
      }
    })
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }
    
    // 按目标统计
    const byTarget = task.targets.map((target: any) => ({
      targetId: target.id,
      targetName: target.targetName,
      targetType: target.targetType,
      status: target.status,
      submittedAt: target.submissions[0]?.submittedAt,
      userName: target.submissions[0]?.userName
    }))
    
    // 汇总统计
    const summary = {
      total: task.targets.length,
      submitted: task.targets.filter((t: any) => t.status === 'submitted').length,
      pending: task.targets.filter((t: any) => t.status === 'pending').length,
      filling: task.targets.filter((t: any) => t.status === 'filling').length,
      overdue: task.targets.filter((t: any) => {
        if (t.status === 'submitted') return false
        if (!task.deadline) return false
        return new Date(task.deadline) < new Date()
      }).length
    }
    
    res.json({ 
      success: true, 
      data: { summary, byTarget } 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取统计失败' })
  }
})

// 生成随机令牌
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default router