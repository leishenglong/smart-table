import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

// 督办API - 使用共享的 request 实例以正确携带认证 token
export const supervisionApi = {
  // 获取组织列表（任务下发用）
  getOrganizations: (tenantId?: string) =>
    request.get<any, ApiResponse<any[]>>('/supervision/organizations', {
      params: { tenantId }
    }),

  // 获取任务列表
  getTasks: (params?: { tenantId?: string; status?: string }) =>
    request.get<any, ApiResponse<any[]>>('/supervision/tasks', { params }),

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
  }) => request.post<any, ApiResponse<any>>('/supervision/tasks', data),

  // 获取任务详情
  getTask: (id: string) =>
    request.get<any, ApiResponse<any>>(`/supervision/tasks/${id}`),

  // 下发任务
  publishTask: (id: string, targetOrgIds: string[]) =>
    request.post<any, ApiResponse<any>>(`/supervision/tasks/${id}/publish`, { targetOrgIds }),

  // 获取填写链接
  getFillLink: (token: string) =>
    request.get<any, ApiResponse<any>>(`/supervision/fill/${token}`),

  // 提交填写数据
  submitFill: (token: string, data: { data: any; userId?: string; userName?: string }) =>
    request.post<any, ApiResponse<any>>(`/supervision/fill/${token}`, data),

  // 发送催办
  sendReminder: (id: string, data?: { targetIds?: string[]; type?: string; content?: string }) =>
    request.post<any, ApiResponse<any>>(`/supervision/tasks/${id}/remind`, data || {}),

  // 获取任务统计
  getTaskStats: (id: string) =>
    request.get<any, ApiResponse<any>>(`/supervision/tasks/${id}/stats`)
}