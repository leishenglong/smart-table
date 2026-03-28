import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const permissionApi = {
  getPermissions: () => request.get<any, ApiResponse>('/permissions/tree'),
  createPermission: (data: any) => request.post<any, ApiResponse>('/permissions', data),
  updatePermission: (id: string, data: any) => request.put<any, ApiResponse>(`/permissions/${id}`, data),
  deletePermission: (id: string) => request.delete<any, ApiResponse>(`/permissions/${id}`),
}
