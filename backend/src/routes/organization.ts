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

// Get organization tree
router.get('/tree', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const orgs = await prisma.organization.findMany({
      where: { tenantId },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }]
    })

    const map = new Map<string, any>()
    const roots: any[] = []

    orgs.forEach((org: any) => {
      map.set(org.id, { ...org, children: [] })
    })

    orgs.forEach((org: any) => {

      if (org.parentId) {
        const parent = map.get(org.parentId)
        if (parent) {
          parent.children.push(map.get(org.id))
        } else {
          roots.push(map.get(org.id))
        }
      } else {
        roots.push(map.get(org.id))
      }
    })

    res.json(roots)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organizations' })
  }
})

// Create org
router.post('/', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const org = await prisma.organization.create({
      data: {
        ...req.body,
        tenantId
      }
    })
    res.status(201).json(org)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create organization' })
  }
})

// Update org
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const existing = await prisma.organization.findFirst({
      where: { id: String(req.params.id), tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    const org = await prisma.organization.update({
      where: { id: String(req.params.id) },
      data: req.body
    })
    res.json(org)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update organization' })
  }
})

// Delete org
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = requireTenantId(req, res)
    if (!tenantId) return

    const existing = await prisma.organization.findFirst({
      where: { id: String(req.params.id), tenantId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    await prisma.organization.delete({ where: { id: String(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete organization' })
  }
})

export default router
