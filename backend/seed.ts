import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Check if tenant exists
  let tenant = await prisma.tenant.findUnique({ where: { code: 'default' } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: '默认租户',
        code: 'default',
        description: '系统默认创建的租户'
      }
    })
    console.log('Created default tenant')
  }

  // Check if organization exists
  let org = await prisma.organization.findFirst({ where: { tenantId: tenant.id } })
  if (!org) {
    org = await prisma.organization.create({
      data: {
        tenantId: tenant.id,
        name: '集团总部',
        code: 'GROUP_HQ',
        type: 'group',
        sort: 1
      }
    })
    console.log('Created group HQ organization')
    
    // Create a sub-company
    const company = await prisma.organization.create({
      data: {
        tenantId: tenant.id,
        parentId: org.id,
        name: '北京分公司',
        code: 'BJ_BRANCH',
        type: 'company',
        sort: 1
      }
    })
    
    // Create a department
    await prisma.organization.create({
      data: {
        tenantId: tenant.id,
        parentId: company.id,
        name: '研发部',
        code: 'BJ_DEV',
        type: 'department',
        sort: 1
      }
    })
  }

  // Create admin role
  let role = await prisma.role.findFirst({ where: { code: 'admin', tenantId: tenant.id } })
  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: '超级管理员',
        code: 'admin',
        description: '系统最高权限'
      }
    })
    console.log('Created admin role')
  }

  // Create permissions
  const pList = [
    { name: '用户管理', code: 'user:manage', type: 'menu' },
    { name: '组织架构管理', code: 'org:manage', type: 'menu' },
    { name: '角色管理', code: 'role:manage', type: 'menu' },
    { name: '表格管理', code: 'table:manage', type: 'menu' },
  ]
  
  for (const p of pList) {
    const existing = await prisma.permission.findUnique({ where: { code: p.code } })
    if (!existing) {
      await prisma.permission.create({ data: p })
    }
  }

  // Check if admin user exists
  let admin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        email: 'admin@example.com',
        roles: {
          create: [{ role: { connect: { id: role.id } } }]
        }
      }
    })
    console.log('Created admin user (admin / admin123)')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
