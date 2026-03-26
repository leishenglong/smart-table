import request from '@/utils/request'
import type { TableConfig, TableField, ApiResponse, TableRow } from '@/types/table'

// 表格配置相关 API
export const tableApi = {
  // 获取所有表格
  getTables: () => request.get<any, ApiResponse<TableConfig[]>>('/tables'),

  // 获取单个表格配置
  getTable: (id: string) => request.get<any, ApiResponse<TableConfig>>(`/tables/${id}`),

  // 创建表格
  createTable: (data: { name: string; description?: string; fields: TableField[]; config?: any }) =>
    request.post<any, ApiResponse<TableConfig>>('/tables', data),

  // 更新表格
  updateTable: (id: string, data: Partial<TableConfig>) =>
    request.put<any, ApiResponse<TableConfig>>(`/tables/${id}`, data),

  // 删除表格
  deleteTable: (id: string) => request.delete<any, ApiResponse>(`/tables/${id}`),

  // 更新字段
  updateFields: (id: string, fields: TableField[]) =>
    request.put<any, ApiResponse>(`/tables/${id}/fields`, { fields }),

  // 更新授权组织
  updateAllowedOrgs: (id: string, allowedOrgs: string[]) =>
    request.put<any, ApiResponse>(`/tables/${id}/allowed-orgs`, { allowedOrgs })
}

// 数据相关 API
export const dataApi = {
  // 获取表格数据（分页）
  getData: (tableId: string, params?: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any[]>
  }) => {
    const requestParams = {
      ...params,
      filters: params?.filters ? JSON.stringify(params.filters) : undefined
    }

    return request.get<any, ApiResponse<TableRow[]>>(`/data/${tableId}`, { params: requestParams })
  },

  
  // 新增数据行
  addRow: (tableId: string, rowData: Record<string, any>) =>
    request.post<any, ApiResponse<TableRow>>(`/data/${tableId}`, { rowData }),
  
  // 更新数据行
  updateRow: (tableId: string, id: string, rowData: Record<string, any>) =>
    request.put<any, ApiResponse<TableRow>>(`/data/${tableId}/${id}`, { rowData }),
  
  // 删除数据行
  deleteRow: (tableId: string, id: string) =>
    request.delete<any, ApiResponse>(`/data/${tableId}/${id}`),
  
  // 批量删除数据行
  deleteRows: (tableId: string, ids: string[]) =>
    request.delete<any, ApiResponse>(`/data/${tableId}`, { data: { ids } }),
  
  // 批量导入数据
  importBatch: (tableId: string, rows: Record<string, any>[]) =>
    request.post<any, ApiResponse>(`/data/${tableId}/batch`, { rows }),

  // 批量设置数据归属组织
  setBatchOrg: (tableId: string, ids: string[], orgId: string | null) =>
    request.put<any, ApiResponse>(`/data/${tableId}/batch-org`, { ids, orgId })
}

// AI 相关 API
export const aiApi = {
  // 解析自然语言
  parse: (text: string) => request.post<any, ApiResponse<TableConfig>>('/ai/parse', { text })
}

export default request
