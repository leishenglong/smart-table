import type { FieldType, TableField } from '@/types/table'
import * as XLSX from 'xlsx'

export interface ExcelParseOptions {
  /** 表头前需要跳过的行数 */
  headerOffset: number
  /** 表头占用的行数 */
  headerRowCount: number
}

export interface ParsedSheet {
  sheetName: string
  headers: string[]
  rows: any[][]
  totalRows: number
  previewRows: Record<string, any>[]
  fields: TableField[]
}

export interface ParsedExcelResult {
  sheets: ParsedSheet[]
  workbook: XLSX.WorkBook
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 中国大陆手机号/固话简易正则
const PHONE_RE = /^(\+?86)?1[3-9]\d{9}$|^(\d{3,4}-)?\d{7,8}$/

/**
 * 展开合并单元格：把左上角值填充到合并区域内的所有单元格
 */
export function expandMergedCells(worksheet: XLSX.WorkSheet): void {
  const merges = worksheet['!merges']
  if (!merges || merges.length === 0) return

  for (const merge of merges) {
    const startRow = merge.s.r
    const startCol = merge.s.c
    const endRow = merge.e.r
    const endCol = merge.e.c

    const topLeftCell = worksheet[XLSX.utils.encode_cell({ r: startRow, c: startCol })]
    const value = topLeftCell?.v

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r === startRow && c === startCol) continue
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!worksheet[addr]) {
          worksheet[addr] = { t: topLeftCell?.t ?? 's', v: value }
        } else {
          worksheet[addr].v = value
        }
      }
    }
  }
}

function isEmptyCell(v: any): boolean {
  return v === null || v === undefined || v === ''
}

/**
 * 把单元格值规范化为可用作表头的字符串
 */
function normalizeHeaderValue(v: any): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toLocaleDateString('zh-CN')
  return String(v).trim()
}

/**
 * 构建表头名称：处理空表头和重复表头
 */
export function buildHeaderNames(rawHeaders: (string | null | undefined)[]): string[] {
  const seen = new Map<string, number>()
  return rawHeaders.map((h, i) => {
    let name = normalizeHeaderValue(h)
    if (!name) name = `字段${i + 1}`

    let count = seen.get(name) || 0
    seen.set(name, count + 1)
    if (count > 0) {
      name = `${name} (${count + 1})`
    }
    return name
  })
}

/**
 * 推断字段类型
 */
export function inferFieldType(values: any[]): FieldType {
  const nonEmpty = values.filter((v) => !isEmptyCell(v))
  if (nonEmpty.length === 0) return 'text'

  if (nonEmpty.every((v) => v instanceof Date)) return 'date'
  if (nonEmpty.every((v) => EMAIL_RE.test(String(v)))) return 'email'
  if (nonEmpty.every((v) => PHONE_RE.test(String(v)))) return 'phone'
  if (nonEmpty.every((v) => !isNaN(Number(v)) && String(v).trim() !== '')) return 'number'

  return 'text'
}

/**
 * 从原始行数组构建对象形式的 preview 行
 */
function buildPreviewRows(rows: any[][], headers: string[], count = 5): Record<string, any>[] {
  return rows.slice(0, count).map((row) => {
    const obj: Record<string, any> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? ''
    })
    return obj
  })
}

/**
 * 将每行补齐到指定列数
 */
function padRow(row: any[], cols: number): any[] {
  const arr = row ? [...row] : []
  while (arr.length < cols) arr.push('')
  return arr.slice(0, cols)
}

/**
 * 解析单个工作表
 */
export function parseWorksheet(
  worksheet: XLSX.WorkSheet,
  sheetName: string,
  options: ExcelParseOptions
): ParsedSheet {
  expandMergedCells(worksheet)

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: true,
  }) as any[][]

  if (jsonData.length === 0) {
    return {
      sheetName,
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: [],
      fields: [],
    }
  }

  const totalHeaderRows = options.headerOffset + options.headerRowCount
  if (totalHeaderRows > jsonData.length) {
    throw new Error(`表头配置超出工作表行数（工作表共 ${jsonData.length} 行）`)
  }

  // 先应用 headerOffset，不预先修剪前导空行（由用户通过 offset 控制）
  const headerRows = jsonData.slice(options.headerOffset, options.headerOffset + options.headerRowCount)
  let dataRows = jsonData.slice(options.headerOffset + options.headerRowCount)

  // 计算有效列数：先按原始 header + data 的最大宽度
  const rawMaxCols = Math.max(
    headerRows.reduce((max, row) => Math.max(max, row?.length || 0), 0),
    dataRows.reduce((max, row) => Math.max(max, row?.length || 0), 0)
  )

  // 从右侧修剪全空列
  let endCol = rawMaxCols - 1
  while (endCol >= 0) {
    let hasValue = false
    for (const row of [...headerRows, ...dataRows]) {
      if (!isEmptyCell(row?.[endCol])) {
        hasValue = true
        break
      }
    }
    if (hasValue) break
    endCol--
  }
  const colCount = endCol + 1

  // 合并多行表头
  const combinedHeaders: string[] = []
  for (let c = 0; c < colCount; c++) {
    const parts: string[] = []
    for (const row of headerRows) {
      const val = normalizeHeaderValue(row?.[c])
      if (val) parts.push(val)
    }
    combinedHeaders.push(parts.join(' - '))
  }

  const headers = buildHeaderNames(combinedHeaders)

  // 补齐并截取数据行
  let alignedRows = dataRows.map((row) => padRow(row, headers.length))

  // 修剪后导空行（保留中间空行）
  while (alignedRows.length > 0 && alignedRows[alignedRows.length - 1].every(isEmptyCell)) {
    alignedRows.pop()
  }

  // 过滤掉完全空的数据行（中间空行保留，但全空行无意义）
  alignedRows = alignedRows.filter((row) => !row.every(isEmptyCell))

  // 推断类型
  const fields: TableField[] = headers.map((name, colIndex) => {
    const samples = alignedRows.map((row) => row[colIndex])
    return {
      name,
      type: inferFieldType(samples),
      required: false,
      config: {},
    }
  })

  return {
    sheetName,
    headers,
    rows: alignedRows,
    totalRows: alignedRows.length,
    previewRows: buildPreviewRows(alignedRows, headers),
    fields,
  }
}


/**
 * 解析 Excel 文件中选中的 sheet
 */
/**
 * 获取 Excel 文件中的所有工作表名称
 */
export async function getWorkbookSheetNames(file: File): Promise<string[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  return workbook.SheetNames
}

/**
 * 解析 Excel 文件中选中的 sheet
 */
export async function parseExcelFile(
  file: File,
  sheetNames: string[],
  options: ExcelParseOptions
): Promise<ParsedExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheets = sheetNames
    .filter((name) => workbook.SheetNames.includes(name))
    .map((name) => parseWorksheet(workbook.Sheets[name], name, options))

  return { sheets, workbook }
}
