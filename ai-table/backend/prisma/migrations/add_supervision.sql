-- 督办功能数据库迁移脚本
-- 执行此脚本添加督办相关表

-- 任务表（督办任务）
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
);

-- 任务下发目标表
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
);

-- 任务填写记录表
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
);

-- 催办记录表
CREATE TABLE IF NOT EXISTS "reminders" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "tasks_tenantId_idx" ON "tasks"("tenantId");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");
CREATE INDEX IF NOT EXISTS "task_targets_taskId_idx" ON "task_targets"("taskId");
CREATE INDEX IF NOT EXISTS "task_targets_fillToken_idx" ON "task_targets"("fillToken");
CREATE INDEX IF NOT EXISTS "task_submissions_taskId_idx" ON "task_submissions"("taskId");
CREATE INDEX IF NOT EXISTS "task_submissions_targetId_idx" ON "task_submissions"("targetId");

PRINT '督办功能表创建成功！';
