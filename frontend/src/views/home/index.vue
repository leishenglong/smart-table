<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <div class="welcome-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-text-primary mb-1">
            {{ greeting }}，{{ userName }}
          </h1>
          <p class="text-text-tertiary">欢迎使用动态表格管理系统，祝您工作愉快</p>
        </div>
        <div class="text-text-tertiary text-sm">
          {{ currentDate }}
        </div>
      </div>
    </div>

    <!-- 骨架屏加载状态 -->
    <template v-if="pageLoading">
      <!-- 统计卡片骨架屏 -->
      <div class="grid grid-cols-4 gap-5 mb-6">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl p-5 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-background-secondary animate-pulse"></div>
            <div class="w-16 h-6 rounded-full bg-background-secondary animate-pulse"></div>
          </div>
          <div class="w-20 h-8 rounded bg-background-secondary animate-pulse mb-2"></div>
          <div class="w-24 h-4 rounded bg-background-secondary animate-pulse"></div>
        </div>
      </div>

      <!-- 内容区骨架屏 -->
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-1">
          <div class="bg-white rounded-xl p-5 shadow-card">
            <div class="w-24 h-5 rounded bg-background-secondary animate-pulse mb-4"></div>
            <div class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center p-3 rounded-lg bg-background-secondary/50 animate-pulse">
                <div class="w-10 h-10 rounded-xl bg-background-secondary"></div>
                <div class="flex-1 ml-3 space-y-2">
                  <div class="w-24 h-4 rounded bg-background-secondary"></div>
                  <div class="w-16 h-3 rounded bg-background-secondary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-2">
          <div class="bg-white rounded-xl p-5 shadow-card">
            <div class="flex items-center justify-between mb-4">
              <div class="w-24 h-5 rounded bg-background-secondary animate-pulse"></div>
              <div class="flex gap-3">
                <div class="w-32 h-8 rounded-lg bg-background-secondary animate-pulse"></div>
                <div class="w-24 h-8 rounded-lg bg-background-secondary animate-pulse"></div>
              </div>
            </div>
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="flex items-center p-4 rounded-xl bg-background-secondary/50 animate-pulse">
                <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
                <div class="flex-1 ml-4 space-y-2">
                  <div class="w-48 h-4 rounded bg-background-secondary"></div>
                  <div class="w-32 h-3 rounded bg-background-secondary"></div>
                </div>
                <div class="w-16 h-6 rounded-full bg-background-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 真实内容 -->
    <template v-else>
      <!-- 统计卡片区域 -->
      <div class="grid grid-cols-4 gap-5 mb-6">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 card-hover"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="stat.bgClass">
              <el-icon :size="24" :class="stat.iconClass">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <span class="text-xs font-medium px-2 py-1 rounded-full" :class="stat.badgeClass">
              {{ stat.badge }}
            </span>
          </div>
          <div class="text-3xl font-bold text-text-primary mb-1">{{ stat.value }}</div>
          <div class="text-sm text-text-tertiary">{{ stat.label }}</div>
        </div>
      </div>

      <!-- 快捷操作和表格列表 -->
      <div class="grid grid-cols-3 gap-6">
        <!-- 快捷操作 -->
        <div class="col-span-1">
          <div class="bg-white rounded-xl p-5 shadow-card">
            <h2 class="text-base font-semibold text-text-primary mb-4 flex items-center">
              <el-icon class="mr-2 text-primary"><Zap /></el-icon>
              快捷操作
            </h2>
            <div class="space-y-3">
              <div
              v-for="(action, index) in quickActions"
              :key="index"
              @click="handleAction(action)"
              class="flex items-center p-3 rounded-lg hover:bg-background transition-colors cursor-pointer group"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center mr-3" :class="action.bgClass">
                <el-icon :size="20" :class="action.iconClass">
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <div class="flex-1">
                <div class="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                  {{ action.title }}
                </div>
                <div class="text-xs text-text-tertiary">{{ action.desc }}</div>
              </div>
              <el-icon class="text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格列表 -->
      <div class="col-span-2">
        <div class="bg-white rounded-xl p-5 shadow-card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-text-primary flex items-center">
              <el-icon class="mr-2 text-primary"><LayoutGrid /></el-icon>
              我的表格
            </h2>
            <div class="flex items-center gap-3">
              <!-- 搜索框 -->
              <el-input
                v-model="searchQuery"
                placeholder="搜索表格..."
                prefix-icon="Search"
                size="small"
                class="!w-40 !rounded-lg"
                clearable
              />
              <el-button type="primary" @click="showCreateDialog = true" class="!rounded-lg">
                <template #icon>
                  <el-icon><Plus /></el-icon>
                </template>
                新建表格
              </el-button>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="py-12 text-center">
            <el-icon class="is-loading text-2xl text-text-tertiary"><Loading /></el-icon>
          </div>

          <!-- 空状态 -->
          <div v-else-if="tables.length === 0" class="py-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
              <el-icon :size="32" class="text-text-tertiary"><Document /></el-icon>
            </div>
            <p class="text-text-tertiary mb-4">暂无表格，点击上方按钮创建第一个表格</p>
            <el-button type="primary" @click="showCreateDialog = true" class="!rounded-lg">
              <el-icon class="mr-1"><Plus /></el-icon>
              创建表格
            </el-button>
          </div>

          <!-- 表格列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="table in filteredTables"
              :key="table.id"
              @click="goToTable(table.id!)"
              class="flex items-center p-4 rounded-xl hover:bg-background transition-all cursor-pointer group border border-transparent hover:border-border"
            >
              <div class="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mr-4 flex-shrink-0 shadow-lg shadow-primary/20">
                <el-icon :size="24" class="text-white">
                  <component :is="getTableIcon(table)" />
                </el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
                  {{ table.name }}
                </div>
                <div class="text-xs text-text-tertiary line-clamp-1">
                  {{ table.description || '暂无描述' }}
                </div>
              </div>
              <div class="flex items-center gap-4 ml-4">
                <span class="text-xs text-text-tertiary bg-background-secondary px-2 py-1 rounded-full">
                  {{ table.fields?.length || 0 }} 字段
                </span>
                <span class="text-xs text-text-tertiary">{{ formatDate(table.createdAt) }}</span>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <el-button
                    size="small"
                    text
                    @click.stop="editTable(table.id!)"
                    class="!text-text-secondary hover:!text-primary"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    size="small"
                    text
                    @click.stop="deleteTable(table.id!)"
                    class="!text-text-secondary hover:!text-functional-danger"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 查看更多 -->
          <div v-if="tables.length > 0" class="mt-4 pt-4 border-t border-border text-center">
            <el-button text class="!text-primary" @click="goToConfig">
              <el-icon class="mr-1"><View /></el-icon>
              查看全部 {{ tables.length }} 个表格
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 关闭v-else模板 -->
    </template>

    <!-- 创建表格对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建表格"
      width="500px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="80px" class="px-2">
        <el-form-item label="表格名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="请输入表格名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入表格描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showCreateDialog = false" class="!rounded-lg">取消</el-button>
          <el-button type="primary" @click="createTable" class="!rounded-lg">创建并配置</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 创建对话框 -->
    <el-dialog
      v-model="showAIDialog"
      title="AI 智能创建"
      width="600px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-2 p-3 bg-primary-50 rounded-lg text-primary text-sm">
          <el-icon><InfoFilled /></el-icon>
          <span>描述您想要的表格，AI 将自动生成表格结构</span>
        </div>
        <el-input
          v-model="aiInput"
          type="textarea"
          :rows="4"
          placeholder="例如：创建一个员工管理表，包含姓名、工号、部门、入职日期、邮箱"
        />
        <div v-if="aiResult" class="p-4 bg-background rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-text-primary">解析结果</span>
            <el-tag type="success" size="small">解析成功</el-tag>
          </div>
          <div class="text-sm text-text-secondary mb-2">表格名称：{{ aiResult.name }}</div>
          <div class="text-sm text-text-tertiary">
            字段：{{ aiResult.fields?.map((f: any) => f.name).join('、') }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showAIDialog = false" class="!rounded-lg">取消</el-button>
          <el-button @click="parseAI" :loading="aiLoading" class="!rounded-lg">
            <el-icon class="mr-1"><Sparkles /></el-icon>
            AI 解析
          </el-button>
          <el-button
            v-if="aiResult"
            type="success"
            @click="createFromAI"
            class="!rounded-lg"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            创建表格
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Excel 导入对话框 -->
    <el-dialog
      v-model="showExcelDialog"
      title="Excel 导入"
      width="700px"
      class="!rounded-2xl"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <p class="text-sm text-text-tertiary">选择Excel文件，系统将自动识别表头和数据</p>

        <el-upload
          drag
          accept=".xlsx,.xls"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="(file: any) => handleExcelUpload(file.raw)"
          class="w-full"
        >
          <div class="py-8">
            <el-icon class="text-4xl text-text-tertiary mb-3"><Upload /></el-icon>
            <div class="text-text-primary mb-1">拖拽Excel文件到此处或 <span class="text-primary">点击上传</span></div>
            <div class="text-xs text-text-tertiary">支持 .xlsx, .xls 格式，文件大小不超过 10MB</div>
          </div>
        </el-upload>

        <div v-if="excelFile" class="flex items-center justify-between p-3 bg-background rounded-lg">
          <div class="flex items-center gap-2">
            <el-icon class="text-primary"><Document /></el-icon>
            <span class="text-sm">{{ excelFile.name }}</span>
            <span class="text-xs text-text-tertiary">({{ formatFileSize(excelFile.size) }})</span>
          </div>
          <el-button type="danger" size="small" text @click="excelFile = null; excelPreview = null">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <div v-if="excelPreview" class="border border-border rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-text-primary">数据预览</span>
            <el-tag type="info" size="small">前5行</el-tag>
          </div>
          <div class="overflow-auto max-h-60">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-background-secondary">
                  <th
                    v-for="header in excelPreview.headers"
                    :key="header"
                    class="border border-border p-2 text-left font-medium text-text-primary"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in excelPreview.previewRows" :key="index">
                  <td
                    v-for="header in excelPreview.headers"
                    :key="header"
                    class="border border-border p-2 text-text-secondary"
                  >
                    {{ row[header] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-3 text-xs text-text-tertiary flex items-center gap-4">
            <span>识别到 {{ excelPreview.headers.length }} 个字段</span>
            <span>{{ excelPreview.totalRows }} 行数据</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="cancelExcelImport" class="!rounded-lg">取消</el-button>
          <el-button
            type="primary"
            @click="importExcel"
            :loading="excelLoading"
            :disabled="!excelFile"
            class="!rounded-lg"
          >
            <el-icon class="mr-1"><Download /></el-icon>
            导入并创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- JSON 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="JSON 导入"
      width="600px"
      class="!rounded-2xl"
    >
      <div class="space-y-4">
        <p class="text-sm text-text-tertiary">粘贴 JSON 配置或上传配置文件</p>
        <el-input
          v-model="jsonInput"
          type="textarea"
          :rows="10"
          placeholder='{"name":"表格名称","fields":[{"name":"字段名","type":"text"}]}'
          class="!font-mono !text-sm"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showImportDialog = false" class="!rounded-lg">取消</el-button>
          <el-button type="primary" @click="importJSON" class="!rounded-lg">
            <el-icon class="mr-1"><Download /></el-icon>
            导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tableApi, aiApi, dataApi } from '@/api/table'
import type { TableConfig } from '@/types/table'
import {
  Zap,
  ArrowRight,
  LayoutGrid,
  Plus,
  Search,
  Edit,
  Delete,
  View,
  FileText,
  Upload,
  Download,
  Sparkles,
  Check,
  CircleAlert,
  Loader,
  LayoutDashboard,
  List,
  Calendar,
  TrendingUp
} from 'lucide-vue-next'

const router = useRouter()

const loading = ref(false)
const pageLoading = ref(true)
const tables = ref<TableConfig[]>([])
const searchQuery = ref('')
const userName = ref('Admin')

const showCreateDialog = ref(false)
const showAIDialog = ref(false)
const showImportDialog = ref(false)
const showExcelDialog = ref(false)

const createForm = ref({
  name: '',
  description: ''
})

const aiInput = ref('')
const aiResult = ref<any>(null)
const aiLoading = ref(false)

const jsonInput = ref('')

const excelFile = ref<File | null>(null)
const excelLoading = ref(false)
const excelPreview = ref<any>(null)

// 统计数据
const stats = computed(() => [
  {
    label: '我的表格',
    value: tables.value.length,
    icon: LayoutDashboard,
    bgClass: 'bg-primary-50',
    iconClass: 'text-primary',
    badge: '共 ' + tables.value.length + ' 个',
    badgeClass: 'bg-primary-50 text-primary'
  },
  {
    label: '今日访问',
    value: '128',
    icon: TrendingUp,
    bgClass: 'bg-functional-success/10',
    iconClass: 'text-functional-success',
    badge: '+12%',
    badgeClass: 'bg-functional-success/10 text-functional-success'
  },
  {
    label: '待处理任务',
    value: '5',
    icon: List,
    bgClass: 'bg-functional-warning/10',
    iconClass: 'text-functional-warning',
    badge: '紧急 2',
    badgeClass: 'bg-functional-warning/10 text-functional-warning'
  },
  {
    label: '数据总量',
    value: '1,234',
    icon: Calendar,
    bgClass: 'bg-functional-info/10',
    iconClass: 'text-functional-info',
    badge: '条',
    badgeClass: 'bg-functional-info/10 text-functional-info'
  }
])

// 快捷操作
const quickActions = [
  {
    title: 'AI 智能创建',
    desc: '描述需求，自动生成表格',
    icon: Sparkles,
    bgClass: 'bg-primary-50',
    iconClass: 'text-primary',
    action: () => showAIDialog.value = true
  },
  {
    title: 'Excel 导入',
    desc: '直接导入Excel创建表格',
    icon: Upload,
    bgClass: 'bg-functional-success/10',
    iconClass: 'text-functional-success',
    action: () => showExcelDialog.value = true
  },
  {
    title: 'JSON 导入',
    desc: '导入配置快速创建',
    icon: Download,
    bgClass: 'bg-functional-warning/10',
    iconClass: 'text-functional-warning',
    action: () => showImportDialog.value = true
  },
  {
    title: '可视化配置',
    desc: '拖拽字段，自由定制',
    icon: LayoutGrid,
    bgClass: 'bg-functional-info/10',
    iconClass: 'text-functional-info',
    action: () => goToConfig()
  }
]

// 计算属性
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const filteredTables = computed(() => {
  if (!searchQuery.value) return tables.value.slice(0, 5)
  return tables.value
    .filter(t => t.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
    .slice(0, 5)
})

// 方法
const formatDate = (date?: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getTableIcon = (table: TableConfig) => {
  return LayoutDashboard
}

const handleAction = (action: any) => {
  if (action.action) {
    action.action()
  }
}

const loadTables = async () => {
  loading.value = true
  try {
    const res = await tableApi.getTables()
    if (res.success) {
      tables.value = res.data || []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    // 延迟一下让骨架屏显示
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
}

const goToTable = (id: string) => {
  router.push(`/table/${id}`)
}

const goToConfig = () => {
  router.push('/config')
}

const editTable = (id: string) => {
  router.push(`/config/${id}`)
}

const deleteTable = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个表格吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    await tableApi.deleteTable(id)
    ElMessage.success('删除成功')
    loadTables()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const createTable = async () => {
  if (!createForm.value.name) {
    ElMessage.warning('请输入表格名称')
    return
  }

  try {
    const res = await tableApi.createTable({
      name: createForm.value.name,
      description: createForm.value.description,
      fields: []
    })
    if (res.success && res.data?.id) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      createForm.value = { name: '', description: '' }
      router.push(`/config/${res.data.id}`)
    }
  } catch (error) {
    console.error(error)
  }
}

const parseAI = async () => {
  if (!aiInput.value) {
    ElMessage.warning('请输入表格描述')
    return
  }

  aiLoading.value = true
  try {
    const res = await aiApi.parse(aiInput.value)
    if (res.success) {
      aiResult.value = res.data
      ElMessage.success('解析成功')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('解析失败，请重试')
  } finally {
    aiLoading.value = false
  }
}

const createFromAI = async () => {
  if (!aiResult.value) return

  try {
    const res = await tableApi.createTable(aiResult.value)
    if (res.success && res.data?.id) {
      ElMessage.success('创建成功')
      showAIDialog.value = false
      aiInput.value = ''
      aiResult.value = null
      loadTables()
    }
  } catch (error) {
    console.error(error)
  }
}

const importJSON = async () => {
  if (!jsonInput.value) {
    ElMessage.warning('请输入 JSON 配置')
    return
  }

  try {
    const config = JSON.parse(jsonInput.value)
    const res = await tableApi.createTable(config)
    if (res.success && res.data?.id) {
      ElMessage.success('导入成功')
      showImportDialog.value = false
      jsonInput.value = ''
      loadTables()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('JSON 格式错误，请检查')
  }
}

const handleExcelUpload = (file: File) => {
  excelFile.value = file
  parseExcel(file)
  return false
}

const parseExcel = async (file: File) => {
  excelLoading.value = true
  try {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length === 0) {
      ElMessage.warning('Excel文件为空')
      return
    }

    const headers = (jsonData[0] || []).map((h, i) => String(h ?? '').trim() || `字段${i + 1}`)
    const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))

    const previewRows = dataRows.slice(0, 5).map(row => {
      const rowData: Record<string, any> = {}
      headers.forEach((header, index) => {
        rowData[header] = row[index] ?? ''
      })
      return rowData
    })

    excelPreview.value = {
      headers,
      previewRows,
      totalRows: dataRows.length
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('Excel解析失败')
  } finally {
    excelLoading.value = false
  }
}

const importExcel = async () => {
  if (!excelFile.value || !excelPreview.value) {
    ElMessage.warning('请先选择Excel文件')
    return
  }

  excelLoading.value = true
  try {
    const XLSX = await import('xlsx')
    const data = await excelFile.value.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })

    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    const headers = (jsonData[0] || []).map((h, i) => String(h ?? '').trim() || `字段${i + 1}`)
    const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))

    const tableName = excelFile.value.name.replace(/\.[^/.]+$/, '') || `Excel导入_${Date.now()}`

    const fields = headers.map((header, index) => {
      const samples = rows.map(row => row[index]).filter(v => v !== null && v !== undefined && v !== '')
      let type = 'text'
      if (samples.length > 0) {
        const allNumbers = samples.every(v => !isNaN(Number(v)))
        if (allNumbers) type = 'number'
      }
      return { name: header, type, required: false, config: {} }
    })

    const res = await tableApi.createTable({
      name: tableName,
      description: `从Excel导入，共${rows.length}行数据`,
      fields
    })

    if (res.success && res.data?.id) {
      
      const tableId = res.data.id
      if (rows.length > 0) {
        const importData = rows.map(row => {
          const rowData: Record<string, any> = {}
          headers.forEach((header, index) => {
            rowData[header] = row[index] ?? ''
          })
          return rowData
        })

        const batchSize = 100
        for (let i = 0; i < importData.length; i += batchSize) {
          const batch = importData.slice(i, i + batchSize)
          await dataApi.importBatch(tableId, batch)
        }
      }

      ElMessage.success(`导入成功，共${rows.length}条数据`)
      showExcelDialog.value = false
      excelFile.value = null
      excelPreview.value = null
      loadTables()
      router.push(`/table/${tableId}`)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('导入失败')
  } finally {
    excelLoading.value = false
  }
}

const cancelExcelImport = () => {
  showExcelDialog.value = false
  excelFile.value = null
  excelPreview.value = null
}

onMounted(() => {
  loadTables()
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  userName.value = user.name || user.username || 'Admin'
})
</script>

<style scoped>
.home-container {
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

.welcome-section {
  animation: slideUp 0.4s ease-out;
}

.grid-cols-4 {
  animation: slideUp 0.4s ease-out 0.1s both;
}

.grid-cols-3 {
  animation: slideUp 0.4s ease-out 0.2s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
