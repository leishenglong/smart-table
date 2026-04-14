import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma'

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        tenantId: string
        orgId: string | null
        username: string
        permissions: string[]
      }
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'your-secret-key'
    
    const decoded = jwt.verify(token, secret) as any
    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const requirePermission = (permissionCode: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || []
    
    // Check if user has the specific permission or is a super admin
    if (userPermissions.includes(permissionCode) || userPermissions.includes('*:*')) {
      next()
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
    }
  }
}
