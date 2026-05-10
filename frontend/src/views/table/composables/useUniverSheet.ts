import { ref, shallowRef, onUnmounted } from 'vue'
import type { Univer } from '@univerjs/core'
import type { TableConfig, TableRow } from '@/types/univer'

export function useUniverSheet() {
  const univerInstance = shallowRef<Univer | null>(null)
  const isLoading = ref(false)
  const isReady = ref(false)

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

  onUnmounted(() => {
    dispose()
  })

  return {
    univerInstance,
    isLoading,
    isReady,
    initUniver,
    dispose
  }
}
