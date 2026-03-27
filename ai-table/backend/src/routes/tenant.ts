import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()
const prisma: any = new PrismaClient()

// Get all tenants
router.get('/', authenticate, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany()
    res.json(tenants)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' })
  }
})

// Create tenant
router.post('/', authenticate, async (req, res) => {
  try {
    const tenant = await prisma.tenant.create({ data: req.body })
    res.status(201).json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tenant' })
  }
})

// Update tenant
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = String(req.params.id)
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: req.body
    })
    res.json(tenant)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' })
  }
})

// Delete tenant
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = String(req.params.id)
    await prisma.tenant.delete({ where: { id: tenantId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tenant' })
  }
})

export default router
