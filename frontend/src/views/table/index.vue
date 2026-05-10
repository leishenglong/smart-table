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
        <el-button @click="exportData" class="!rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <template #icon>
            <el-icon><Download /></el-icon>
          </template>
          导出
        </el-button>
        <el-button type="primary" @click="openAddDialog" class="!rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <template #icon>
            <el-icon><Plus /></el-icon>
          </template>
          新增数据
        </el-button>
      </div>
    </div>

    <!-- 设置归属组织对话框 -->
    <el-dialog
      v-model="showOrgDialog"
      title="设置数据归属"
      width="500px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-text-secondary">将为选中的 {{ selectedRows.length }} 条数据设置归属组织</p>
        <el-form-item label="归属组织" required>
          <el-tree-select
            v-model="selectedOrgId"
            :data="orgTreeData"
            :props="{ label: 'name', children: 'children', value: 'id' }"
            placeholder="请选择组织"
            check-strictly
            clearable
            class="!w-full"
          />
        </el-form-item>
        <div class="text-xs text-text-tertiary">
          <el-icon class="mr-1"><Info /></el-icon>
          设置后，这些数据将只能被归属组织及其子组织的用户查看
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showOrgDialog = false" class="!rounded-lg">取消</el-button>
          <el-button type="primary" @click="confirmSetOrg" class="!rounded-lg" :loading="orgSettingLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 骨架屏加载状态 -->
    <template v-if="pageLoading">
      <div class="bg-white rounded-xl shadow-card overflow-hidden">
        <!-- 工具栏骨架屏 -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-border">
          <div class="flex items-center gap-4">
            <div class="w-24 h-5 rounded bg-background-secondary animate-pulse"></div>
            <div class="w-20 h-5 rounded bg-background-secondary animate-pulse"></div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-20 h-8 rounded-lg bg-background-secondary animate-pulse"></div>
            <div class="w-24 h-8 rounded-lg bg-background-secondary animate-pulse"></div>
          </div>
        </div>
        <!-- 表头骨架屏 -->
        <div class="flex items-center px-5 py-3 bg-background-secondary/30 border-b border-border">
          <div class="w-10 h-4 rounded bg-background-secondary animate-pulse mr-4"></div>
          <div class="w-10 h-4 rounded bg-background-secondary animate-pulse mr-4"></div>
          <div v-for="i in 5" :key="i" class="flex-1 h-4 rounded bg-background-secondary animate-pulse mr-4" :style="{ maxWidth: '150px' }"></div>
          <div class="w-20 h-4 rounded bg-background-secondary animate-pulse"></div>
        </div>
        <!-- 数据行骨架屏 -->
        <div v-for="rowNum in 5" :key="rowNum" class="flex items-center px-5 py-4 border-b border-border/50">
          <div class="w-10 h-4 rounded bg-background-secondary animate-pulse mr-4"></div>
          <div class="w-10 h-4 rounded bg-background-secondary animate-pulse mr-4"></div>
          <div v-for="colNum in 5" :key="colNum" class="flex-1 h-4 rounded bg-background-secondary animate-pulse mr-4" :style="{ maxWidth: '150px' }"></div>
          <div class="w-20 h-4 rounded bg-background-secondary animate-pulse"></div>
        </div>
        <!-- 分页骨架屏 -->
        <div class="flex items-center justify-between px-5 py-4">
          <div class="w-32 h-4 rounded bg-background-secondary animate-pulse"></div>
          <div class="flex items-center gap-2">
            <div v-for="i in 5" :key="i" class="w-8 h-8 rounded bg-background-secondary animate-pulse"></div>
          </div>
        </div>
      </div>
    </template>

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

    <!-- Univer Sheet -->
    <div v-else class="flex flex-col" style="height: calc(100vh - 120px);">
      <!-- 顶部操作栏 -->
      <div class="h-16 bg-white border-b flex items-center px-6 justify-between">
        <div class="flex items-center gap-4">
          <button @click="goBack" class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <h1 class="text-xl font-bold text-text-primary">{{ tableConfig?.name || '加载中...' }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <el-button @click="exportData" class="!rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <template #icon>
              <el-icon><Download /></el-icon>
            </template>
            导出
          </el-button>
          <el-button type="primary" @click="openAddDialog" class="!rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增数据
          </el-button>
        </div>
      </div>

      <!-- Univer Sheet 容器 -->
      <div class="flex-1 overflow-hidden">
        <UniverSheet
          v-if="tableConfig"
          :config="tableConfig"
          :table-id="route.params.id as string"
          :readonly="!canEdit"
          class="h-full"
        />
        <div v-else class="flex items-center justify-center h-full">
          <el-icon class="is-loading text-2xl text-primary"><Loading /></el-icon>
        </div>
      </div>
    </div>

    <!-- 新增数据对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="'新增数据'"
      width="600px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <el-icon class="text-primary text-lg"><Plus /></el-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-text-primary">新增数据</h3>
            <p class="text-sm text-text-tertiary">请填写以下信息</p>
          </div>
        </div>
      </template>
      <el-form :model="addForm" label-position="top" class="px-4 py-2">
        <el-form-item
          v-for="field in tableConfig?.fields"
          :key="field.id"
          :label="field.name"
          :required="field.required"
          class="!mb-4"
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
import { organizationApi } from '@/api/organization'
import type { TableConfig, TableField, TableRow } from '@/types/table'
import UniverSheet from './UniverSheet.vue'
import {
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Search,
  Loader,
  AlertTriangle,
  CircleAlert,
  Check,
  Edit,
  Info
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const pageLoading = ref(true)
const tableConfig = ref<TableConfig | null>(null)
const tableData = ref<TableRow[]>([])
const selectedRows = ref<TableRow[]>([])
const canEdit = ref(false) // 是否可编辑

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const showAddDialog = ref(false)
const addForm = ref<Record<string, any>>({})

// 批量设置归属
const showOrgDialog = ref(false)
const selectedOrgId = ref<string | null>(null)
const orgTreeData = ref<any[]>([])
const orgSettingLoading = ref(false)

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
      // 目前暂时设置为 true，后续接入权限系统
      // 根据用户角色和表格 allowedOrgs 判断是否可编辑
      canEdit.value = true
    }
  } catch (error) {
    console.error(error)
  } finally {
    // 延迟关闭骨架屏，让动画更流畅
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
}

const loadData = async () => {
  // UniverSheet 组件内部管理数据加载，此函数暂时保留用于其他模块调用
  // 如果未来需要从这里刷新数据，可以扩展 UniverSheet 的 API
}

const handleSelectionChange = (selection: TableRow[]) => {
  selectedRows.value = selection
}

// 加载组织树
const loadOrgTree = async () => {
  try {
    const res = await organizationApi.getOrganizationTree()
    if (res.success && res.data) {
      orgTreeData.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

// 打设置归属对话框
const openOrgDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要设置的数据')
    return
  }
  selectedOrgId.value = null
  showOrgDialog.value = true
}

// 确认设置归属
const confirmSetOrg = async () => {
  const tableId = route.params.id as string
  const ids = selectedRows.value.map(row => row.id)

  orgSettingLoading.value = true
  try {
    await dataApi.setBatchOrg(tableId, ids, selectedOrgId.value)
    ElMessage.success('归属设置成功')
    showOrgDialog.value = false
    selectedRows.value = []
    loadData()
  } catch (error: any) {
    ElMessage.error(error?.message || '设置失败')
  } finally {
    orgSettingLoading.value = false
  }
}

const openAddDialog = () => {
  addForm.value = buildEmptyForm()
  showAddDialog.value = true
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
  ElMessage.info('导出功能开发中')
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
  loadOrgTree()
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
