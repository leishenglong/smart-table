<template>
  <div ref="containerRef" class="univer-sheet-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useUniverSheet } from './composables/useUniverSheet'
import type { TableConfig } from '@/types/univer'

interface Props {
  config?: TableConfig | null
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  config: null,
  readonly: false
})

const containerRef = ref<HTMLElement | null>(null)
const { univerInstance, isReady, initUniver, dispose } = useUniverSheet()

// 监听配置变化，重新初始化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig && isReady.value) {
      // 配置变化时可以重新加载数据
      console.log('Table config changed:', newConfig)
    }
  }
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
  isReady
})
</script>

<style scoped>
.univer-sheet-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
