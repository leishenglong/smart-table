import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const userApi = {
  getUsers: () => request.get<any, ApiResponse>('/users'),
  createUser: (data: any) => request.post<any, ApiResponse>('/users', data),
  updateUser: (id: string, data: any) => request.put<any, ApiResponse>(`/users/${id}`, data),
  deleteUser: (id: string) => request.delete<any, ApiResponse>(`/users/${id}`),
  assignRoles: (id: string, roleIds: string[]) => request.post<any, ApiResponse>(`/users/${id}/roles`, { roleIds }),
  assignPermissions: (id: string, permissions: { permissionId: string; type: string }[]) => request.post<any, ApiResponse>(`/users/${id}/permissions`, { permissions }),
}
