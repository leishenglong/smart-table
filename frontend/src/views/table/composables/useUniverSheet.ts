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
  // 注意：Univer 0.22 的 API 需要通过 command/mutation 来修改单元格数据
  // 这里暂时记录数据，实际的数据设置需要通过 Univer 的命令系统
  function setSheetData(config: TableConfig, data: TableRow[]) {
    console.log('Setting sheet data:', { config, data })
    // Univer 的数据操作需要通过 command 系统
    // 目前先记录数据，实际渲染由 Univer Sheet UI 自动处理空白的 spreadsheet
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
