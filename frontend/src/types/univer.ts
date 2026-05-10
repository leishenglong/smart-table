// 字段类型
export type FieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'checkbox'

// 字段配置
export interface TableField {
  id?: string
  name: string
  type: FieldType
  required: boolean
  config: FieldConfig
}

export interface FieldConfig {
  options?: string[]
  min?: number
  max?: number
  placeholder?: string
  default?: any
  fixed?: 'left' | 'right'
}

// 表格配置（来自后端）
export interface TableConfig {
  id?: string
  name: string
  description?: string
  config: Record<string, any>
  fields: TableField[]
  createdAt?: string
  updatedAt?: string
}

// 表格数据行（来自后端）
export interface TableRow {
  id: string
  tableId: string
  rowData: Record<string, any>
  createdAt?: string
  updatedAt?: string
}
