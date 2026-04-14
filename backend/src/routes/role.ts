import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/authMiddleware'
import { prisma } from '../utils/prisma'

const router = Router()

const getTenantId = (req: Request) => {
  return (req.headers['x-tenant-id'] as string) || req.user?.tenantId
}

const requireTenantId = (req: Request, res: Response) => {
  const tenantId = getTenantId(req)
  if (!tenantId) {
    res.status(400).json({ error: 'Missing tenant id' })
    return null
  }
  return tenantId
}

const replaceRolePermissions = async (tx: any, roleId: string, permissionIds?: string[]) => {
  if (!permissionIds) return

  await tx.rolePermission.deleteMany({ where: { roleId } })

  for (const permissionId of permissionIds) {
    await tx.rolePermission.create({
      data: { roleId, permissionId }
    })
  }
}

// Get roles
router.get('/', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: { include: { permission: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' })
  }
})

// Create role
router.post('/', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const { permissionIds, ...data } = req.body

    const role = await prisma.role.create({
      data: {
        ...data,
        tenantId,
        permissions: permissionIds
          ? {
              create: permissionIds.map((id: string) => ({ permission: { connect: { id } } }))
            }
          : undefined
      },
      include: {
        permissions: { include: { permission: true } }
      }
    })

    res.status(201).json(role)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create role' })
  }
})

// Update role
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const roleId = String(req.params.id)
    const existing = await prisma.role.findFirst({
      where: { id: roleId, tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Role not found' })
    }

    const { permissionIds, ...data } = req.body

    const role = await prisma.$transaction(async (tx: any) => {
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data
      })

      await replaceRolePermissions(tx, roleId, permissionIds)

      return tx.role.findUnique({
        where: { id: updatedRole.id },
        include: {
          permissions: { include: { permission: true } }
        }
      })
    })

    res.json(role)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' })
  }
})

// Assign permissions
router.post('/:id/permissions', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const roleId = String(req.params.id)
    const existing = await prisma.role.findFirst({
      where: { id: roleId, tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Role not found' })
    }

    const permissionIds = Array.isArray(req.body.permissionIds) ? req.body.permissionIds : []

    await prisma.$transaction(async (tx: any) => {
      await replaceRolePermissions(tx, roleId, permissionIds)
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign permissions' })
  }
})

// Delete role
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const roleId = String(req.params.id)
    const existing = await prisma.role.findFirst({
      where: { id: roleId, tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Role not found' })
    }

    await prisma.role.delete({ where: { id: roleId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete role' })
  }
})

export default router
