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
    console.log('[Univer] Starting initialization...')

    // 动态导入 Univer 模块
    Promise.all([
      import('@univerjs/core'),
      import('@univerjs/ui'),
      import('@univerjs/sheets'),
      import('@univerjs/sheets-ui')
    ]).then(async ([{ Univer, UniverInstanceType, Tools }, { UniverUIPlugin }, { UniverSheetsPlugin }, { UniverSheetsUIPlugin }]) => {
      console.log('[Univer] Modules loaded, creating instance...')

      try {
        const univer = new Univer()
        console.log('[Univer] Instance created, registering plugins...')

        univer.registerPlugin(UniverUIPlugin, {
          container,
          header: config?.header ?? false,
          toolbar: config?.toolbar ?? true,
          footer: false,
          contextMenu: true
        })
        console.log('[Univer] UIPlugin registered')

        univer.registerPlugin(UniverSheetsPlugin)
        console.log('[Univer] SheetsPlugin registered')

        univer.registerPlugin(UniverSheetsUIPlugin)
        console.log('[Univer] SheetsUIPlugin registered')

        // 创建默认的 sheet unit
        console.log('[Univer] Creating default sheet unit...')
        const { generateRandomId } = await import('@univerjs/core')
        const unitId = generateRandomId(6)
        univer.createUnit(UniverInstanceType.SHEET, {
          id: unitId,
          name: 'Sheet1',
          sheetData: {
            sheet1: {
              id: 'sheet1',
              cellData: {},
              rowData: {},
              columnData: {},
              rowCount: 0,
              columnCount: 0
            }
          }
        })
        console.log('[Univer] Sheet unit created with id:', unitId)

        univerInstance.value = univer
        isReady.value = true
        console.log('[Univer] Initialization complete!')
      } catch (err) {
        console.error('[Univer] Error during initialization:', err)
      }
    }).catch((error) => {
      console.error('[Univer] Failed to load modules:', error)
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
      console.log('[Univer] Loading data for table:', tableId)
      const res = await dataApi.getData(tableId, { page, pageSize })
      console.log('[Univer] Data loaded:', res)
      if (res.success && res.data) {
        sheetData.value = res.data
        // 设置数据到 Univer Sheet
        setSheetData(config, res.data)
        return res.data
      } else {
        console.warn('[Univer] No data or failed response:', res)
      }
      return []
    } catch (error) {
      console.error('[Univer] Failed to load data:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 设置数据到 Univer Sheet
  async function setSheetData(config: TableConfig, data: TableRow[]) {
    console.log('[Univer] Setting sheet data, config fields:', config.fields?.length, 'data rows:', data.length)

    const univer = univerInstance.value
    if (!univer) {
      console.error('[Univer] No univer instance!')
      return
    }

    try {
      // 获取 _units Map
      const unitsMap = (univer as any)._units
      if (unitsMap) {
        console.log('[Univer] Units Map size:', unitsMap.size)
        for (const [key, unit] of unitsMap) {
          console.log('[Univer] Unit key:', key, 'Unit type:', (unit as any)?.constructor?.name)
        }
      }

      // 获取 injector
      const injector = (univer as any).__getInjector?.()
      console.log('[Univer] Injector:', injector ? 'available' : 'not available')

      // 通过 UniverInstanceService 获取所有 sheets
      const [{ UniverInstanceType }] = await Promise.all([import('@univerjs/core')])
      const allSheets = univer.getAllUnits(UniverInstanceType.SHEET)
      console.log('[Univer] All sheets:', allSheets?.length)

      if (allSheets && allSheets.length > 0) {
        const workbook = allSheets[0]
        console.log('[Univer] First sheet:', workbook)

        // 获取 active sheet
        const sheet = workbook.getActiveSheet()
        console.log('[Univer] Active sheet:', sheet)

        if (sheet) {
          // 尝试设置数据
          const fields = config.fields || []

          // 构建单元格数据 (row, col) -> { v: value, t: type }
          const cellData = new Map<string, any>()

          // 设置表头
          fields.forEach((field, col) => {
            cellData.set(`${col}_0`, { v: field.name, t: 's' })
          })

          // 设置数据
          data.forEach((row, rowIndex) => {
            fields.forEach((field, col) => {
              const value = row.rowData?.[field.name]
              const type = field.type === 'number' ? 'n' : 's'
              cellData.set(`${col}_${rowIndex + 1}`, { v: value, t: type })
            })
          })

          console.log('[Univer] Cell data prepared, count:', cellData.size)

          // 尝试使用 sheet 的 API
          if (typeof sheet.importData === 'function') {
            sheet.importData(Object.fromEntries(cellData))
            console.log('[Univer] Data imported via importData')
          } else if (typeof sheet.setCellData === 'function') {
            for (const [pos, value] of cellData) {
              const [col, row] = pos.split('_').map(Number)
              sheet.setCellData(row, col, value)
            }
            console.log('[Univer] Data set via setCellData')
          } else {
            console.log('[Univer] No suitable import method found')
            console.log('[Univer] Sheet methods:', Object.keys(sheet).filter(k => typeof (sheet as any)[k] === 'function').slice(0, 20))
          }
        }
      } else {
        console.log('[Univer] No sheets found!')
      }

    } catch (error) {
      console.error('[Univer] Error setting sheet data:', error)
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
