<template>
  <div class="table-container animate-fade-in">
    <!-- 页面标题栏 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <el-button text @click="goBack" class="!text-text-secondary hover:!text-primary">
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div>
          <h1 class="text-xl font-bold text-text-primary">{{ tableConfig?.name || '加载中...' }}</h1>
          <p class="text-sm text-text-tertiary">{{ tableConfig?.description || '暂无描述' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-button @click="exportData" class="!rounded-lg">
          <template #icon>
            <el-icon><Download /></el-icon>
          </template>
          导出
        </el-button>
        <el-button type="primary" @click="openAddDialog" class="!rounded-lg">
          <template #icon>
            <el-icon><Plus /></el-icon>
          </template>
          新增数据
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="bg-white rounded-xl p-12 shadow-card text-center">
      <el-icon class="is-loading text-3xl text-text-tertiary mb-4"><Loader /></el-icon>
      <p class="text-text-tertiary">加载中...</p>
    </div>

    <!-- 配置加载失败 -->
    <div v-else-if="!tableConfig" class="bg-white rounded-xl p-12 shadow-card text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-functional-danger/10 flex items-center justify-center">
        <el-icon :size="32" class="text-functional-danger"><Warning /></el-icon>
      </div>
      <p class="text-text-tertiary mb-4">表格配置加载失败</p>
      <el-button type="primary" @click="goToConfig" class="!rounded-lg">去配置</el-button>
    </div>

    <!-- 无字段配置 -->
    <div v-else-if="!tableConfig.fields || tableConfig.fields.length === 0" class="bg-white rounded-xl p-12 shadow-card text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-functional-warning/10 flex items-center justify-center">
        <el-icon :size="32" class="text-functional-warning"><CircleAlert /></el-icon>
      </div>
      <p class="text-text-tertiary mb-4">表格暂无字段配置</p>
      <el-button type="primary" @click="goToConfig" class="!rounded-lg">去配置字段</el-button>
    </div>

    <!-- 表格内容 -->
    <div v-else class="bg-white rounded-xl shadow-card overflow-hidden">
      <!-- 工具栏 -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <div class="flex items-center gap-3">
          <span class="text-sm text-text-tertiary">共 {{ pagination.total }} 条数据</span>
          <div v-if="selectedRows.length > 0" class="flex items-center gap-2">
            <el-divider direction="vertical" />
            <span class="text-sm text-primary font-medium">已选择 {{ selectedRows.length }} 项</span>
            <el-button size="small" text type="danger" @click="handleBatchDelete">批量删除</el-button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索..."
            prefix-icon="Search"
            size="small"
            clearable
            class="!w-48 !rounded-lg"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        :data="tableData"
        style="width: 100%"
        border
        row-key="id"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
        v-loading="loading"
        class="!rounded-none"
      >
        <el-table-column type="selection" width="50" fixed />

        <el-table-column type="index" label="#" width="60" align="center" fixed />

        <el-table-column
          v-for="(field, index) in tableConfig.fields"
          :key="field.id || field.name || index"
          :prop="field.name"
          :label="field.name"
          :sortable="'custom'"
          :filters="getColumnFilters(field)"
          :filtered-value="filters[field.name] || []"
          :column-key="field.name"
          :fixed="field.config?.fixed || false"
          min-width="150"
        >
          <template #default="{ row }">
            <!-- 编辑模式 -->
            <div v-if="editingRow === row.id && editingField === field.name" class="w-full">
              <el-input
                v-if="['text', 'number', 'email', 'phone'].includes(field.type)"
                v-model="editValue"
                :type="field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'"
                size="small"
                @blur="saveEdit(row)"
                @keyup.enter="saveEdit(row)"
                ref="editInputRef"
              />
              <el-date-picker
                v-else-if="field.type === 'date'"
                v-model="editValue"
                type="date"
                value-format="YYYY-MM-DD"
                size="small"
                class="!w-full"
                @change="saveEdit(row)"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="editValue"
                size="small"
                class="!w-full"
                @change="saveEdit(row)"
              >
                <el-option
                  v-for="option in field.config?.options || []"
                  :key="option"
                  :label="option"
                  :value="option"
                />
              </el-select>
              <el-checkbox
                v-else-if="field.type === 'checkbox'"
                v-model="editValue"
                @change="saveEdit(row)"
              />
            </div>
            <!-- 显示模式 -->
            <div
              v-else
              class="cursor-pointer hover:text-primary transition-colors"
              @click="startEdit(row, field.name, row.rowData[field.name])"
            >
              <el-tag v-if="field.type === 'checkbox'" size="small" :type="row.rowData[field.name] ? 'success' : 'info'">
                {{ row.rowData[field.name] ? '是' : '否' }}
              </el-tag>
              <span v-else class="line-clamp-1">
                {{ getDisplayValue(row.rowData[field.name], field.type) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <el-button
                type="danger"
                size="small"
                text
                @click="deleteRow(row)"
                class="hover:!bg-functional-danger/10"
              >
                <el-icon><Trash2 /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex items-center justify-between px-5 py-4 border-t border-border bg-background-secondary">
        <div class="text-sm text-text-tertiary">
          每页显示 {{ pagination.pageSize }} 条，共 {{ pagination.total }} 条
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="sizes, prev, pager, next"
          background
          class="!rounded-lg"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 新增数据对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="新增数据"
      width="600px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-width="100px" class="px-2">
        <el-form-item
          v-for="field in tableConfig?.fields"
          :key="field.id"
          :label="field.name"
          :required="field.required"
        >
          <el-input
            v-if="field.type === 'text'"
            v-model="addForm[field.name]"
            :placeholder="`请输入${field.name}`"
            class="!rounded-lg"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="addForm[field.name]"
            :min="field.config?.min"
            :max="field.config?.max"
            class="!w-full"
          />
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="addForm[field.name]"
            type="date"
            class="!w-full"
            value-format="YYYY-MM-DD"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="addForm[field.name]"
            class="!w-full"
            placeholder="请选择"
          >
            <el-option
              v-for="option in field.config?.options || []"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
          <el-input
            v-else-if="field.type === 'email'"
            v-model="addForm[field.name]"
            type="email"
            :placeholder="`请输入${field.name}`"
            class="!rounded-lg"
          />
          <el-input
            v-else-if="field.type === 'phone'"
            v-model="addForm[field.name]"
            :placeholder="`请输入${field.name}`"
            class="!rounded-lg"
          />
          <el-checkbox
            v-else-if="field.type === 'checkbox'"
            v-model="addForm[field.name]"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showAddDialog = false" class="!rounded-lg">取消</el-button>
          <el-button type="primary" @click="addRow" class="!rounded-lg">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tableApi, dataApi } from '@/api/table'
import type { TableConfig, TableField, TableRow } from '@/types/table'
import {
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Search,
  Loader,
  AlertTriangle,
  CircleAlert
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tableConfig = ref<TableConfig | null>(null)
const tableData = ref<TableRow[]>([])
const selectedRows = ref<TableRow[]>([])
const searchKeyword = ref('')

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const showAddDialog = ref(false)
const addForm = ref<Record<string, any>>({})

const editingRow = ref<string | null>(null)
const editingField = ref<string | null>(null)
const editValue = ref<any>(null)
const editInputRef = ref<any>(null)

const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const filters = ref<Record<string, any[]>>({})

const parseFieldConfig = (field: TableField) => ({
  ...field,
  config: typeof field.config === 'string'
    ? JSON.parse(field.config)
    : (field.config || {})
})

const buildEmptyForm = () => {
  const form: Record<string, any> = {}
  tableConfig.value?.fields.forEach(field => {
    form[field.name] = field.type === 'checkbox' ? false : ''
  })
  return form
}

const getDisplayValue = (value: any, type?: string) => {
  if (type === 'checkbox') {
    return value ? '是' : '否'
  }
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

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
    }
  } catch (error) {
    console.error(error)
  }
}

const loadData = async () => {
  const tableId = route.params.id as string
  loading.value = true
  try {
    const res = await dataApi.getData(tableId, {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
      filters: filters.value
    })
    if (res.success) {
      tableData.value = res.data || []
      if (res.pagination) {
        pagination.value = { ...pagination.value, ...res.pagination }
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: TableRow[]) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }: any) => {
  sortBy.value = order ? prop : ''
  sortOrder.value = order === 'descending' ? 'desc' : 'asc'
  pagination.value.page = 1
  loadData()
}

const handleFilterChange = (filter: any) => {
  filters.value = { ...filter }
  pagination.value.page = 1
  loadData()
}

const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

const getColumnFilters = (field: any) => {
  if (field.type === 'select' && field.config?.options) {
    return field.config.options.map((opt: string) => ({ text: opt, value: opt }))
  }
  return undefined
}

const openAddDialog = () => {
  addForm.value = buildEmptyForm()
  showAddDialog.value = true
}

const startEdit = (row: TableRow, field: string, value: any) => {
  editingRow.value = row.id
  editingField.value = field
  editValue.value = value
}

const saveEdit = async (row: TableRow) => {
  if (editingRow.value !== row.id || editingField.value === null) return

  const tableId = route.params.id as string
  const newRowData = { ...row.rowData, [editingField.value]: editValue.value }

  try {
    await dataApi.updateRow(tableId, row.id, newRowData)
    row.rowData = newRowData
    ElMessage.success('更新成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('更新失败')
  } finally {
    editingRow.value = null
    editingField.value = null
    editValue.value = null
  }
}

const deleteRow = async (row: TableRow) => {
  try {
    await ElMessageBox.confirm('确定要删除这条数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })

    const tableId = route.params.id as string
    await dataApi.deleteRow(tableId, row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条数据吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const tableId = route.params.id as string
    const ids = selectedRows.value.map(row => row.id)
    await dataApi.deleteRows(tableId, ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const addRow = async () => {
  const tableId = route.params.id as string
  try {
    await dataApi.addRow(tableId, addForm.value)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    addForm.value = buildEmptyForm()
    loadData()
  } catch (error) {
    console.error(error)
    ElMessage.error('添加失败')
  }
}

const exportData = async () => {
  if (!tableConfig.value) return

  try {
    const tableId = route.params.id as string
    const exportPageSize = Math.max(pagination.value.total, pagination.value.pageSize, 1)
    const res = await dataApi.getData(tableId, {
      page: 1,
      pageSize: exportPageSize,
      sortBy: sortBy.value || undefined,
      sortOrder: sortOrder.value,
      filters: filters.value
    })

    const rows = res.data || []
    const headers = tableConfig.value.fields.map(field => field.name)
    const sheetData = [
      headers,
      ...rows.map(row => headers.map(header => row.rowData?.[header] ?? ''))
    ]

    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, tableConfig.value.name || 'Sheet1')
    XLSX.writeFile(wb, `${tableConfig.value.name}.xlsx`)
    ElMessage.success(`导出成功，共 ${rows.length} 条数据`)
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

const goBack = () => {
  router.push('/')
}

const goToConfig = () => {
  const tableId = route.params.id as string
  router.push(`/config/${tableId}`)
}

onMounted(() => {
  loadConfig()
  loadData()
})
</script>

<style scoped>
.table-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
