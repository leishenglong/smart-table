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

const normalizeFieldName = (name: any) => String(name ?? '').trim()

const getFieldValidationError = (fields: any) => {
  if (!Array.isArray(fields)) return null

  const names = fields.map((field: any) => normalizeFieldName(field.name))
  if (names.some(name => !name)) {
    return '字段名称不能为空'
  }

  const uniqueNames = new Set(names)
  if (uniqueNames.size !== names.length) {
    return '字段名称不能重复'
  }

  return null
}

const migrateDynamicRowsForFields = async (tableId: string, existingFields: any[], nextFields: any[]) => {
  const fieldMap = new Map(existingFields.map(field => [field.id, field]))
  const nextFieldNames = new Set(nextFields.map(field => normalizeFieldName(field.name)))
  const retainedFieldIds = new Set(nextFields.map(field => field.id).filter(Boolean))
  const removedFieldNames = existingFields
    .filter(field => !retainedFieldIds.has(field.id))
    .map(field => field.name)

  const renameMap = new Map<string, string>()
  nextFields.forEach(field => {
    if (!field.id) return

    const previousField = fieldMap.get(field.id)
    const nextName = normalizeFieldName(field.name)
    if (previousField && previousField.name !== nextName) {
      renameMap.set(previousField.name, nextName)
    }
  })

  const rows = await prisma.dynamicData.findMany({
    where: { tableId }
  })

  await Promise.all(
    rows.map(async (row: any) => {
      const parsed = typeof row.rowData === 'string' ? JSON.parse(row.rowData) : row.rowData || {}
      const nextRowData: Record<string, any> = { ...parsed }

      renameMap.forEach((nextName, previousName) => {
        if (Object.prototype.hasOwnProperty.call(nextRowData, previousName)) {
          nextRowData[nextName] = nextRowData[previousName]
          delete nextRowData[previousName]
        }
      })

      removedFieldNames.forEach(fieldName => {
        delete nextRowData[fieldName]
      })

      Object.keys(nextRowData).forEach(key => {
        if (!nextFieldNames.has(key)) {
          delete nextRowData[key]
        }
      })

      await prisma.dynamicData.update({
        where: { id: row.id },
        data: { rowData: JSON.stringify(nextRowData) }
      })
    })
  )
}


// 获取所有表格配置
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ success: false, message: '缺少租户信息' })
    }

    const tables = await prisma.tableConfig.findMany({
      where: { tenantId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: tables })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取表格列表失败' })
  }
})

// 获取单个表格配置
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenantId = getTenantId(req)

    const table = await prisma.tableConfig.findFirst({
      where: { id: String(id), tenantId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })
    if (!table) {
      return res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    }
    res.json({ success: true, data: table })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取表格详情失败' })
  }
})

// 创建表格配置
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, fields = [], config } = req.body
    const tenantId = getTenantId(req)
    if (!tenantId) {
      return res.status(400).json({ success: false, message: '缺少租户信息' })
    }

    const fieldError = getFieldValidationError(fields)
    if (fieldError) {
      return res.status(400).json({ success: false, message: fieldError })
    }

    const table = await prisma.tableConfig.create({
      data: {
        tenantId,
        name: String(name || '').trim(),
        description,
        config: JSON.stringify(config || {}),
        fields: {
          create: fields.map((field: any, index: number) => ({
            name: normalizeFieldName(field.name),
            type: field.type,
            required: field.required || false,
            config: JSON.stringify(field.config || {}),
            order: index
          }))
        }
      },
      include: {
        fields: true
      }
    })
    res.json({ success: true, data: table, message: '表格创建成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '创建表格失败' })
  }
})


// 更新表格配置
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, config } = req.body
    const tenantId = getTenantId(req)

    const existingTable = await prisma.tableConfig.findFirst({
      where: { id: String(id), tenantId }
    })
    if (!existingTable) {
      return res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    }

    const table = await prisma.tableConfig.update({
      where: { id: String(id) },
      data: {
        name: name !== undefined ? String(name).trim() : existingTable.name,
        description: description !== undefined ? description : existingTable.description,
        config: Object.prototype.hasOwnProperty.call(req.body, 'config')
          ? JSON.stringify(config || {})
          : existingTable.config
      }
    })
    res.json({ success: true, data: table, message: '表格更新成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新表格失败' })
  }
})


// 删除表格配置
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tenantId = getTenantId(req)

    const existingTable = await prisma.tableConfig.findFirst({
      where: { id: String(id), tenantId }
    })
    if (!existingTable) {
      return res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    }

    await prisma.tableConfig.delete({
      where: { id: String(id) }
    })
    res.json({ success: true, message: '表格删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除表格失败' })
  }
})

// 更新字段配置
router.put('/:id/fields', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const fields = Array.isArray(req.body.fields) ? req.body.fields : []
    const tenantId = getTenantId(req)

    const existingTable = await prisma.tableConfig.findFirst({
      where: { id: String(id), tenantId }
    })
    if (!existingTable) {
      return res.status(404).json({ success: false, message: '表格不存在或无权访问' })
    }

    const fieldError = getFieldValidationError(fields)
    if (fieldError) {
      return res.status(400).json({ success: false, message: fieldError })
    }

    const existingFields = await prisma.tableField.findMany({
      where: { tableId: String(id) },
      orderBy: { order: 'asc' }
    })

    await migrateDynamicRowsForFields(String(id), existingFields, fields)

    await prisma.tableField.deleteMany({
      where: { tableId: String(id) }
    })

    const newFields = []
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const createdField = await prisma.tableField.create({
        data: {
          tableId: String(id),
          name: normalizeFieldName(field.name),
          type: field.type,
          required: field.required || false,
          config: JSON.stringify(field.config || {}),
          order: i
        }
      })
      newFields.push(createdField)
    }

    res.json({ success: true, data: newFields, message: '字段更新成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: '更新字段失败' })
  }
})


export default router
