import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()
const prisma: any = new PrismaClient()


const ensureParentPermission = async (parentId?: string | null) => {
  if (!parentId) return true

  const parent = await prisma.permission.findUnique({ where: { id: parentId } })
  return !!parent
}

// Get permission tree
router.get('/tree', authenticate, async (_req, res) => {

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })

    const map = new Map<string, any>()
    const roots: any[] = []

    permissions.forEach((permission: any) => {
      map.set(permission.id, { ...permission, children: [] })
    })

    permissions.forEach((permission: any) => {

      if (permission.parentId) {
        const parent = map.get(permission.parentId)
        if (parent) {
          parent.children.push(map.get(permission.id))
        } else {
          roots.push(map.get(permission.id))
        }
      } else {
        roots.push(map.get(permission.id))
      }
    })

    res.json(roots)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' })
  }
})

// Create permission
router.post('/', authenticate, async (req, res) => {
  try {
    const { parentId } = req.body

    if (!(await ensureParentPermission(parentId))) {
      return res.status(400).json({ error: 'Parent permission not found' })
    }

    const permission = await prisma.permission.create({ data: req.body })
    res.status(201).json(permission)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create permission' })
  }
})

// Update permission
router.put('/:id', authenticate, async (req, res) => {
  try {
    const permissionId = String(req.params.id)
    const existing = await prisma.permission.findUnique({ where: { id: permissionId } })

    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' })
    }

    if (req.body.parentId === permissionId) {
      return res.status(400).json({ error: 'Permission cannot be its own parent' })
    }

    if (!(await ensureParentPermission(req.body.parentId))) {
      return res.status(400).json({ error: 'Parent permission not found' })
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: req.body
    })

    res.json(permission)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permission' })
  }
})

// Delete permission
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const permissionId = String(req.params.id)
    const existing = await prisma.permission.findUnique({ where: { id: permissionId } })

    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' })
    }

    const [childCount, roleUsageCount, userUsageCount] = await Promise.all([
      prisma.permission.count({ where: { parentId: permissionId } }),
      prisma.rolePermission.count({ where: { permissionId } }),
      prisma.userPermission.count({ where: { permissionId } })
    ])

    if (childCount > 0) {
      return res.status(400).json({ error: 'Please delete child permissions first' })
    }

    if (roleUsageCount > 0 || userUsageCount > 0) {
      return res.status(400).json({ error: 'Permission is in use and cannot be deleted' })
    }

    await prisma.permission.delete({ where: { id: permissionId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete permission' })
  }
})

export default router

