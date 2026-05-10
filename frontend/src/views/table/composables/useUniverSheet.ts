import { ref, shallowRef, onUnmounted } from 'vue'
import type { Univer } from '@univerjs/core'
import type { TableConfig, TableRow } from '@/types/univer'
import { dataApi } from '@/api/table'

export function useUniverSheet() {
  const univerInstance = shallowRef<Univer | null>(null)
  const isLoading = ref(false)
  const isReady = ref(false)
  const isReadonly = ref(false)
  const sheetData = ref<any[]>([])

  // 设置只读模式
  function setReadonly(readonly: boolean) {
    isReadonly.value = readonly
    // Univer 0.22 中可能需要通过配置或命令来设置只读
    // 目前先记录状态
    if (univerInstance.value) {
      const workbook = univerInstance.value.getActiveWorkbook()
      if (workbook) {
        // Univer 是否支持只读配置需要验证
        // 如果不支持，可以通过禁用工具栏来达到效果
      }
    }
  }

  // 初始化 Univer
  function initUniver(container: HTMLElement, config?: { header?: boolean; toolbar?: boolean }) {
    // 动态导入避免打包问题
    Promise.all([
      import('@univerjs/core'),
      import('@univerjs/ui'),
      import('@univerjs/sheets'),
      import('@univerjs/sheets-ui')
    ]).then(([{ Univer }, { UniverUIPlugin }, { UniverSheetsPlugin }, { UniverSheetsUIPlugin }]) => {
      // 导入 CSS
      import('@univerjs/ui/lib/index.css')
      import('@univerjs/sheets-ui/lib/index.css')

      const univer = new Univer()
      univer.registerPlugin(UniverUIPlugin, {
        container,
        header: config?.header ?? false,
        toolbar: config?.toolbar ?? true,
        footer: false,
        contextMenu: true
      })
      univer.registerPlugin(UniverSheetsPlugin)
      univer.registerPlugin(UniverSheetsUIPlugin)

      univerInstance.value = univer
      isReady.value = true
    })
  }

  // 销毁
  function dispose() {
    if (univerInstance.value) {
      univerInstance.value.dispose()
      univerInstance.value = null
      isReady.value = false
    }
  }

  // 加载数据到 Univer Sheet
  async function loadDataToSheet(tableId: string, config: TableConfig, page = 1, pageSize = 100) {
    if (!univerInstance.value) {
      console.warn('Univer instance not ready')
      return []
    }

    isLoading.value = true
    try {
      const res = await dataApi.getData(tableId, { page, pageSize })
      if (res.success && res.data) {
        sheetData.value = res.data
        // 设置数据到 Univer Sheet
        setSheetData(config, res.data)
        return res.data
      }
      return []
    } catch (error) {
      console.error('Failed to load data:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 设置数据到 Univer Sheet
  function setSheetData(config: TableConfig, data: TableRow[]) {
    const univer = univerInstance.value
    if (!univer) return

    try {
      // 获取当前活动的 workbook 和 sheet
      const workbook = univer.getGlobal('CurrentUniverDoc')
      if (!workbook) {
        console.warn('No active workbook')
        return
      }

      // 使用 Univer 的方式设置数据
      // 这里需要根据 Univer 0.22 的 API 来设置数据到单元格
      // 简化处理：直接通过 workbook 操作
      const sheet = workbook.getActiveSheet()
      if (!sheet) return

      // 构建单元格数据
      const cells: Record<string, any> = {}
      const fields = config.fields || []

      // 设置表头
      fields.forEach((field, colIndex) => {
        const cellPosition = `${String.fromCharCode(65 + colIndex)}1`
        cells[cellPosition] = {
          v: field.name,
          m: field.name
        }
      })

      // 设置数据行
      data.forEach((row, rowIndex) => {
        fields.forEach((field, colIndex) => {
          const cellPosition = `${String.fromCharCode(65 + colIndex)}${rowIndex + 2}`
          const value = row.rowData?.[field.name] ?? ''
          cells[cellPosition] = {
            v: value,
            m: String(value)
          }
        })
      })

      // 使用 Univer 的 setRangeValues 或者类似方法设置数据
      if (sheet.setRangeValues) {
        sheet.setRangeValues(cells)
      }
    } catch (error) {
      console.error('Failed to set sheet data:', error)
    }
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
    loadDataToSheet
  }
}
