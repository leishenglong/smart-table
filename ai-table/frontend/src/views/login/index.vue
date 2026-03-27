<template>
  <div class="login-container min-h-screen flex">
    <!-- 左侧装饰区域 -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden items-center justify-center">
      <!-- 背景装饰 -->
      <div class="absolute inset-0">
        <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <!-- 装饰图案 -->
      <div class="absolute inset-0 opacity-10">
        <svg class="absolute top-20 left-20 w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
        </svg>
        <svg class="absolute bottom-32 right-20 w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>

      <!-- 内容 -->
      <div class="relative z-10 text-center px-12 max-w-lg">
        <div class="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          <Layers class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">DynamicTable</h1>
        <p class="text-lg text-white/80 mb-8">智能动态表格管理系统</p>
        <div class="space-y-4 text-left">
          <div class="flex items-center text-white/90">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
              <el-icon><Check /></el-icon>
            </div>
            <span>支持多种方式创建表格（AI、可视化、JSON）</span>
          </div>
          <div class="flex items-center text-white/90">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
              <el-icon><Check /></el-icon>
            </div>
            <span>完整的 CRUD、排序、筛选、分页功能</span>
          </div>
          <div class="flex items-center text-white/90">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
              <el-icon><Check /></el-icon>
            </div>
            <span>Excel 导入导出，批量数据处理</span>
          </div>
          <div class="flex items-center text-white/90">
            <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4 flex-shrink-0">
              <el-icon><Check /></el-icon>
            </div>
            <span>任务下发与督办，催办提醒</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="flex-1 flex items-center justify-center p-8 bg-background">
      <div class="w-full max-w-md">
        <!-- Logo（移动端显示） -->
        <div class="lg:hidden text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Layers class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-text-primary">DynamicTable</h1>
        </div>

        <!-- 登录卡片 -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-text-primary mb-2">欢迎回来</h2>
            <p class="text-text-tertiary">请登录您的账号继续使用</p>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            size="large"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username" class="!mb-5">
              <template #label>
                <span class="text-sm font-medium text-text-primary">用户名</span>
              </template>
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                class="!rounded-lg"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item prop="password" class="!mb-5">
              <template #label>
                <span class="text-sm font-medium text-text-primary">密码</span>
              </template>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
                class="!rounded-lg"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div class="flex items-center justify-between mb-6">
              <el-checkbox v-model="rememberMe" class="!text-text-secondary">
                记住我
              </el-checkbox>
              <el-button text class="!text-primary !px-0" @click="handleForgot">
                忘记密码？
              </el-button>
            </div>

            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              class="w-full !h-12 !rounded-lg !text-base !font-medium !shadow-lg !shadow-primary/30 hover:!shadow-xl hover:!shadow-primary/40"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>

          <!-- 其他登录方式 -->
          <div class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-text-tertiary">或</span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-3">
              <el-button class="w-full !h-11 !rounded-lg !border-border hover:!border-primary hover:!text-primary">
                <template #icon>
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                </template>
              </el-button>
              <el-button class="w-full !h-11 !rounded-lg !border-border hover:!border-primary hover:!text-primary">
                <template #icon>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                </template>
              </el-button>
              <el-button class="w-full !h-11 !rounded-lg !border-border hover:!border-primary hover:!text-primary">
                <template #icon>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z"/>
                  </svg>
                </template>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 注册提示 -->
        <p class="text-center mt-6 text-sm text-text-tertiary">
          还没有账号？
          <el-button text class="!text-primary !px-1" @click="handleRegister">
            立即注册
          </el-button>
        </p>

        <!-- 版权信息 -->
        <p class="text-center mt-4 text-xs text-text-tertiary">
          © 2024 DynamicTable. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/user'
import { Layers, Check, User, Lock } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await authApi.login({
        username: form.username,
        password: form.password
      })

      if (res.success && res.data) {
        userStore.setToken(res.data.token)
        userStore.setUserInfo(res.data.user)

        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('savedUsername', form.username)
        }

        ElMessage.success('登录成功')
        router.push('/')
      }
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}

const handleForgot = () => {
  ElMessage.info('请联系管理员重置密码')
}

const handleRegister = () => {
  ElMessage.info('注册功能开发中')
}
</script>

<style scoped>
.login-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
  }
}
</style>
