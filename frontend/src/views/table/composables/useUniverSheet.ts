import { ref, shallowRef, onUnmounted } from 'vue'
import type { Univer } from '@univerjs/core'
import type { FUniver } from '@univerjs/presets'
import type { TableConfig, TableRow } from '@/types/univer'
import { dataApi } from '@/api/table'

export function useUniverSheet() {
  const univerInstance = shallowRef<Univer | null>(null)
  const isLoading = ref(false)
  const isReady = ref(false)
  const isReadonly = ref(false)
  const sheetData = ref<TableRow[]>([])
  let univerAPI: FUniver | null = null

  // 设置只读模式：通过 Univer 工作簿的可编辑开关实现
  function setReadonly(readonly: boolean) {
    isReadonly.value = readonly
    univerAPI?.getActiveWorkbook()?.setEditable(!readonly)
  }

  // 初始化 Univer（使用官方 presets，含 locale 与公式支持）
  async function initUniver(container: HTMLElement, config?: { header?: boolean; toolbar?: boolean }) {
    try {
      const { createUniver, LocaleType } = await import('@univerjs/presets')
      const { UniverSheetsCorePreset } = await import('@univerjs/preset-sheets-core')
      const zhCN = (await import('@univerjs/preset-sheets-core/lib/locales/zh-CN')).default

      const { univer, univerAPI: api } = createUniver({
        locale: LocaleType.ZH_CN,
        locales: { [LocaleType.ZH_CN]: zhCN },
        presets: [
          UniverSheetsCorePreset({
            container,
            header: config?.header ?? false,
            toolbar: config?.toolbar ?? true,
            contextMenu: true,
          }),
        ],
      })

      // 创建一个空工作簿，先把表格网格渲染出来，数据后续填充
      api.createUniverSheet({
        sheets: {
          sheet1: { id: 'sheet1', name: 'DataSheet', cellData: {} },
        },
      })

      univerAPI = api
      univerInstance.value = univer
      isReady.value = true

      // 若初始化前已处于只读，应用一次
      if (isReadonly.value) setReadonly(true)
    } catch (err) {
      console.error('[Univer] init failed:', err)
    }
  }

  // 销毁
  function dispose() {
    if (univerInstance.value) {
      univerInstance.value.dispose()
      univerInstance.value = null
      univerAPI = null
      isReady.value = false
    }
  }

  // 加载数据到 Univer Sheet
  async function loadDataToSheet(tableId: string, config: TableConfig, page = 1, pageSize = 100) {
    if (!univerAPI) {
      console.warn('[Univer] instance not ready, skip load')
      return []
    }

    isLoading.value = true
    try {
      const res = await dataApi.getData(tableId, { page, pageSize })
      if (res.success && res.data) {
        sheetData.value = res.data
        setSheetData(config, res.data)
        return res.data
      }
      return []
    } catch (error) {
      console.error('[Univer] load data failed:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 设置数据到当前活动 sheet（复用默认 sheet，避免每次刷新累积重复 sheet）
  function setSheetData(config: TableConfig, data: TableRow[]) {
    if (!univerAPI) return
    const fWorkbook = univerAPI.getActiveWorkbook()
    if (!fWorkbook) return

    const fSheet = fWorkbook.getActiveSheet()
    if (!fSheet) return

    const fields = config.fields || []
    const header = fields.map((f) => f.name)
    // 后端每行结构为 { id, tableId, rowData: {字段名: 值} }，单元格值取自 rowData
    const rows = (data || []).map((row) => fields.map((f) => row.rowData?.[f.name] ?? ''))
    const matrix = [header, ...rows]

    // 先扩展 sheet 的行列上限，再写入数据
    fSheet.setRowCount(Math.max(matrix.length, 1))
    fSheet.setColumnCount(Math.max(fields.length, 1))

    if (fields.length > 0 && matrix.length > 0) {
      fSheet.getRange(0, 0, matrix.length, fields.length).setValues(matrix)
    }

    // 列宽
    fields.forEach((_, i) => fSheet.setColumnWidth(i, 140))
  }

  onUnmounted(() => {
    dispose()
  })

  return {
    univerInstance,
    isLoading,
    isReady,
    isReadonly,
    setReadonly,
    sheetData,
    initUniver,
    dispose,
    loadDataToSheet,
  }
}
