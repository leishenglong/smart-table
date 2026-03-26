<template>
  <div class="skeleton" :class="{ 'animate-pulse': animate }">
    <!-- 统计卡片骨架屏 -->
    <div v-if="type === 'stat-cards'" class="grid grid-cols-4 gap-5 mb-6">
      <div v-for="i in count" :key="i" class="bg-white rounded-xl p-5 shadow-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="w-16 h-6 rounded-full bg-background-secondary"></div>
        </div>
        <div class="w-20 h-8 rounded bg-background-secondary mb-2"></div>
        <div class="w-24 h-4 rounded bg-background-secondary"></div>
      </div>
    </div>

    <!-- 表格列表骨架屏 -->
    <div v-else-if="type === 'table-list'" class="bg-white rounded-xl p-5 shadow-card">
      <div class="flex items-center justify-between mb-4">
        <div class="w-32 h-6 rounded bg-background-secondary"></div>
        <div class="w-24 h-8 rounded-lg bg-background-secondary"></div>
      </div>
      <div class="space-y-3">
        <div v-for="i in (count || 5)" :key="i" class="flex items-center p-4 rounded-xl bg-background-secondary/50">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 ml-4 space-y-2">
            <div class="w-48 h-4 rounded bg-background-secondary"></div>
            <div class="w-32 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-16 h-6 rounded-full bg-background-secondary"></div>
        </div>
      </div>
    </div>

    <!-- 表格式骨架屏 -->
    <div v-else-if="type === 'table'" class="bg-white rounded-xl overflow-hidden shadow-card">
      <div class="flex items-center gap-4 p-4 bg-background-secondary">
        <div v-for="i in (columns || 5)" :key="i" class="flex-1 h-4 rounded bg-background-tertiary"></div>
      </div>
      <div class="divide-y divide-border">
        <div v-for="i in (count || 10)" :key="i" class="flex items-center gap-4 p-4">
          <div v-for="j in (columns || 5)" :key="j" class="flex-1 h-4 rounded bg-background-secondary"></div>
        </div>
      </div>
    </div>

    <!-- 表单骨架屏 -->
    <div v-else-if="type === 'form'" class="bg-white rounded-xl p-6 shadow-card space-y-4">
      <div v-for="i in (count || 6)" :key="i" class="space-y-2">
        <div class="w-20 h-4 rounded bg-background-secondary"></div>
        <div class="w-full h-10 rounded-lg bg-background-secondary"></div>
      </div>
      <div class="flex gap-4 pt-4">
        <div class="w-24 h-10 rounded-lg bg-background-secondary"></div>
        <div class="w-24 h-10 rounded-lg bg-background-secondary"></div>
      </div>
    </div>

    <!-- 卡片列表骨架屏 -->
    <div v-else-if="type === 'card-list'" class="grid grid-cols-3 gap-6">
      <div v-for="i in (count || 6)" :key="i" class="bg-white rounded-xl p-5 shadow-card space-y-3">
        <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
        <div class="w-32 h-4 rounded bg-background-secondary"></div>
        <div class="w-full h-3 rounded bg-background-secondary"></div>
        <div class="w-3/4 h-3 rounded bg-background-secondary"></div>
      </div>
    </div>

    <!-- 通用骨架屏 -->
    <div v-else class="space-y-4">
      <div v-for="i in (count || 5)" :key="i" class="bg-white rounded-xl p-5 shadow-card">
        <div class="w-48 h-6 rounded bg-background-secondary mb-4"></div>
        <div class="space-y-2">
          <div class="w-full h-4 rounded bg-background-secondary"></div>
          <div class="w-full h-4 rounded bg-background-secondary"></div>
          <div class="w-3/4 h-4 rounded bg-background-secondary"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'stat-cards' | 'table-list' | 'table' | 'form' | 'card-list' | 'default'
  count?: number
  columns?: number
  animate?: boolean
}>(), {
  type: 'default',
  count: 5,
  animate: true
})
</script>

<style scoped>
.skeleton {
  pointer-events: none;
}

.animate-pulse .skeleton > div,
.animate-pulse div[class*="bg-background"] {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
