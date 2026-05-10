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
    ]).then(([{ Univer }, { UniverUIPlugin }, { UniverSheetsPlugin }, { UniverSheetsUIPlugin }]) => {
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
      // 动态导入 command 相关模块
      const commandModules = await Promise.all([
        import('@univerjs/sheets'),
        import('@univerjs/sheets-ui')
      ])

      console.log('[Univer] Command modules loaded')

      // 尝试通过 injector 获取 command service
      const injector = (univer as any).__getInjector?.()
      if (injector) {
        console.log('[Univer] Got injector')
      } else {
        console.log('[Univer] No injector available')
      }

      // 获取 _units Map
      const unitsMap = (univer as any)._units
      if (unitsMap) {
        console.log('[Univer] Units Map size:', unitsMap.size)
        for (const [key, unit] of unitsMap) {
          console.log('[Univer] Unit key:', key, 'Unit type:', typeof unit)
        }
      }

      // 尝试获取 workbook
      const workbook = (univer as any)._getActiveWorkbook?.() || (univer as any)._activeWorkbook
      console.log('[Univer] Workbook:', workbook)

      if (workbook) {
        const sheet = workbook.getActiveSheet()
        console.log('[Univer] Active sheet:', sheet)

        if (sheet) {
          // 使用 RangeValue API 设置数据
          const fields = config.fields || []
          const range = sheet.getRange(0, 0, data.length + 1, fields.length)

          if (range) {
            console.log('[Univer] Got range, setting values...')

            // 构建 2D 数组数据
            const values: any[][] = []

            // 表头行
            values.push(fields.map(f => f.name))

            // 数据行
            data.forEach(row => {
              values.push(fields.map(f => row.rowData?.[f.name] ?? ''))
            })

            // 设置值
            // range.setValues(values) // 取决于 API

            console.log('[Univer] Values prepared:', values.length, 'rows')
          }
        }
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
