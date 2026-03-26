import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const authApi = {
  login: (data: any) => request.post<any, ApiResponse>('/auth/login', data),
  register: (data: any) => request.post<any, ApiResponse>('/auth/register', data),
  getMe: () => request.get<any, ApiResponse>('/auth/me'),
}
