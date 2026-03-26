// AI 服务 - 解析自然语言生成表格配置
// 这里使用简单的规则匹配，实际项目中可以接入大模型API

interface FieldConfig {
  name: string
  type: string
  required: boolean
  config: Record<string, any>
}

interface TableConfig {
  name: string
  description: string
  fields: FieldConfig[]
}

// 字段类型关键词映射
const fieldTypeKeywords: Record<string, { keywords: string[], type: string }> = {
  text: { keywords: ['姓名', '名称', '标题', '描述', '地址', '备注'], type: 'text' },
  number: { keywords: ['年龄', '数量', '金额', '价格', '工资', '数量', '编号', '工号'], type: 'number' },
  date: { keywords: ['日期', '时间', '入职', '出生', '创建', '更新'], type: 'date' },
  email: { keywords: ['邮箱', 'email', '邮件'], type: 'email' },
  phone: { keywords: ['电话', '手机', '联系方式'], type: 'phone' },
  select: { keywords: ['部门', '状态', '类型', '级别', '分类', '性别'], type: 'select' },
  checkbox: { keywords: ['是否', '是否启用', '是否有效'], type: 'checkbox' }
}

// 从自然语言解析表格配置
export async function parseTableFromNaturalLanguage(text: string): Promise<TableConfig> {
  // 提取表格名称
  let tableName = '未命名表格'
  
  if (text.includes('员工') || text.includes('人员')) {
    tableName = '员工管理表'
  } else if (text.includes('产品') || text.includes('商品')) {
    tableName = '产品信息表'
  } else if (text.includes('订单')) {
    tableName = '订单管理表'
  } else if (text.includes('客户')) {
    tableName = '客户信息表'
  } else if (text.includes('项目')) {
    tableName = '项目管理表'
  }
  
  // 提取字段
  const fields: FieldConfig[] = []
  const words = text.split(/[,，、和与包含有及]/)
  
  for (const word of words) {
    const trimmed = word.trim()
    if (!trimmed) continue
    
    // 检测字段类型
    let detectedType = 'text'
    let config: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(fieldTypeKeywords)) {
      if (value.keywords.some(kw => trimmed.includes(kw))) {
        detectedType = value.type
        break
      }
    }
    
    // 提取字段名称（去除常见修饰词）
    let fieldName = trimmed
      .replace(/包含|有|包括|字段|列|信息|数据/g, '')
      .replace(/等[。，,]*/g, '')
      .trim()
    
    if (fieldName && fieldName.length > 0 && fieldName.length < 20) {
      // 特殊处理下拉选项
      if (detectedType === 'select') {
        if (fieldName.includes('部门')) {
          config.options = ['技术部', '产品部', '设计部', '市场部', '运营部', '人事部', '财务部']
        } else if (fieldName.includes('状态')) {
          config.options = ['进行中', '已完成', '已取消']
        } else if (fieldName.includes('性别')) {
          config.options = ['男', '女']
        }
      }
      
      fields.push({
        name: fieldName,
        type: detectedType,
        required: true,
        config
      })
    }
  }
  
  // 如果没有识别到字段，添加默认字段
  if (fields.length === 0) {
    fields.push(
      { name: '名称', type: 'text', required: true, config: {} },
      { name: '创建时间', type: 'date', required: false, config: {} }
    )
  }
  
  return {
    name: tableName,
    description: text,
    fields
  }
}
