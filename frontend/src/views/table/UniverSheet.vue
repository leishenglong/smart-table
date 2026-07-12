<template>
  <div ref="containerRef" class="univer-sheet-container">
    <div v-show="!isReady" class="flex items-center justify-center h-full">
      <el-icon class="is-loading text-2xl text-primary"><Loader2 /></el-icon>
      <span class="ml-2 text-text-secondary">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入 Univer CSS
import '@univerjs/ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/design/lib/index.css'

import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useUniverSheet } from './composables/useUniverSheet'
import type { TableConfig } from '@/types/univer'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  tableId?: string
  config?: TableConfig | null
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tableId: '',
  config: null,
  readonly: false
})

const containerRef = ref<HTMLElement | null>(null)
const { isReady, setReadonly, initUniver, dispose, loadDataToSheet } = useUniverSheet()

// 监听只读状态变化
watch(
  () => props.readonly,
  (readonly) => {
    setReadonly(readonly)
  }
)

// 数据加载：ready 且 config/tableId 就绪时触发一次；config 后到时再触发一次
function tryLoad() {
  if (isReady.value && props.config && props.tableId) {
    loadDataToSheet(props.tableId, props.config)
  }
}

watch(isReady, (ready) => {
  if (ready) tryLoad()
})

watch(
  () => props.config,
  (config) => {
    if (config) tryLoad()
  }
)

onMounted(async () => {
  if (!containerRef.value) return
  await nextTick() // 确保容器布局完成（拿到正确尺寸）
  initUniver(containerRef.value, {
    header: false,
    toolbar: true
  })
})

onUnmounted(() => {
  dispose()
})

defineExpose({
  isReady
})
</script>

<style scoped>
.univer-sheet-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}
</style>
