# 动态表格系统

一个智能的动态表格系统,支持多种方式创建表格(自然语言/AI、可视化配置、JSON导入),具备完整的CRUD、排序筛选分页、单元格编辑等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Element Plus + TailwindCSS
- **后端**: Node.js + Express + TypeScript + Prisma
- **数据库**: SQLite

## 功能特性

### 表格创建方式
- 🤖 **AI智能创建**: 输入自然语言描述,自动生成表格结构
- 🎨 **可视化配置**: 拖拽式界面,自由配置字段类型和属性
- 📄 **JSON导入**: 支持JSON配置文件快速创建

### 表格功能
- ✅ 增删改查(CRUD)
- ✅ 排序、筛选、分页
- ✅ 单元格编辑
- ✅ Excel导出

### 字段类型
- 文本(text)
- 数字(number)
- 日期(date)
- 邮箱(email)
- 手机号(phone)
- 下拉选择(select)
- 复选框(checkbox)

### 权限控制
- 🔐 **表格级权限**: 创建者 + 授权组织可访问
- 🔐 **数据级权限**: 组织树继承（用户只能查看自己和子组织的数）
- 🔐 **超管权限**: admin用户或拥有 `*:*`/`admin` 权限可访问全部

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 初始化数据库

```bash
cd backend

# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push
```

### 3. 启动项目

**启动后端服务**(在 backend 目录):
```bash
npm run dev
```
后端服务将运行在 http://localhost:3000

**启动前端服务**(在 frontend 目录):
```bash
npm run dev
```
前端服务将运行在 http://localhost:5173

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 项目结构

```
d:/code/
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   │   ├── home/     # 首页
│   │   │   ├── table/    # 表格展示页
│   │   │   └── config/   # 表格配置页
│   │   ├── api/          # API 封装
│   │   ├── types/        # TypeScript 类型
│   │   └── router/       # 路由配置
│   └── package.json
│
├── backend/              # 后端项目
│   ├── src/
│   │   ├── routes/       # 路由
│   │   ├── services/     # 服务
│   │   ├── middleware/   # 中间件
│   │   └── app.ts        # 应用入口
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── package.json
│
└── README.md
```

## API 接口

### 表格配置
- `GET /api/tables` - 获取所有表格
- `GET /api/tables/:id` - 获取单个表格
- `POST /api/tables` - 创建表格
- `PUT /api/tables/:id` - 更新表格
- `DELETE /api/tables/:id` - 删除表格
- `PUT /api/tables/:id/fields` - 更新字段配置
- `PUT /api/tables/:id/allowed-orgs` - 更新授权组织

### 数据管理
- `GET /api/data/:tableId` - 获取表格数据(支持分页、排序)
- `POST /api/data/:tableId` - 新增数据行
- `PUT /api/data/:tableId/:id` - 更新数据行
- `DELETE /api/data/:tableId/:id` - 删除数据行
- `PUT /api/data/:tableId/batch-org` - 批量设置数据归属组织

### AI 解析
- `POST /api/ai/parse` - 解析自然语言生成表格配置

### 权限相关
- `GET /api/supervision/organizations` - 获取组织树

## 权限说明

### 权限判断规则

| 判断条件 | 说明 |
|---------|------|
| `permissions = []` 或 `null` | 超管（如初始 admin 用户） |
| `permissions.includes('*:*')` | 超管权限 |
| `permissions.includes('admin')` | 超管权限 |
| `Organization.type = 'group'` | 集团层面 |

### 操作权限矩阵

| 操作 | 超管 | 集团层面 | 其他用户 |
|------|------|----------|----------|
| 创建表格 | ✓ | ✓ | ✗ |
| 管理表格授权 | ✓ | ✓（创建者/集团） | ✗ |
| 查看表格 | 全部 | 授权组织 | 授权组织 |
| 新增数据 | ✓ | ✓ | ✗ |
| 设置数据归属 | ✓ | ✓（集团层面） | ✗ |
| 查看数据 | 全部 | 本组织及子组织 | 本组织及子组织 |

### 组织树权限继承

数据权限基于组织树继承实现：
- 用户可访问 **自己所在组织** 及 **所有子组织** 的数据
- 例如：集团用户可查看所有数据，分公司用户只能查看分公司及子部门数据

### 表格授权规则

1. **创建者权限**: 表格创建者始终可以访问自己的表格
2. **授权组织**: `allowedOrgs` 字段存储允许访问的组织ID列表
3. **继承机制**: 授权给父组织后，其子组织自动继承访问权限（后端自动处理）

## 开发说明

### 环境变量

后端 `.env` 文件:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
```

### 数据库模型

项目使用 Prisma ORM,数据库模型定义在 `backend/prisma/schema.prisma`:

| 模型 | 说明 |
|------|------|
| `TableConfig` | 表格配置表（含 `createdBy`, `allowedOrgs` 字段） |
| `TableField` | 字段定义表 |
| `DynamicData` | 动态数据表（含 `orgId` 字段用于权限控制） |
| `Organization` | 组织架构表（支持多级树形结构） |
| `User` | 用户表 |
| `Task` | 督办任务表 |

## 使用示例

### AI 创建表格
1. 点击首页"AI智能创建"
2. 输入描述: `创建一个员工管理表,包含姓名、工号、部门、入职日期、邮箱`
3. 点击"解析"查看结果
4. 点击"创建表格"完成创建

### 可视化配置
1. 点击首页"可视化配置"
2. 添加字段,选择类型
3. 配置字段属性(必填、选项等)
4. 点击"保存配置"

### 表格授权管理
1. 进入表格配置页面
2. 点击右上角「授权管理」按钮
3. 在组织树中选择允许访问的组织
4. 点击「保存授权」

### 数据归属设置
1. 进入表格数据页面
2. 勾选要设置的数据行
3. 点击「设置归属」按钮
4. 选择目标组织
5. 点击「确定」完成设置

### JSON 导入
```json
{
  "name": "产品信息表",
  "fields": [
    {"name": "产品名称", "type": "text", "required": true},
    {"name": "价格", "type": "number", "required": true},
    {"name": "库存", "type": "number"},
    {"name": "状态", "type": "select", "config": {"options": ["上架", "下架"]}}
  ]
}
```

## 测试数据

系统内置完整的测试数据，位于 `backend/prisma/seed_test_data.sql`。

### 组织架构（4级）

```
华新科技集团总部
├── 北京分公司
│   ├── 研发部
│   │   ├── 前端组
│   │   └── 后端组
│   └── 市场部
├── 上海分公司
│   ├── 技术部
│   │   ├── 基础架构组
│   │   └── 应用支持组
│   └── 销售部
└── 深圳分公司
    ├── 运维部
    │   ├── 运维一组
    │   └── 运维二组
    └── 客服部
```

### 测试账号

| 用户名 | 密码 | 所属组织 | 权限说明 |
|--------|------|----------|----------|
| admin | 123456 | 集团总部 | 超管，可访问所有功能 |
| zhaoyong | 123456 | 集团总部 | 超管 |
| wangfeng | 123456 | 北京分公司 | 经理，可查看授权表格 |
| liuyang | 123456 | 北京研发部 | 经理，设备清单创建者 |
| wujie | 123456 | 上海技术部 | 经理，技术部巡检记录创建者 |
| tangyin | 123456 | 深圳运维部 | 经理，运维工单统计创建者 |

### 预置表格

| 表格名称 | 创建者 | 授权组织 | 说明 |
|----------|--------|----------|------|
| 员工信息表 | admin | 集团+所有分公司 | 全体员工信息 |
| 项目进度表 | admin | 北京分公司 | 仅北分可见 |
| 北京分公司设备清单 | liuyang | 集团+北京分公司 | 设备登记 |
| 月度销售报表 | admin | 集团+所有分公司 | 各分公司销售汇总 |
| 技术部巡检记录 | wujie | 上海技术部 | 仅技术部可见 |
| 运维工单统计 | tangyin | 集团+深圳运维部 | 工单统计 |

## License

MIT
