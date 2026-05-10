<template>
  <div ref="containerRef" class="univer-sheet-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUniverSheet } from './composables/useUniverSheet'
import type { TableConfig } from '@/types/univer'
import { dataApi } from '@/api/table'

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
const { univerInstance, isReady, initUniver, dispose, loadDataToSheet } = useUniverSheet()

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

// 监听配置和 tableId 变化，加载数据
watch(
  () => [props.config, props.tableId],
  async ([newConfig, newTableId]) => {
    if (newConfig && newTableId && isReady.value) {
      await loadDataToSheet(newTableId as string, newConfig as TableConfig)
    }
  },
  { immediate: false }
)

onMounted(() => {
  if (containerRef.value) {
    initUniver(containerRef.value, {
      header: false,
      toolbar: true
    })
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
}
</style>
