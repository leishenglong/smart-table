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
  function setSheetData(config: TableConfig, data: TableRow[]) {
    console.log('[Univer] Setting sheet data, config fields:', config.fields?.length, 'data rows:', data.length)

    const univer = univerInstance.value
    if (!univer) {
      console.error('[Univer] No univer instance!')
      return
    }

    // 检查 univer 实例有哪些可用的方法
    console.log('[Univer] Univer instance keys:', Object.keys(univer).slice(0, 20))

    // 尝试获取 workbook
    try {
      // Univer 0.22 API: 尝试通过 getGlobal 或类似方法获取当前文档
      const allUnits = (univer as any)._units
      console.log('[Univer] All units:', allUnits)

      if (allUnits) {
        const sheetUnits = Array.from(allUnits.values()).filter((u: any) =>
          u?.type?.toString().includes('SHEET')
        )
        console.log('[Univer] Sheet units:', sheetUnits.length)
      }
    } catch (e) {
      console.error('[Univer] Error accessing univer:', e)
    }

    // 数据已经在 sheetData 中，可以通过 UI 查看
    console.log('[Univer] Data is loaded in sheetData, total rows:', data.length)
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
