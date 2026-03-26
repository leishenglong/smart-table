import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const roleApi = {
  getRoles: () => request.get<any, ApiResponse>('/roles'),
  createRole: (data: any) => request.post<any, ApiResponse>('/roles', data),
  updateRole: (id: string, data: any) => request.put<any, ApiResponse>(`/roles/${id}`, data),
  deleteRole: (id: string) => request.delete<any, ApiResponse>(`/roles/${id}`),
  assignPermissions: (id: string, permissionIds: string[]) => request.post<any, ApiResponse>(`/roles/${id}/permissions`, { permissionIds }),
}
