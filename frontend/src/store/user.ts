import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const currentTenantId = ref(localStorage.getItem('tenantId') || '')
  const userInfo = ref<any>(null)
  const permissions = ref<string[]>([])

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setTenantId(id: string) {
    currentTenantId.value = id
    localStorage.setItem('tenantId', id)
  }

  function setUserInfo(info: any) {
    userInfo.value = info
  }
  
  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  function logout() {
    token.value = ''
    currentTenantId.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('tenantId')
  }

  return {
    token,
    currentTenantId,
    userInfo,
    permissions,
    setToken,
    setTenantId,
    setUserInfo,
    setPermissions,
    logout
  }
})
