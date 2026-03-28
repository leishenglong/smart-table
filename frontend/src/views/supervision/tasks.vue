<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 flex items-center px-6">
      <button @click="goBack" class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span>返回</span>
      </button>
      <h1 class="ml-6 text-lg font-medium text-text-primary">督办任务管理</h1>
      <div class="flex-1"></div>
      <el-button type="primary" @click="showCreateDialog = true">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </template>
        创建任务
      </el-button>
    </header>

    <!-- 主内容区 -->
    <main class="pt-16">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <!-- 筛选栏 -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-4">
          <el-select v-model="filterStatus" placeholder="任务状态" clearable class="w-40">
            <el-option label="全部" value="" />
            <el-option label="待下发" value="pending" />
            <el-option label="已下发" value="published" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>

        <!-- 任务列表 -->
        <div v-if="loading" class="text-center py-12">
          <div class="text-text-tertiary">加载中...</div>
        </div>

        <div v-else-if="tasks.length === 0" class="text-center py-12 bg-white rounded-xl">
          <div class="text-text-tertiary mb-4">暂无任务，点击上方创建第一个任务</div>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="task in filteredTasks" 
            :key="task.id"
            class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="viewTaskDetail(task)"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-text-primary mb-1">{{ task.name }}</h3>
                <p class="text-sm text-text-tertiary">{{ task.table?.name }} · {{ task.description || '无描述' }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span 
                  class="px-3 py-1 text-sm rounded-full"
                  :class="statusClass(task.status)"
                >
                  {{ statusText(task.status) }}
                </span>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="grid grid-cols-5 gap-4 p-4 bg-background rounded-lg">
              <div class="text-center">
                <div class="text-2xl font-bold text-text-primary">{{ task.stats?.total || 0 }}</div>
                <div class="text-sm text-text-tertiary">下发总数</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ task.stats?.submitted || 0 }}</div>
                <div class="text-sm text-text-tertiary">已填写</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ task.stats?.filling || 0 }}</div>
                <div class="text-sm text-text-tertiary">填写中</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">{{ task.stats?.pending || 0 }}</div>
                <div class="text-sm text-text-tertiary">待填写</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ task.stats?.overdue || 0 }}</div>
                <div class="text-sm text-text-tertiary">已逾期</div>
              </div>
            </div>

            <!-- 截止日期和操作 -->
            <div class="flex items-center justify-between mt-4 pt-4 border-t">
              <div class="text-sm text-text-tertiary">
                <span v-if="task.deadline">
                  截止日期：{{ formatDate(task.deadline) }}
                </span>
                <span v-else>无截止日期</span>
              </div>
              <div class="flex items-center gap-2">
                <el-button 
                  v-if="task.status === 'pending'"
                  type="primary" 
                  size="small"
                  @click.stop="showPublishDialog(task)"
                >
                  立即下发
                </el-button>
                <el-button 
                  v-if="task.status === 'published'"
                  type="warning" 
                  size="small"
                  @click.stop="sendReminder(task)"
                >
                  催办
                </el-button>
                <el-button 
                  size="small"
                  @click.stop="copyFillLink(task)"
                >
                  复制填写链接
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建督办任务" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        
        <el-form-item label="关联表格" required>
          <el-select v-model="form.tableId" placeholder="请选择表格" class="w-full">
            <el-option 
              v-for="table in tables" 
              :key="table.id" 
              :label="table.name" 
              :value="table.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入任务描述（可选）" 
          />
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            placeholder="选择截止日期（可选）"
            class="w-full"
          />
        </el-form-item>
        
        <el-form-item label="填写设置">
          <div class="space-y-2">
            <el-checkbox v-model="form.requireLogin">需要登录才能填写</el-checkbox>
            <el-checkbox v-model="form.allowAnonymous">允许匿名填写</el-checkbox>
          </div>
        </el-form-item>
        
        <el-form-item label="下发目标" v-if="form.tableId">
          <div class="border rounded-lg p-4 max-h-60 overflow-auto">
            <el-tree
              ref="orgTreeRef"
              :data="orgTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              show-checkbox
              check-strictly
              @check-change="handleOrgCheck"
            />
          </div>
          <div class="text-sm text-text-tertiary mt-2">
            已选择 {{ selectedOrgIds.length }} 个组织
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建并下发</el-button>
      </template>
    </el-dialog>

    <!-- 下发对话框 -->
    <el-dialog v-model="showPublishDialogFlag" title="下发任务" width="500px">
      <div class="mb-4">
        <p class="text-text-secondary mb-4">选择要下发的组织：</p>
        <div class="border rounded-lg p-4 max-h-60 overflow-auto">
          <el-tree
            ref="publishOrgTreeRef"
            :data="orgTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showPublishDialogFlag = false">取消</el-button>
        <el-button type="primary" @click="confirmPublish">确认下发</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="任务详情" width="900px">
      <div v-if="currentTask">
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-2">{{ currentTask.name }}</h3>
          <p class="text-text-tertiary">{{ currentTask.description || '无描述' }}</p>
        </div>

        <!-- 填写状态表格 -->
        <el-table :data="currentTask.targets || []" border>
          <el-table-column prop="targetName" label="目标组织" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <span :class="statusClass(row.status)">
                {{ statusText(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="fillToken" label="填写链接">
            <template #default="{ row }">
              <el-button size="small" @click="copyLink(row.fillToken)">复制链接</el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button 
                v-if="row.status !== 'submitted'"
                type="warning" 
                size="small"
                @click="remindTarget(row)"
              >
                催办
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supervisionApi } from '@/api/supervision'
import { tableApi } from '@/api/table'

const router = useRouter()

const loading = ref(false)
const tasks = ref<any[]>([])
const tables = ref<any[]>([])
const orgTree = ref<any[]>([])
const filterStatus = ref('')
const selectedOrgIds = ref<string[]>([])

const showCreateDialog = ref(false)
const showPublishDialogFlag = ref(false)
const showDetailDialog = ref(false)
const currentTask = ref<any>(null)
const currentPublishTaskId = ref('')

const form = ref({
  name: '',
  tableId: '',
  description: '',
  deadline: null as Date | null,
  requireLogin: false,
  allowAnonymous: true,
  targetOrgIds: [] as string[]
})

const filteredTasks = computed(() => {
  if (!filterStatus.value) return tasks.value
  return tasks.value.filter(t => t.status === filterStatus.value)
})

const goBack = () => {
  router.push('/')
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await supervisionApi.getTasks()
    if (res.success) {
      tasks.value = res.data || []
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const loadTables = async () => {
  try {
    const res = await tableApi.getTables()
    if (res.success) {
      tables.value = res.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

const loadOrganizations = async () => {
  try {
    const res = await supervisionApi.getOrganizations()
    if (res.success) {
      orgTree.value = res.data || []
    }
  } catch (error) {
    console.error(error)
  }
}

const handleOrgCheck = (data: any, checked: boolean) => {
  if (checked) {
    if (!selectedOrgIds.value.includes(data.id)) {
      selectedOrgIds.value.push(data.id)
    }
  } else {
    selectedOrgIds.value = selectedOrgIds.value.filter(id => id !== data.id)
  }
  form.value.targetOrgIds = [...selectedOrgIds.value]
}

const createTask = async () => {
  if (!form.value.name || !form.value.tableId) {
    ElMessage.warning('请填写任务名称和选择表格')
    return
  }
  
  try {
    const res = await supervisionApi.createTask({
      ...form.value,
      deadline: form.value.deadline?.toISOString(),
      targetOrgIds: selectedOrgIds.value
    })
    
    if (res.success) {
      ElMessage.success('任务创建成功')
      showCreateDialog.value = false
      form.value = {
        name: '',
        tableId: '',
        description: '',
        deadline: null,
        requireLogin: false,
        allowAnonymous: true,
        targetOrgIds: []
      }
      selectedOrgIds.value = []
      loadTasks()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('创建任务失败')
  }
}

const showPublishDialog = (task: any) => {
  currentPublishTaskId.value = task.id
  showPublishDialogFlag.value = true
}

const confirmPublish = async () => {
  // 获取选中的组织
  const orgTreeRef = document.querySelector('.el-tree') as any
  if (orgTreeRef) {
    const checkedNodes = orgTreeRef.getCheckedNodes()
    const orgIds = checkedNodes.map((n: any) => n.id)
    
    if (orgIds.length === 0) {
      ElMessage.warning('请选择至少一个组织')
      return
    }
    
    try {
      await supervisionApi.publishTask(currentPublishTaskId.value, orgIds)
      ElMessage.success('任务下发成功')
      showPublishDialogFlag.value = false
      loadTasks()
    } catch (error) {
      console.error(error)
      ElMessage.error('任务下发失败')
    }
  }
}

const viewTaskDetail = async (task: any) => {
  try {
    const res = await supervisionApi.getTask(task.id)
    if (res.success) {
      currentTask.value = res.data
      showDetailDialog.value = true
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载任务详情失败')
  }
}

const sendReminder = async (task: any) => {
  try {
    await ElMessageBox.confirm('确定要向所有未完成的组织发送催办吗？', '催办提醒', {
      type: 'warning'
    })
    
    const res = await supervisionApi.sendReminder(task.id)
    if (res.success) {
      ElMessage.success(res.message || '催办已发送')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('发送催办失败')
    }
  }
}

const remindTarget = async (target: any) => {
  try {
    await supervisionApi.sendReminder(currentTask.value.id, {
      targetIds: [target.id]
    })
    ElMessage.success('催办已发送')
  } catch (error) {
    console.error(error)
    ElMessage.error('发送催办失败')
  }
}

const copyFillLink = (token: string) => {
  const link = `${window.location.origin}/fill/${token}`
  navigator.clipboard.writeText(link)
  ElMessage.success('填写链接已复制到剪贴板')
}

const copyLink = (token: string) => {
  copyFillLink(token)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待下发',
    published: '已下发',
    completed: '已完成',
    cancelled: '已取消',
    filling: '填写中',
    submitted: '已填写',
    overdue: '已逾期'
  }
  return map[status] || status
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    published: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    filling: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700'
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  loadTasks()
  loadTables()
  loadOrganizations()
})
</script>

<style scoped>
</style>
