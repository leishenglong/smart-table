import request from '@/utils/request'
import type { ApiResponse } from '@/types/table'

export const organizationApi = {
  getOrganizations: () => request.get<any, ApiResponse<any[]>>('/organizations/tree'),
  getOrganizationTree: () => request.get<any, ApiResponse<any[]>>('/supervision/organizations'),
  createOrganization: (data: any) => request.post<any, ApiResponse>('/organizations', data),
  updateOrganization: (id: string, data: any) => request.put<any, ApiResponse>(`/organizations/${id}`, data),
  deleteOrganization: (id: string) => request.delete<any, ApiResponse>(`/organizations/${id}`),
}
