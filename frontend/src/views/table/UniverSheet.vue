<template>
  <div ref="containerRef" class="univer-sheet-container">
    <div v-if="!isReady" class="flex items-center justify-center h-full">
      <el-icon class="is-loading text-2xl text-primary"><Loader2 /></el-icon>
      <span class="ml-2 text-text-secondary">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入 Univer CSS
import '@univerjs/ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUniverSheet } from './composables/useUniverSheet'
import type { TableConfig } from '@/types/univer'
import { dataApi } from '@/api/table'
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

const emit = defineEmits<{
  (e: 'dataLoaded', data: any[]): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const { univerInstance, isReady, isReadonly, setReadonly, initUniver, dispose, loadDataToSheet } = useUniverSheet()

// 监听只读状态变化
watch(
  () => props.readonly,
  (readonly) => {
    setReadonly(readonly)
  }
)

// 加载数据
async function loadData() {
  if (!props.tableId || !props.config) return

  try {
    const res = await dataApi.getData(props.tableId, { page: 1, pageSize: 100 })
    if (res.success && res.data) {
      emit('dataLoaded', res.data)
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

// 监听配置、tableId 和 isReady 变化，加载数据
watch(
  () => [props.config, props.tableId, isReady.value] as const,
  ([newConfig, newTableId, ready]) => {
    if (newConfig && newTableId && ready) {
      console.log('Univer ready, loading data...')
      loadDataToSheet(newTableId as string, newConfig as TableConfig)
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('UniverSheet mounted, initializing...')
  console.log('Container ref:', containerRef.value)
  if (containerRef.value) {
    console.log('Container dimensions:', containerRef.value.offsetWidth, containerRef.value.offsetHeight)
    console.log('Container parent dimensions:', containerRef.value.parentElement?.offsetWidth, containerRef.value.parentElement?.offsetHeight)
    initUniver(containerRef.value, {
      header: false,
      toolbar: true
    })
  } else {
    console.error('Container ref is null!')
  }
})

onUnmounted(() => {
  dispose()
})

defineExpose({
  univerInstance,
  isReady,
  loadData
})
</script>

<style scoped>
.univer-sheet-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #fafafa;
}
</style>
