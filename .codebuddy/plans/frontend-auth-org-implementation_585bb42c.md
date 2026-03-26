---
name: frontend-auth-org-implementation
overview: 完成前端多租户支持、央企组织架构管理及用户角色权限功能的UI页面和接口联调。
design:
  architecture:
    framework: vue
  styleKeywords:
    - 企业级
    - 清晰整洁
    - 高效交互
  fontSystem:
    fontFamily: PingFang-SC, Inter, system-ui
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#409EFF"
      - "#337ECC"
      - "#79BBFF"
    background:
      - "#F5F7FA"
      - "#FFFFFF"
    text:
      - "#303133"
      - "#606266"
      - "#909399"
    functional:
      - "#67C23A"
      - "#F56C6C"
      - "#E6A23C"
todos:
  - id: setup-request-store
    content: 初始化Axios拦截器并创建Pinia用户状态Store，重构原API文件
    status: completed
  - id: create-api-modules
    content: 创建Auth、Tenant、Organization、User、Role相关的前端API请求模块
    status: completed
    dependencies:
      - setup-request-store
  - id: implement-login-layout
    content: 实现用户登录页面和包含菜单、顶部租户/用户状态栏的系统布局
    status: completed
    dependencies:
      - create-api-modules
  - id: implement-organization
    content: 开发央企组织架构树管理页，支持多级部门的增删改查
    status: completed
    dependencies:
      - implement-login-layout
  - id: implement-role
    content: 开发角色管理页面，支持角色的创建及权限资源的勾选分配
    status: completed
    dependencies:
      - implement-login-layout
  - id: implement-user
    content: 开发用户管理页面，支持分配角色及为特定人员直接配置允许/拒绝权限
    status: completed
    dependencies:
      - implement-role
      - implement-organization
---

## 产品概述

为当前系统补充多租户、央企多级组织架构（集团、公司、部门）以及细粒度的人员和角色权限管理功能前端页面和逻辑。

## 核心功能

- **登录与多租户隔离**：支持用户登录并获取租户上下文，系统布局头部提供租户切换功能（如适用）。
- **央企组织架构管理**：以树形结构呈现复杂的组织关系（包含集团、公司、部门层级），支持组织节点的增删改查。
- **角色与权限管理**：支持角色的创建与权限资源（菜单、按钮等）的分配。
- **用户管理与直接授权**：用户基础信息管理、所属组织和租户的分配、角色的授予，并支持越过角色直接给特定人员设定允许或拒绝的权限（白名单/黑名单机制）。

## 技术选型

- **前端框架**：Vue 3 (Composition API) + TypeScript
- **状态管理**：Pinia (管理用户信息、当前租户、Token及权限列表)
- **UI 组件库**：Element Plus (现存，用于树形控件、表格、弹窗、表单等)
- **样式方案**：Tailwind CSS (响应式布局与辅助样式)
- **网络请求**：Axios (封装全局请求拦截器，自动携带 JWT Token 和租户 ID 头)

## 架构与实现设计

### 数据流向

1. 登录时存储 JWT 并获取当前用户信息、默认租户ID。
2. 配置 Axios 请求拦截器（`src/utils/request.ts`），向每次请求注入 `Authorization` (Token) 和自定义头 `x-tenant-id` (便于后端识别上下文)。
3. 组件内通过 Pinia Store 读写和切换当前的租户及权限信息。

### 目录结构规划

```text
project-root/
└── src/
    ├── api/
    │   ├── auth.ts         # [NEW] 登录、获取当前用户信息接口
    │   ├── organization.ts # [NEW] 组织架构树获取、增删改查接口
    │   ├── user.ts         # [NEW] 用户 CRUD、分配角色、分配人员独立权限接口
    │   ├── role.ts         # [NEW] 角色 CRUD、分配权限接口
    │   ├── permission.ts   # [NEW] 权限列表接口
    │   └── table.ts        # [MODIFY] 迁移至使用新的全局统一 Axios 实例
    ├── store/
    │   └── user.ts         # [NEW] 定义 auth store, 管理 token、当前 user info、tenant info
    ├── utils/
    │   └── request.ts      # [NEW] 统一 Axios 封装，拦截 401 及自动加 Token
    └── views/
        ├── login/
        │   └── index.vue   # [NEW] 登录页，包含账号密码表单及登录逻辑
        ├── layout/
        │   └── index.vue   # [NEW] 主框架页，包含侧边菜单栏、顶部导航（含租户展示/切换、用户注销）
        ├── organization/
        │   └── index.vue   # [NEW] 组织架构管理页，使用 ElTree 展示多级央企架构
        ├── role/
        │   └── index.vue   # [NEW] 角色管理页，包含角色表格及授权抽屉/弹窗 (ElTree 权限树)
        └── user/
            └── index.vue   # [NEW] 用户管理页，包含用户表格，分配角色弹窗及"独立权限配置"弹窗
```

## 设计风格

采用现代企业级后台系统设计规范 (Material Design / Clean Minimalist)。整体界面保持整洁专注，使用清晰的视觉层次来处理复杂的央企组织架构和权限树配置。交互上强调高效和流畅，提供即时反馈。