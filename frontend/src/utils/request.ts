import axios from 'axios'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()

    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    if (userStore.currentTenantId) {
      config.headers['x-tenant-id'] = userStore.currentTenantId
    }

    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const payload = response.data

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload
    }

    return {
      success: true,
      data: payload
    }
  },
  error => {
    console.error('API Error:', error)

    const message = error.response?.data?.message || error.response?.data?.error || '请求失败，请稍后重试'

    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  }
)

export default request
