import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()
const prisma: any = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        tenant: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        permissions: { include: { permission: true } }
      }
    })

    if (!user || user.status === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const permissionsSet = new Set<string>()

    user.roles.forEach((ur: any) => {
      ur.role.permissions.forEach((rp: any) => {
        permissionsSet.add(rp.permission.code)
      })
    })

    user.permissions.forEach((up: any) => {

      if (up.type === 'allow') {
        permissionsSet.add(up.permission.code)
      } else if (up.type === 'deny') {
        permissionsSet.delete(up.permission.code)
      }
    })

    const token = jwt.sign(
      {
        id: user.id,
        tenantId: user.tenantId,
        orgId: user.orgId,
        username: user.username,
        permissions: Array.from(permissionsSet)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' }
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        orgId: user.orgId,
        permissions: Array.from(permissionsSet)
      },
      tenants
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        tenant: true,
        organization: true,
        roles: { include: { role: true } },
        permissions: { include: { permission: true } }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password, ...safeUser } = user

    res.json({
      ...safeUser,
      permissions: req.user?.permissions || []
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
