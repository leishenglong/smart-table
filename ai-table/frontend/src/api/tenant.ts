import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const tenantApi = {
  getTenants: () => request.get<any, ApiResponse>('/tenants'),
  createTenant: (data: any) => request.post<any, ApiResponse>('/tenants', data),
  updateTenant: (id: string, data: any) => request.put<any, ApiResponse>(`/tenants/${id}`, data),
  deleteTenant: (id: string) => request.delete<any, ApiResponse>(`/tenants/${id}`),
}
