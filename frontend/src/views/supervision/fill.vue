<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-medium text-text-primary">{{ taskName }}</h1>
          <p class="text-sm text-text-tertiary mt-1">请填写以下信息</p>
        </div>
        <div v-if="requireLogin && !isLoggedIn" class="flex items-center gap-2">
          <el-button @click="showLoginDialog = true">登录</el-button>
        </div>
        <div v-else-if="isLoggedIn" class="flex items-center gap-2">
          <span class="text-sm text-text-secondary">欢迎，{{ userName }}</span>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="max-w-6xl mx-auto px-6 py-8">
      <!-- 登录对话框 -->
      <el-dialog v-model="showLoginDialog" title="登录" width="400px">
        <el-form :model="loginForm" label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showLoginDialog = false">取消</el-button>
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </template>
      </el-dialog>

      <!-- 表格内容 -->
      <div v-if="loading" class="text-center py-12">
        <div class="text-text-tertiary">加载中...</div>
      </div>

      <div v-else-if="error" class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="text-red-600 mb-4">{{ error }}</div>
        <el-button @click="$router.push('/')">返回首页</el-button>
      </div>

      <div v-else-if="alreadySubmitted" class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="text-green-600 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-xl font-medium text-text-primary mb-2">您已完成填写</h2>
        <p class="text-text-tertiary mb-6">感谢您的提交，已收到您的数据</p>
        <el-button type="primary" @click="showUpdateDialog = true">修改已提交的内容</el-button>
      </div>

      <div v-else class="bg-white rounded-xl shadow-sm p-6">
        <el-form :model="formData" label-width="120px" class="max-w-2xl">
          <el-form-item
            v-for="field in fields"
            :key="field.id"
            :label="field.name"
            :required="field.required"
          >
            <el-input
              v-if="field.type === 'text'"
              v-model="formData[field.name]"
              :placeholder="`请输入${field.name}`"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="formData[field.name]"
              :min="field.config?.min"
              :max="field.config?.max"
              class="w-full"
            />
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="formData[field.name]"
              type="date"
              class="w-full"
              :placeholder="`请选择${field.name}`"
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="formData[field.name]"
              class="w-full"
              :placeholder="`请选择${field.name}`"
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
              v-model="formData[field.name]"
            />
            <el-input
              v-else
              v-model="formData[field.name]"
              :placeholder="`请输入${field.name}`"
            />
          </el-form-item>

          <el-form-item class="mt-8">
            <el-button type="primary" size="large" @click="submitData" :loading="submitting">
              提交
            </el-button>
            <el-button size="large" @click="saveDraft" :loading="submitting">
              保存草稿
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 更新已提交数据对话框 -->
      <el-dialog v-model="showUpdateDialog" title="修改已提交内容" width="600px">
        <el-form :model="formData" label-width="120px">
          <el-form-item
            v-for="field in fields"
            :key="field.id"
            :label="field.name"
            :required="field.required"
          >
            <el-input
              v-if="field.type === 'text'"
              v-model="formData[field.name]"
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="formData[field.name]"
              class="w-full"
            />
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="formData[field.name]"
              type="date"
              class="w-full"
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="formData[field.name]"
              class="w-full"
            >
              <el-option
                v-for="option in field.config?.options || []"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showUpdateDialog = false">取消</el-button>
          <el-button type="primary" @click="updateData">确认修改</el-button>
        </template>
      </el-dialog>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supervisionApi } from '@/api/supervision'

const route = useRoute()
const router = useRouter()

const token = route.params.token as string

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const taskName = ref('')
const taskId = ref('')
const targetId = ref('')
const fields = ref<any[]>([])
const formData = ref<Record<string, any>>({})
const submittedData = ref<any>(null)
const alreadySubmitted = ref(false)
const requireLogin = ref(false)
const isLoggedIn = ref(false)
const userName = ref('')

const showLoginDialog = ref(false)
const showUpdateDialog = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const loadFillData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const res = await supervisionApi.getFillLink(token)
    
    if (!res.success) {
      error.value = res.message || '加载失败'
      return
    }
    
    const data = res.data
    taskName.value = data.taskName
    taskId.value = data.taskId
    targetId.value = data.targetId
    requireLogin.value = data.requireLogin
    fields.value = data.table?.fields || []
    
    // 初始化表单数据
    fields.value.forEach(field => {
      formData.value[field.name] = ''
    })
    
    // 如果已有提交数据
    if (data.submittedData) {
      submittedData.value = JSON.parse(data.submittedData)
      alreadySubmitted.value = true
      Object.keys(submittedData.value).forEach(key => {
        formData.value[key] = submittedData.value[key]
      })
    }
    
    // 检查是否已登录
    const user = localStorage.getItem('user')
    if (user) {
      isLoggedIn.value = true
      userName.value = JSON.parse(user).name || '用户'
    }
  } catch (err: any) {
    console.error(err)
    error.value = err.message || '加载数据失败，链接可能已失效'
  } finally {
    loading.value = false
  }
}

const handleLogin = () => {
  // 简单模拟登录
  if (loginForm.value.username && loginForm.value.password) {
    isLoggedIn.value = true
    userName.value = loginForm.value.username
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: loginForm.value.username,
      name: loginForm.value.username
    }))
    showLoginDialog.value = false
    ElMessage.success('登录成功')
  } else {
    ElMessage.warning('请输入用户名和密码')
  }
}

const submitData = async () => {
  // 检查必填字段
  for (const field of fields.value) {
    if (field.required && !formData.value[field.name]) {
      ElMessage.warning(`请填写${field.name}`)
      return
    }
  }
  
  submitting.value = true
  
  try {
    const user = localStorage.getItem('user')
    const userData = user ? JSON.parse(user) : null
    
    const res = await supervisionApi.submitFill(token, {
      data: formData.value,
      userId: userData?.id,
      userName: userData?.name || loginForm.value.username || '匿名用户'
    })
    
    if (res.success) {
      ElMessage.success('提交成功')
      alreadySubmitted.value = true
      showUpdateDialog.value = false
    }
  } catch (err: any) {
    console.error(err)
    ElMessage.error(err.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const saveDraft = async () => {
  submitting.value = true
  try {
    // 草稿保存到本地
    localStorage.setItem(`draft_${token}`, JSON.stringify(formData.value))
    ElMessage.success('草稿已保存')
  } catch (err) {
    console.error(err)
    ElMessage.error('保存草稿失败')
  } finally {
    submitting.value = false
  }
}

const updateData = () => {
  submitData()
}

onMounted(() => {
  loadFillData()
})
</script>

<style scoped>
</style>
