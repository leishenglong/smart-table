<template>
  <div class="page-skeleton">
    <!-- 页面头部骨架屏 -->
    <div v-if="showHeader" class="mb-6">
      <div class="bg-white rounded-xl p-6 shadow-card">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="w-48 h-7 rounded bg-background-secondary"></div>
            <div class="w-64 h-4 rounded bg-background-secondary"></div>
          </div>
          <div class="w-24 h-10 rounded-lg bg-background-secondary"></div>
        </div>
      </div>
    </div>

    <!-- 统计卡片骨架屏 -->
    <div v-if="showStats" class="grid grid-cols-4 gap-5 mb-6">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl p-5 shadow-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="w-16 h-6 rounded-full bg-background-secondary"></div>
        </div>
        <div class="w-20 h-8 rounded bg-background-secondary mb-2"></div>
        <div class="w-24 h-4 rounded bg-background-secondary"></div>
      </div>
    </div>

    <!-- 内容区骨架屏 -->
    <div v-if="showContent" class="grid gap-6" :class="contentColsClass">
      <div class="bg-white rounded-xl p-5 shadow-card">
        <div class="w-32 h-6 rounded bg-background-secondary mb-4"></div>
        <div class="space-y-3">
          <div v-for="i in 4" :key="i" class="flex items-center p-3 rounded-lg bg-background-secondary/50">
            <div class="w-10 h-10 rounded-xl bg-background-secondary"></div>
            <div class="flex-1 ml-3 space-y-2">
              <div class="w-48 h-4 rounded bg-background-secondary"></div>
              <div class="w-32 h-3 rounded bg-background-secondary"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-if="showTable" class="bg-white rounded-xl overflow-hidden shadow-card">
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="w-32 h-6 rounded bg-background-secondary"></div>
        <div class="flex gap-3">
          <div class="w-32 h-8 rounded-lg bg-background-secondary"></div>
          <div class="w-24 h-8 rounded-lg bg-background-secondary"></div>
        </div>
      </div>
      <div class="divide-y divide-border">
        <div class="flex items-center gap-4 p-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 space-y-2">
            <div class="w-1/3 h-4 rounded bg-background-secondary"></div>
            <div class="w-1/4 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-20 h-6 rounded-full bg-background-secondary"></div>
          <div class="w-16 h-4 rounded bg-background-secondary"></div>
        </div>
        <div class="flex items-center gap-4 p-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 space-y-2">
            <div class="w-1/3 h-4 rounded bg-background-secondary"></div>
            <div class="w-1/4 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-20 h-6 rounded-full bg-background-secondary"></div>
          <div class="w-16 h-4 rounded bg-background-secondary"></div>
        </div>
        <div class="flex items-center gap-4 p-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 space-y-2">
            <div class="w-1/3 h-4 rounded bg-background-secondary"></div>
            <div class="w-1/4 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-20 h-6 rounded-full bg-background-secondary"></div>
          <div class="w-16 h-4 rounded bg-background-secondary"></div>
        </div>
        <div class="flex items-center gap-4 p-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 space-y-2">
            <div class="w-1/3 h-4 rounded bg-background-secondary"></div>
            <div class="w-1/4 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-20 h-6 rounded-full bg-background-secondary"></div>
          <div class="w-16 h-4 rounded bg-background-secondary"></div>
        </div>
        <div class="flex items-center gap-4 p-4">
          <div class="w-12 h-12 rounded-xl bg-background-secondary"></div>
          <div class="flex-1 space-y-2">
            <div class="w-1/3 h-4 rounded bg-background-secondary"></div>
            <div class="w-1/4 h-3 rounded bg-background-secondary"></div>
          </div>
          <div class="w-20 h-6 rounded-full bg-background-secondary"></div>
          <div class="w-16 h-4 rounded bg-background-secondary"></div>
        </div>
      </div>
    </div>

    <!-- 自定义插槽 -->
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  showHeader?: boolean
  showStats?: boolean
  showContent?: boolean
  showTable?: boolean
  contentColsClass?: string
}>(), {
  showHeader: false,
  showStats: false,
  showContent: false,
  showTable: false,
  contentColsClass: 'grid-cols-3'
})
</script>

<style scoped>
.page-skeleton {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.page-skeleton > div,
.page-skeleton .bg-background-secondary {
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
