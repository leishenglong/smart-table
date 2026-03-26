import { ref } from 'vue'

const isLoading = ref(false)
const loadingText = ref('加载中...')

export function useLoading() {
  const showLoading = (text = '加载中...') => {
    loadingText.value = text
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
  }

  return {
    isLoading,
    loadingText,
    showLoading,
    hideLoading
  }
}

// 全局单例
export function useGlobalLoading() {
  return {
    isLoading,
    loadingText,
    showLoading: (text = '加载中...') => {
      loadingText.value = text
      isLoading.value = true
    },
    hideLoading: () => {
      isLoading.value = false
    }
  }
}
