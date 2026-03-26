// 表格字段类型
export type FieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'checkbox'

// 字段配置
export interface TableField {
  id?: string
  name: string
  type: FieldType
  required: boolean
  config: FieldConfig
  order?: number
}

// 字段额外配置
export interface FieldConfig {
  options?: string[] // select 类型的选项
  min?: number // number 类型的最小值
  max?: number // number 类型的最大值
  placeholder?: string
  default?: any
  fixed?: 'left' | 'right' // 固定列位置
}

// 表格配置
export interface TableConfig {
  id?: string
  name: string
  description?: string
  config: Record<string, any>
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
}

// 表格数据行
export interface TableRow {
  id: string
  tableId: string
  rowData: Record<string, any>
  createdAt?: string
  updatedAt?: string
}

// API 响应
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
