import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()
const prisma: any = new PrismaClient()


// 引入 authentication 中间件
router.use(authenticate)

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

// 辅助函数：检查表格是否存在且属于当前租户
const checkTableTenant = async (tableId: string, tenantId: string | undefined, res: Response) => {
  if (!tenantId) {
    res.status(400).json({ success: false, message: '缺少租户信息' })
    return false
  }
  const table = await prisma.tableConfig.findFirst({
    where: { id: tableId, tenantId }
  })
  if (!table) {
    res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    return false
  }
  return true
}


// 获取表格数据（分页）
router.get('/:tableId', async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params
    const tenantId = getTenantId(req)

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return

    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const sortBy = req.query.sortBy as string
    const sortOrder = (req.query.sortOrder as string) || 'asc'
    const filters = parseFilters(req.query.filters)
    const skip = (page - 1) * pageSize

    let allData = await prisma.dynamicData.findMany({
      where: { tableId: String(tableId) },
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

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return
    
    const data = await prisma.dynamicData.create({
      data: {
        tableId: String(tableId),
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

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return

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

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return

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

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return
    
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

    const hasAccess = await checkTableTenant(String(tableId), tenantId, res)
    if (!hasAccess) return
    
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

export default router
