import axios from 'axios'
import type { ApiResponse } from '@/types/table'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 督办API
export const supervisionApi = {
  // 获取组织列表（任务下发用）
  getOrganizations: (tenantId?: string) => 
    api.get<any, ApiResponse<any[]>>('/supervision/organizations', { 
      params: { tenantId } 
    }),

  // 获取任务列表
  getTasks: (params?: { tenantId?: string; status?: string }) =>
    api.get<any, ApiResponse<any[]>>('/supervision/tasks', { params }),

  // 创建任务
  createTask: (data: {
    tenantId?: string
    tableId: string
    name: string
    description?: string
    deadline?: string
    requireLogin?: boolean
    allowAnonymous?: boolean
    targetOrgIds?: string[]
    createdBy?: string
  }) => api.post<any, ApiResponse<any>>('/supervision/tasks', data),

  // 获取任务详情
  getTask: (id: string) =>
    api.get<any, ApiResponse<any>>(`/supervision/tasks/${id}`),

  // 下发任务
  publishTask: (id: string, targetOrgIds: string[]) =>
    api.post<any, ApiResponse<any>>(`/supervision/tasks/${id}/publish`, { targetOrgIds }),

  // 获取填写链接
  getFillLink: (token: string) =>
    api.get<any, ApiResponse<any>>(`/supervision/fill/${token}`),

  // 提交填写数据
  submitFill: (token: string, data: { data: any; userId?: string; userName?: string }) =>
    api.post<any, ApiResponse<any>>(`/supervision/fill/${token}`, data),

  // 发送催办
  sendReminder: (id: string, data?: { targetIds?: string[]; type?: string; content?: string }) =>
    api.post<any, ApiResponse<any>>(`/supervision/tasks/${id}/remind`, data || {}),

  // 获取任务统计
  getTaskStats: (id: string) =>
    api.get<any, ApiResponse<any>>(`/supervision/tasks/${id}/stats`)
}

export default api