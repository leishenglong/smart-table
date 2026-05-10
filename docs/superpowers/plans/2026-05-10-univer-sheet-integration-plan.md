# Univer Sheet 集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Univer Sheet 替换 `/table/:id` 页面中的 el-table，实现数据加载、编辑保存和权限控制。

**Architecture:** 同步模式 — 调用后端 REST API 获取数据，转换为 Univer Sheet 格式渲染；编辑后通过 API 保存。前端根据用户角色控制只读/编辑模式。

**Tech Stack:** Univer Sheet + Vue 3 Composition API + TypeScript

---

## 文件结构

```
frontend/src/views/table/
├── index.vue                    # 主页面（改造）
├── UniverSheet.vue              # Univer 包装组件（新建）
└── composables/
    └── useUniverSheet.ts        # Univer Sheet 逻辑（新建）

frontend/src/types/
└── univer.ts                    # Univer 类型定义（新建）
```

---

## Task 1: 安装 Univer 依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 查看当前 package.json**

Run: `cat frontend/package.json`
确认现有依赖版本

- [ ] **Step 2: 安装 Univer 核心依赖**

Run:
```bash
cd frontend
npm install @univerjs/core @univerjs/ui @univerjs/engine @univerjs/vue @univerjs/icons-vue
```

- [ ] **Step 3: 验证安装**

Run: `npm list @univerjs/core @univerjs/vue`
Expected: 显示已安装的版本

- [ ] **Step 4: 提交**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install univer sheet dependencies"
```

---

## Task 2: 创建 Univer 类型定义

**Files:**
- Create: `frontend/src/types/univer.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
import type { IWorkbookData } from '@univerjs/core'

// 表格配置（来自后端）
export interface TableConfig {
  id?: string
  name: string
  description?: string
  config: Record<string, any>
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
}

// 字段配置
export interface TableField {
  id?: string
  name: string
  type: FieldType
  required: boolean
  config: FieldConfig
  order?: number
}

export type FieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'checkbox'

export interface FieldConfig {
  options?: string[]
  min?: number
  max?: number
  placeholder?: string
  default?: any
  fixed?: 'left' | 'right'
}

// 表格数据行（来自后端）
export interface TableRow {
  id: string
  tableId: string
  rowData: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

// Univer 单元格数据
export type CellValue = string | number | boolean | null

// 转换后的行数据（用于 Univer）
export interface UniverRow {
  id: string
  [key: string]: CellValue
}

// 字段类型到 Univer 单元格类型的映射
export const FIELD_TYPE_TO_UNIVER = {
  text: 's',        // string
  number: 'n',      // number
  date: 's',       // string (显示为文本)
  email: 's',      // string
  phone: 's',      // string
  select: 's',      // string
  checkbox: 'b'    // boolean
} as const
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/types/univer.ts
git commit -m "feat: add univer type definitions"
```

---

## Task 3: 创建 useUniverSheet composable

**Files:**
- Create: `frontend/src/views/table/composables/useUniverSheet.ts`

- [ ] **Step 1: 创建 composable 文件**

```typescript
import { ref, shallowRef, type Ref } from 'vue'
import type { IWorkbookData } from '@univerjs/core'
import type { TableConfig, TableField, TableRow, UniverRow } from '@/types/univer'

// 字段类型到 Univer 值的转换
function convertFieldToUniverValue(value: any, type: string): any {
  if (value === null || value === undefined) return ''
  switch (type) {
    case 'checkbox':
      return value ? true : false
    case 'number':
      return Number(value) || 0
    default:
      return String(value)
  }
}

// Univer 值转回原始值
function convertUniverToFieldValue(value: any, type: string): any {
  if (value === null || value === undefined) return null
  switch (type) {
    case 'checkbox':
      return Boolean(value)
    case 'number':
      return Number(value)
    default:
      return String(value)
  }
}

// 后端数据转换为 Univer 格式
export function convertToUniverData(rows: TableRow[], fields: TableField[]): UniverRow[] {
  return rows.map(row => {
    const univerRow: UniverRow = { id: row.id }
    fields.forEach(field => {
      univerRow[field.name] = convertFieldToUniverValue(row.rowData[field.name], field.type)
    })
    return univerRow
  })
}

// Univer 数据转回后端格式
export function convertFromUniverData(
  univerData: UniverRow[],
  fields: TableField[]
): { id: string; rowData: Record<string, any> }[] {
  return univerData.map(row => {
    const rowData: Record<string, any> = {}
    fields.forEach(field => {
      rowData[field.name] = convertUniverToFieldValue(row[field.name], field.type)
    })
    return {
      id: row.id,
      rowData
    }
  })
}

// 构建 Univer Workbook 数据
export function buildWorkbookData(config: TableConfig, rows: TableRow[]): IWorkbookData {
  const fields = config.fields || []
  const headers = fields.map(f => f.name)
  const univerRows = convertToUniverData(rows, fields)

  // 构建单元格数据
  const cellData: Record<string, Record<string, any>> = {}

  // 添加表头行
  cellData[0] = {}
  headers.forEach((header, colIndex) => {
    cellData[0][colIndex] = {
      v: header,
      t: 's' // string
    }
  })

  // 添加数据行
  univerRows.forEach((row, rowIndex) => {
    cellData[rowIndex + 1] = {}
    fields.forEach((field, colIndex) => {
      const value = row[field.name]
      const univerType = field.type === 'checkbox' ? 'b' : field.type === 'number' ? 'n' : 's'
      cellData[rowIndex + 1][colIndex] = {
        v: value,
        t: univerType
      }
    })
  })

  // 构建列宽（固定值，后续可优化）
  const columnData: Record<string, { width: number }> = {}
  fields.forEach((_, colIndex) => {
    columnData[colIndex] = { width: 120 }
  })

  return {
    id: config.id || '',
    name: config.name || 'Sheet1',
    sheetData: {
      'sheet-1': {
        id: 'sheet-1',
        cellData,
        rowData: {},
        columnData,
        rowCount: univerRows.length + 1,
        columnCount: fields.length
      }
    },
    sheets: {
      'sheet-1': {
        id: 'sheet-1',
        name: config.name || 'Sheet1',
        type: 0 // 普通 sheet
      }
    }
  }
}

export function useUniverSheet() {
  const workbookData = shallowRef<IWorkbookData | null>(null)
  const isLoading = ref(false)
  const isReadonly = ref(false)

  // 设置只读模式
  function setReadonly(readonly: boolean) {
    isReadonly.value = readonly
  }

  // 构建 workbook 数据
  function setData(config: TableConfig, rows: TableRow[]) {
    workbookData.value = buildWorkbookData(config, rows)
  }

  // 清除数据
  function clearData() {
    workbookData.value = null
  }

  return {
    workbookData,
    isLoading,
    isReadonly,
    setReadonly,
    setData,
    clearData,
    convertToUniverData,
    convertFromUniverData
  }
}
```

- [ ] **Step 2: 创建目录**

Run: `mkdir -p frontend/src/views/table/composables`

- [ ] **Step 3: 提交**

```bash
git add frontend/src/views/table/composables/useUniverSheet.ts
git commit -m "feat: add useUniverSheet composable"
```

---

## Task 4: 创建 UniverSheet.vue 组件

**Files:**
- Create: `frontend/src/views/table/UniverSheet.vue`

- [ ] **Step 1: 创建 UniverSheet.vue**

```vue
<template>
  <div class="univer-sheet-container" ref="containerRef">
    <UniverSheet
      v-if="workbookData"
      :data="workbookData"
      :custom-components="customComponents"
      :disabled="isReadonly"
    />
    <div v-else-if="isLoading" class="flex items-center justify-center h-full">
      <el-icon class="is-loading text-2xl text-primary"><Loading /></el-icon>
    </div>
    <div v-else class="flex items-center justify-center h-full text-text-tertiary">
      暂无数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { UniverSheet, type IWorkbookData, type UniverSheetProps } from '@univerjs/vue'
import { Loading } from 'lucide-vue-next'
import type { TableConfig, TableRow } from '@/types/univer'
import { useUniverSheet } from './composables/useUniverSheet'

interface Props {
  config: TableConfig | null
  data: TableRow[]
  readonly?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'dataChange', data: TableRow[]): void
  (e: 'cellChange', rowId: string, fieldName: string, value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  loading: false
})

const emit = defineEmits<Emits>()

const containerRef = ref<HTMLElement | null>(null)

const {
  workbookData,
  isReadonly,
  setReadonly,
  setData
} = useUniverSheet()

// 监听 props 变化
watch(
  () => [props.config, props.data],
  ([config, data]) => {
    if (config && Array.isArray(data)) {
      setData(config as TableConfig, data as TableRow[])
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.readonly,
  (readonly) => {
    setReadonly(readonly)
  }
)

// 自定义组件（目前为空，后续可扩展）
const customComponents: UniverSheetProps['customComponents'] = []

onMounted(() => {
  if (props.readonly !== undefined) {
    setReadonly(props.readonly)
  }
})
</script>

<style scoped>
.univer-sheet-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/views/table/UniverSheet.vue
git commit -m "feat: add UniverSheet wrapper component"
```

---

## Task 5: 改造 table/index.vue 主页面

**Files:**
- Modify: `frontend/src/views/table/index.vue`

**注意：这是一个大文件改造，需要仔细操作**

- [ ] **Step 1: 备份当前文件**

Run: `cp frontend/src/views/table/index.vue frontend/src/views/table/index.vue.bak`

- [ ] **Step 2: 读取当前文件确认内容**

Run: `wc -l frontend/src/views/table/index.vue`
Expected: ~780 行

- [ ] **Step 3: 替换模板部分 - 移除 el-table，添加 UniverSheet**

找到这个部分（约 120-260 行）：
```vue
<!-- 表格内容 -->
<div v-else class="bg-white rounded-xl shadow-card overflow-hidden">
  <!-- 工具栏 -->
  ...
  <!-- el-table -->
  ...
  <!-- 分页 -->
  ...
</div>
```

替换为：
```vue
<!-- Univer Sheet -->
<UniverSheet
  v-if="tableConfig"
  :config="tableConfig"
  :data="tableData"
  :readonly="!canEdit"
  :loading="loading"
  class="h-full"
  @data-change="handleDataChange"
  @cell-change="handleCellChange"
/>
```

- [ ] **Step 4: 替换 script 部分 - 导入和权限逻辑**

在 `<script setup lang="ts">` 中：

1. 添加导入：
```typescript
import UniverSheet from './UniverSheet.vue'
import { useUniverSheet, convertFromUniverData } from './composables/useUniverSheet'
```

2. 移除以下 import（不再需要）：
```typescript
// 移除 xlsx 导入
// import * as XLSX from 'xlsx'
```

3. 添加权限控制变量：
```typescript
const canEdit = ref(false) // 是否可编辑
```

4. 添加权限判断逻辑（在 loadConfig 中）：
```typescript
const loadConfig = async () => {
  const tableId = route.params.id as string
  try {
    const res = await tableApi.getTable(tableId)
    if (res.success && res.data) {
      tableConfig.value = {
        ...res.data,
        fields: (res.data.fields || []).map((field: any) => parseFieldConfig(field))
      }
      addForm.value = buildEmptyForm()

      // TODO: 根据用户角色和表格权限判断是否可编辑
      // 暂时设置为 true，后续接入权限系统
      canEdit.value = true
    }
  } catch (error) {
    console.error(error)
  } finally {
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
}
```

5. 添加 dataChange 和 cellChange 处理器：
```typescript
// Univer 数据变化
const handleDataChange = (data: any[]) => {
  console.log('Univer data changed:', data)
}

// 单元格变化
const handleCellChange = (rowId: string, fieldName: string, value: any) => {
  console.log('Cell changed:', rowId, fieldName, value)
}
```

6. 移除或注释掉以下函数（Univer 内置）：
- `startEdit` - Univer 自带编辑
- `saveEdit` - Univer 自带保存
- `getDisplayValue` - Univer 内置显示
- `tableRowClassName` - 不再需要
- `getColumnFilters` - Univer 内置筛选

7. 简化 exportData 函数（暂时禁用）：
```typescript
const exportData = async () => {
  ElMessage.info('导出功能开发中')
  // TODO: 实现 Univer 导出
  // const ws = univerSheetRef.value?.getWorksheet()
  // if (ws) {
  //   const data = ws.getData()
  //   // 导出逻辑
  // }
}
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/views/table/index.vue
git commit -m "refactor: replace el-table with UniverSheet in table view"
```

---

## Task 6: 验证基础功能

**Files:**
- Modify: `frontend/src/views/table/index.vue`（如需调整）

- [ ] **Step 1: 启动前端开发服务器**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: 检查 Univer 是否正常加载**

打开浏览器控制台，检查是否有以下错误：
- `@univerjs/vue not found`
- `UniverSheet is not defined`
- CSS 样式错误

- [ ] **Step 3: 检查表格数据加载**

访问 `/table/1`（假设存在表格 ID 1），检查：
- Univer Sheet 是否渲染
- 数据是否正确显示
- 表头是否正确

- [ ] **Step 4: 如有问题，修复后提交**

```bash
git add -A
git commit -m "fix: resolve univer sheet integration issues"
```

---

## Task 7: 实现编辑保存功能

**Files:**
- Modify: `frontend/src/views/table/UniverSheet.vue`
- Modify: `frontend/src/views/table/composables/useUniverSheet.ts`
- Modify: `frontend/src/views/table/index.vue`

- [ ] **Step 1: 在 useUniverSheet 中添加变更监听**

Update `useUniverSheet.ts`:
```typescript
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { IWorkbookData, Worksheet, Univer } from '@univerjs/core'

// 监听 worksheet 变更
export function useWorksheetListener(
  univerRef: ShallowRef<Univer | null>,
  onCellChange: (row: number, col: number, value: any) => void
) {
  const worksheet = ref<Worksheet | null>(null)

  watch(univerRef, (univer) => {
    if (univer) {
      const workbook = univer.getActiveWorkbook()
      if (workbook) {
        worksheet.value = workbook.getActiveSheet()
        // 监听单元格变更
        // TODO: 根据 Univer API 添加监听
      }
    }
  })

  return { worksheet }
}
```

- [ ] **Step 2: 在 UniverSheet.vue 中处理编辑**

Update `UniverSheet.vue`:
```typescript
// 添加 ref
const univerRef = ref<InstanceType<typeof UniverSheet> | null>(null)

// 监听单元格编辑
const handleCellEdit = (row: number, col: number, value: any) => {
  if (!props.config || !props.data[row]) return

  const field = props.config.fields[col - 1] // 跳过第一列（id列）
  if (field) {
    emit('cellChange', props.data[row].id, field.name, value)
  }
}
```

- [ ] **Step 3: 在 index.vue 中实现保存逻辑**

Update `handleCellChange`:
```typescript
const handleCellChange = async (rowId: string, fieldName: string, value: any) => {
  const tableId = route.params.id as string

  try {
    // 找到对应行
    const row = tableData.value.find(r => r.id === rowId)
    if (!row) return

    // 调用 API 更新
    const newRowData = { ...row.rowData, [fieldName]: value }
    await dataApi.updateRow(tableId, rowId, newRowData)

    // 更新本地数据
    row.rowData = newRowData

    ElMessage.success('保存成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: implement cell edit and save functionality"
```

---

## Task 8: 实现只读模式权限控制

**Files:**
- Modify: `frontend/src/views/table/index.vue`

- [ ] **Step 1: 添加权限判断逻辑**

Update `loadConfig`:
```typescript
const loadConfig = async () => {
  const tableId = route.params.id as string
  try {
    const res = await tableApi.getTable(tableId)
    if (res.success && res.data) {
      tableConfig.value = {
        ...res.data,
        fields: (res.data.fields || []).map((field: any) => parseFieldConfig(field))
      }
      addForm.value = buildEmptyForm()

      // TODO: 调用权限 API 获取用户角色
      // 根据用户角色和表格 allowedOrgs 判断是否可编辑
      // canEdit.value = checkEditPermission(res.data)
    }
  } catch (error) {
    console.error(error)
  } finally {
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
}
```

- [ ] **Step 2: 测试只读模式**

1. 设置 `canEdit = false`
2. 检查 Univer Sheet 是否为只读状态
3. 尝试编辑单元格，应被阻止

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add readonly mode permission control"
```

---

## Task 9: 最终测试和清理

- [ ] **Step 1: 完整功能测试**

| 功能 | 预期结果 | 状态 |
|-----|---------|------|
| 页面加载 | Univer Sheet 正确渲染 | ☐ |
| 数据显示 | 表格数据正确显示 | ☐ |
| 单元格编辑 | 可编辑并保存 | ☐ |
| 只读模式 | 不可编辑 | ☐ |
| 返回按钮 | 正常返回首页 | ☐ |

- [ ] **Step 2: 清理备份文件**

Run: `rm -f frontend/src/views/table/index.vue.bak`

- [ ] **Step 3: 提交最终版本**

```bash
git add -A
git commit -m "feat: complete univer sheet integration - phase 1"
```

- [ ] **Step 4: 创建 PR**

```bash
git push -u origin feature/univer-sheet
```

---

## 实施检查清单

完成所有 Task 后，确认以下内容：

- [ ] Univer 依赖已安装
- [ ] `UniverSheet.vue` 组件已创建
- [ ] `useUniverSheet.ts` composable 已创建
- [ ] `table/index.vue` 已改造
- [ ] 数据加载正常
- [ ] 单元格编辑保存正常
- [ ] 只读模式工作正常
- [ ] 备份文件已删除
- [ ] 提交历史干净
- [ ] PR 已创建
