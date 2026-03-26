import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'
import bcrypt from 'bcrypt'

const router = Router()
const prisma: any = new PrismaClient()

type DirectPermissionInput = {
  permissionId: string
  type: 'allow' | 'deny'
}

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

const sanitizeUser = <T extends { password?: string }>(user: T) => {
  const { password, ...safeUser } = user
  return safeUser
}

const replaceUserRoles = async (tx: any, userId: string, roleIds?: string[]) => {
  if (!roleIds) return

  await tx.userRole.deleteMany({ where: { userId } })

  if (roleIds.length > 0) {
    await tx.userRole.createMany({
      data: roleIds.map(roleId => ({ userId, roleId }))
    })
  }
}

const replaceUserPermissions = async (
  tx: any,
  userId: string,
  directPermissions?: DirectPermissionInput[]
) => {
  if (!directPermissions) return

  await tx.userPermission.deleteMany({ where: { userId } })

  if (directPermissions.length > 0) {
    await tx.userPermission.createMany({
      data: directPermissions.map(item => ({
        userId,
        permissionId: item.permissionId,
        type: item.type
      }))
    })
  }
}

const getDirectPermissionsFromBody = (body: any): DirectPermissionInput[] | undefined => {
  if (Array.isArray(body.directPermissions)) {
    return body.directPermissions
  }

  if (Array.isArray(body.permissions)) {
    return body.permissions
  }

  if (Array.isArray(body.permissionIds)) {
    return body.permissionIds.map((permissionId: string) => ({
      permissionId,
      type: 'allow' as const
    }))
  }

  return undefined
}

const ensureTenantUser = async (userId: string, tenantId: string) => {
  return prisma.user.findFirst({
    where: { id: userId, tenantId }
  })
}

// Get users
router.get('/', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const { orgId } = req.query
    const where: any = { tenantId }
    if (orgId) where.orgId = String(orgId)

    const users = await prisma.user.findMany({
      where,
      include: {
        organization: true,
        roles: { include: { role: true } },
        permissions: { include: { permission: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(users.map(sanitizeUser))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Create user
router.post('/', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const { roleIds, password, ...data } = req.body
    const directPermissions = getDirectPermissionsFromBody(req.body)
    const hashedPassword = await bcrypt.hash(password || '123456', 10)

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        tenantId,
        roles: roleIds
          ? {
              create: roleIds.map((id: string) => ({ role: { connect: { id } } }))
            }
          : undefined,
        permissions: directPermissions
          ? {
              create: directPermissions.map(item => ({
                permission: { connect: { id: item.permissionId } },
                type: item.type
              }))
            }
          : undefined
      },
      include: {
        organization: true,
        roles: { include: { role: true } },
        permissions: { include: { permission: true } }
      }
    })

    res.status(201).json(sanitizeUser(user))
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const userId = String(req.params.id)
    const existing = await ensureTenantUser(userId, tenantId)
    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { roleIds, password, ...data } = req.body
    const directPermissions = getDirectPermissionsFromBody(req.body)

    const updateData: any = { ...data }
    delete updateData.permissionIds
    delete updateData.directPermissions
    delete updateData.permissions

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: updateData
      })

      await replaceUserRoles(tx, userId, roleIds)
      await replaceUserPermissions(tx, userId, directPermissions)

      return tx.user.findUnique({
        where: { id: userId },
        include: {
          organization: true,
          roles: { include: { role: true } },
          permissions: { include: { permission: true } }
        }
      })
    })

    res.json(user ? sanitizeUser(user) : null)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Assign roles
router.post('/:id/roles', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const userId = String(req.params.id)
    const existing = await ensureTenantUser(userId, tenantId)
    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const roleIds = Array.isArray(req.body.roleIds) ? req.body.roleIds : []

    await prisma.$transaction(async (tx: any) => {
      await replaceUserRoles(tx, userId, roleIds)
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign roles' })
  }
})

// Assign direct permissions
router.post('/:id/permissions', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const userId = String(req.params.id)
    const existing = await ensureTenantUser(userId, tenantId)
    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : []

    await prisma.$transaction(async (tx: any) => {
      await replaceUserPermissions(tx, userId, permissions)
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign permissions' })
  }
})

// Delete user
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const userId = String(req.params.id)
    const existing = await ensureTenantUser(userId, tenantId)
    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    await prisma.user.delete({ where: { id: userId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
