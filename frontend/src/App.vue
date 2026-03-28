<script setup lang="ts">
import GlobalLoading from '@/components/common/GlobalLoading.vue'
import { useGlobalLoading } from '@/composables/useLoading'

const { isLoading, loadingText } = useGlobalLoading()
</script>

<template>
  <router-view />
  <GlobalLoading :is-loading="isLoading" :text="loadingText" />
</template>

<style scoped>
</style>
