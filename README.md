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

# 执行数据库迁移
npx prisma migrate dev --name init

# (可选) 打开 Prisma Studio 查看数据
npx prisma studio
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

### 数据管理
- `GET /api/data/:tableId` - 获取表格数据(支持分页、排序)
- `POST /api/data/:tableId` - 新增数据行
- `PUT /api/data/:tableId/:id` - 更新数据行
- `DELETE /api/data/:tableId/:id` - 删除数据行

### AI 解析
- `POST /api/ai/parse` - 解析自然语言生成表格配置

## 开发说明

### 环境变量

后端 `.env` 文件:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
```

### 数据库模型

项目使用 Prisma ORM,数据库模型定义在 `backend/prisma/schema.prisma`:
- `TableConfig` - 表格配置表
- `TableField` - 字段定义表
- `DynamicData` - 动态数据表

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

## License

MIT
