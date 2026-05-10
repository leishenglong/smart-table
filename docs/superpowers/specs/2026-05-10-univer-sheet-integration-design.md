# Univer Sheet 集成设计方案

## 1. 目标

用 Univer Sheet 替换现有 Vue 表格页面中的 `el-table` 组件，实现更强大的电子表格功能。

## 2. 范围

### 2.1 纳入范围
- `/table/:id` 页面 — 表格数据展示与编辑
- 数据加载与保存（同步模式）
- 基础字段类型渲染（text、number、date）
- 编辑权限控制

### 2.2 排除范围
- `/config/:id` 页面 — 保持现有实现不变
- AI 创建表格功能
- Excel 导入/导出功能（暂时搁置）
- 协同编辑功能

### 2.3 后续扩展
- select 下拉选择字段自定义渲染器
- checkbox 复选框字段自定义渲染器
- Excel 导入/导出与 Univer 集成

## 3. 架构

### 3.1 技术栈
- **Univer 版本**: latest (@univerjs/core, @univerjs/ui, @univerjs/engine)
- **集成方式**: @univerjs/vue
- **框架**: Vue 3 Composition API

### 3.2 数据流

```
┌─────────────┐      GET /api/data/:tableId      ┌─────────────┐
│  后端 API   │ ◄────────────────────────────── │  Vue 组件   │
│  (现有)     │ ───────────────────────────────► │  (改造)     │
└─────────────┘      PUT/POST/DELETE             └─────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────┐
                                              │ Univer Sheet│
                                              │  (渲染/编辑) │
                                              └─────────────┘
```

1. **初始化**: 调用 `GET /api/tables/:id` 获取表格配置
2. **加载数据**: 调用 `GET /api/data/:tableId` 获取行数据，转换为 Univer 格式
3. **编辑数据**: 监听 Univer 变更事件，调用 API 保存
4. **权限校验**: 调用后端权限 API，根据用户角色设置 Univer 只读模式

### 3.3 目录结构

```
frontend/src/views/table/
├── index.vue              # 主页面（改用 Univer）
├── components/
│   ├── UniverSheet.vue    # Univer 包装组件
│   ├── CellRenderers/     # 自定义单元格渲染器
│   │   ├── SelectRenderer.ts
│   │   └── CheckboxRenderer.ts
│   └── PermissionGuard.vue # 权限控制组件
└── composables/
    ├── useUniverSheet.ts  # Univer Sheet 逻辑
    └── useTableData.ts    # 表格数据加载/保存
```

## 4. 组件设计

### 4.1 UniverSheet.vue

Univer Sheet 的 Vue 包装组件，负责初始化和生命周期管理。

**Props:**
- `tableId: string` — 表格 ID
- `fields: TableField[]` — 字段配置
- `readonly: boolean` — 只读模式
- `initialData: TableRow[]` — 初始数据

**Events:**
- `change` — 数据变更事件
- `save` — 保存请求事件

**核心逻辑:**
1. 在 `onMounted` 初始化 Univer Workbook
2. 根据 fields 生成 Univer 列定义
3. 将 initialData 写入 Sheet
4. 监听变更事件，触发 save 事件

### 4.2 权限控制

**readonly 模式实现:**
```typescript
// 设置整个 Sheet 为只读
workbook.getActiveSheet().set Schutz(true)
// 或者
univerSheet.setEditable(false)
```

**权限判断逻辑:**
1. 调用 `/api/tables/:id` 获取表格信息
2. 获取当前用户角色
3. 判断：超管/授权用户 → 可编辑，其他 → 只读

## 5. API 适配

### 5.1 数据转换

**后端数据格式 → Univer 格式:**
```typescript
interface TableRow {
  id: string
  rowData: Record<string, any>
  orgId: string
  createdAt: string
}

interface UniverRow {
  [key: string]: any  // 列名: 值
}
```

转换逻辑:
```typescript
const univerData = tableRows.map(row => ({
  id: row.id,
  ...row.rowData
}))
```

### 5.2 字段类型映射

| 现有字段类型 | Univer 单元格类型 | 备注 |
|------------|------------------|------|
| text | String | 原生支持 |
| number | Number | 原生支持 |
| date | String (日期字符串) | 后续可扩展日期类型 |
| email | String | 原生支持，格式校验可选 |
| phone | String | 原生支持 |
| select | String | 自定义渲染器（后续） |
| checkbox | Boolean | 自定义渲染器（后续） |

## 6. 实施步骤

### Phase 1: 基础集成
1. 安装 Univer 依赖
2. 创建 `UniverSheet.vue` 基础组件
3. 替换 `table/index.vue` 中的 el-table
4. 实现数据加载
5. 实现只读模式权限控制

### Phase 2: 编辑功能
1. 实现单元格编辑
2. 实现新增行
3. 实现删除行
4. 实现排序/筛选（利用 Univer 内置能力）

### Phase 3: 自定义渲染器（后续）
1. Select 下拉渲染器
2. Checkbox 复选框渲染器

## 7. 依赖清单

```json
{
  "@univerjs/core": "^x.x.x",
  "@univerjs/ui": "^x.x.x",
  "@univerjs/engine": "^x.x.x",
  "@univerjs/vue": "^x.x.x",
  "@univerjs/icons-vue": "^x.x.x"
}
```

> 注：具体版本需要在安装时确认 latest 版本

## 8. 风险与应对

| 风险 | 影响 | 应对措施 |
|-----|------|---------|
| Univer 与 Vue 3 兼容性 | 高 | 先验证 Demo，@univerjs/vue 官方支持 Vue 3 |
| 复杂字段类型渲染 | 中 | Phase 1 先用基础类型，自定义渲染器后续实现 |
| 性能问题（大数据量） | 中 | 分页加载，Univer 支持大数据量 |

## 9. 测试计划

### 9.1 单元测试
- 数据转换函数
- 权限判断逻辑

### 9.2 集成测试
- 页面加载正常显示
- 数据加载/保存流程
- 只读模式验证

### 9.3 手动测试
- 表格 CRUD 操作
- 权限场景验证（超管 vs 普通用户）
- 与现有 config 页面的兼容性
