const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrate() {
  try {
    console.log('开始创建督办功能表...')
    
    // 创建任务表
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tenantId" TEXT NOT NULL,
        "tableId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "deadline" DATETIME,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "requireLogin" INTEGER NOT NULL DEFAULT 0,
        "allowAnonymous" INTEGER NOT NULL DEFAULT 1,
        "createdBy" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `)
    console.log('✓ 任务表创建成功')
    
    // 创建任务下发目标表
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "task_targets" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "targetName" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "fillToken" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE
      )
    `)
    console.log('✓ 任务下发目标表创建成功')
    
    // 创建任务填写记录表
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "task_submissions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "userId" TEXT,
        "userName" TEXT,
        "data" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "submittedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        FOREIGN KEY ("targetId") REFERENCES "task_targets"("id") ON DELETE CASCADE
      )
    `)
    console.log('✓ 任务填写记录表创建成功')
    
    // 创建催办记录表
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT NOT NULL,
        "targetId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ 催办记录表创建成功')
    
    console.log('\n✅ 督办功能迁移完成！')
    
  } catch (error) {
    console.error('迁移失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
