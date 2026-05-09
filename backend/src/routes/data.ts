import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { prisma } from '../utils/prisma'

const router = Router()


// 引入 authentication 中间件
router.use(authenticate)

// 检查是否是超管（admin、拥有 *:* 权限）
function isSuperAdmin(permissions: string[]): boolean {
  if (!permissions || permissions.length === 0) return false
  return permissions.includes('*:*') || permissions.includes('admin')
}

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

// 获取当前租户ID
const getTenantId = (req: Request) => {
  return (req.headers['x-tenant-id'] as string) || req.user?.tenantId
}

const parseFilters = (filters: unknown): Record<string, any[]> => {
  if (!filters) return {}

  if (typeof filters === 'string') {
    try {
      return JSON.parse(filters)
    } catch {
      return {}
    }
  }

  if (typeof filters === 'object') {
    return filters as Record<string, any[]>
  }

  return {}
}

const parseRowData = (value: any) => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value
}

// 检查用户是否有权限访问表格
async function canAccessTable(user: any, table: any): Promise<boolean> {
  // 超管可以访问所有表格
  if (isSuperAdmin(user.permissions)) return true

  // 创建者可以访问自己的表格
  if (table.createdBy === user.id) return true

  // 检查表格是否授权给了用户所在的组织（或子组织）
  if (table.allowedOrgs) {
    try {
      const allowedOrgs = JSON.parse(table.allowedOrgs)
      if (Array.isArray(allowedOrgs) && allowedOrgs.length > 0) {
        const accessibleOrgs = await getAccessibleOrgIds(user.orgId)
        // 检查是否有交集
        return allowedOrgs.some((orgId: string) => accessibleOrgs.includes(orgId))
      }
    } catch (e) {
      // ignore parse error
    }
  }

  return false
}

// 辅助函数：检查表格是否存在且属于当前租户，并检查用户权限
const checkTableAccess = async (tableId: string, tenantId: string | undefined, user: any, res: Response) => {
  if (!tenantId) {
    res.status(400).json({ success: false, message: '缺少租户信息' })
    return null
  }
  const table = await prisma.tableConfig.findFirst({
    where: { id: tableId, tenantId }
  })
  if (!table) {
    res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    return null
  }
  if (!(await canAccessTable(user, table))) {
    res.status(403).json({ success: false, message: '无权访问此表格' })
    return null
  }
  return table
}


// 获取表格数据（分页，带数据权限过滤）
router.get('/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const sortBy = req.query.sortBy as string
    const sortOrder = (req.query.sortOrder as string) || 'asc'
    const filters = parseFilters(req.query.filters)
    const skip = (page - 1) * pageSize

    // 构建权限过滤条件：只能看自己和子组织的数据，但共享数据(orgId=null)对所有人可见
    let orgFilter: any = {}
    if (!isSuperAdmin(user.permissions)) {
      const accessibleOrgIds = await getAccessibleOrgIds(user.orgId)
      if (accessibleOrgIds.length > 0) {
        // 包含自己及子组织的数据，以及共享数据(orgId=null)
        orgFilter = {
          OR: [
            { orgId: { in: accessibleOrgIds } },
            { orgId: null }
          ]
        }
      } else {
        // 没有组织权限，只能看共享数据(orgId = null)
        orgFilter = { orgId: null }
      }
    }

    let allData = await prisma.dynamicData.findMany({
      where: {
        tableId: String(tableId),
        ...orgFilter
      },
      orderBy: { createdAt: 'desc' }
    })

    let parsedData = allData.map((item: any) => ({
      ...item,
      rowData: parseRowData(item.rowData)
    }))

    Object.entries(filters).forEach(([field, values]) => {
      if (!Array.isArray(values) || values.length === 0) return

      parsedData = parsedData.filter((item: any) =>
        values.some(value => String(item.rowData?.[field] ?? '') === String(value))
      )

    })

    if (sortBy) {
      parsedData = parsedData.sort((a: any, b: any) => {

        const aValue = a.rowData?.[sortBy] ?? ''
        const bValue = b.rowData?.[sortBy] ?? ''
        const aNum = Number(aValue)
        const bNum = Number(bValue)

        let comparison = 0
        if (aValue !== '' && bValue !== '' && !isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum
        } else {
          comparison = String(aValue).localeCompare(String(bValue), 'zh-CN')
        }

        return sortOrder === 'desc' ? -comparison : comparison
      })
    }

    const total = parsedData.length
    const data = parsedData.slice(skip, skip + pageSize)

    res.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '获取数据失败' })
  }
})


// 新增数据行
router.post('/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const { rowData } = req.body
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    // 检查权限：超管或集团层面可以新增数据
    if (!isSuperAdmin(user.permissions)) {
      if (!user.orgId) {
        return res.status(403).json({ success: false, message: '只有集团层面可以新增表格数据' })
      }
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } })
      if (!org || org.type !== 'group') {
        return res.status(403).json({ success: false, message: '只有集团层面可以新增表格数据' })
      }
    }

    const data = await prisma.dynamicData.create({
      data: {
        tableId: String(tableId),
        orgId: user.orgId, // 记录填报组织
        rowData: JSON.stringify(rowData)
      }
    })

    res.json({ success: true, data: { ...data, rowData }, message: '数据添加成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加数据失败' })
  }
})

// 更新数据行
router.put('/:tableId/:id', async (req: Request, res: Response) => {
  try {
    const { tableId, id } = req.params
    const { rowData } = req.body
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    const existingRow = await prisma.dynamicData.findFirst({
      where: { id: String(id), tableId: String(tableId) }
    })
    if (!existingRow) {
      return res.status(404).json({ success: false, message: '数据不存在' })
    }

    const data = await prisma.dynamicData.update({
      where: { id: String(id) },
      data: {
        rowData: JSON.stringify(rowData)
      }
    })

    res.json({ success: true, data: { ...data, rowData }, message: '数据更新成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新数据失败' })
  }
})

// 删除数据行
router.delete('/:tableId/:id', async (req: Request, res: Response) => {
  try {
    const { tableId, id } = req.params
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    const existingRow = await prisma.dynamicData.findFirst({
      where: { id: String(id), tableId: String(tableId) }
    })
    if (!existingRow) {
      return res.status(404).json({ success: false, message: '数据不存在' })
    }

    await prisma.dynamicData.delete({
      where: { id: String(id) }
    })

    res.json({ success: true, message: '数据删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除数据失败' })
  }
})


// 批量删除数据行
router.delete('/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const { ids } = req.body
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    await prisma.dynamicData.deleteMany({
      where: {
        id: { in: ids },
        tableId: String(tableId)
      }
    })

    res.json({ success: true, message: '批量删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '批量删除失败' })
  }
})

// 批量导入数据
router.post('/:tableId/batch', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const { rows } = req.body
    const tenantId = getTenantId(req)
    const user = req.user!

    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: '数据不能为空' })
    }
    
    // 批量创建数据（使用事务确保数据一致性）
    const result = await prisma.$transaction(
      rows.map(rowData => 
        prisma.dynamicData.create({
          data: {
            tableId: String(tableId),
            rowData: JSON.stringify(rowData)
          }
        })
      )
    )
    
    res.json({ 
      success: true, 
      message: `成功导入 ${result.length} 条数据`,
      data: result
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '批量导入失败' })
  }
})

// 批量设置数据归属组织
router.put('/:tableId/batch-org', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const { ids, orgId } = req.body
    const tenantId = getTenantId(req)
    const user = req.user!

    if (!tenantId) {
      return res.status(400).json({ success: false, message: '缺少租户信息' })
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要设置的数据' })
    }

    // 检查表格权限
    const table = await checkTableAccess(String(tableId), tenantId, user, res)
    if (!table) return

    // 检查用户是否有权限修改（超管或集团层面）
    if (!isSuperAdmin(user.permissions)) {
      if (!user.orgId) {
        return res.status(403).json({ success: false, message: '只有集团层面可以设置数据归属' })
      }
      const org = await prisma.organization.findUnique({ where: { id: user.orgId } })
      if (!org || org.type !== 'group') {
        return res.status(403).json({ success: false, message: '只有集团层面可以设置数据归属' })
      }
    }

    // 验证目标组织存在
    if (orgId) {
      const targetOrg = await prisma.organization.findUnique({ where: { id: orgId } })
      if (!targetOrg) {
        return res.status(400).json({ success: false, message: '目标组织不存在' })
      }
    }

    // 批量更新
    await prisma.dynamicData.updateMany({
      where: {
        id: { in: ids },
        tableId: String(tableId)
      },
      data: { orgId: orgId || null }
    })

    res.json({ success: true, message: `已更新 ${ids.length} 条数据的归属组织` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '设置归属失败' })
  }
})

export default router
