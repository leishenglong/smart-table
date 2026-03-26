<template>
  <div class="h-screen w-full flex overflow-hidden bg-background">
    <!-- 侧边栏 -->
    <aside
      class="flex flex-col bg-white border-r border-border transition-all duration-300 z-20"
      :class="isCollapsed ? 'w-[72px]' : 'w-[260px]'"
    >
      <!-- Logo 区域 -->
      <div class="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        <div class="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <Layers class="w-5 h-5 text-white" />
        </div>
        <transition name="fade">
          <div v-if="!isCollapsed" class="ml-3 overflow-hidden">
            <span class="text-base font-bold text-text-primary whitespace-nowrap">DynamicTable</span>
            <p class="text-[10px] text-text-tertiary whitespace-nowrap">智能表格管理系统</p>
          </div>
        </transition>
      </div>

      <!-- 菜单区域 -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          class="!border-none"
          router
        >
          <!-- 工作台 -->
          <el-menu-item index="/home" class="!mb-1">
            <el-icon><Home /></el-icon>
            <template #title>工作台</template>
          </el-menu-item>

          <!-- 系统管理 -->
          <el-sub-menu index="system" class="menu-group">
            <template #title>
              <el-icon><Settings /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/organization" :class="{ 'is-active': route.path.startsWith('/organization') }">
              <el-icon><Building2 /></el-icon>
              <span>组织架构</span>
            </el-menu-item>
            <el-menu-item index="/user" :class="{ 'is-active': route.path.startsWith('/user') }">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/role" :class="{ 'is-active': route.path.startsWith('/role') }">
              <el-icon><Key /></el-icon>
              <span>角色权限</span>
            </el-menu-item>
            <el-menu-item index="/permission" :class="{ 'is-active': route.path.startsWith('/permission') }">
              <el-icon><Shield /></el-icon>
              <span>资源管理</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 业务模块 -->
          <el-sub-menu index="business" class="menu-group">
            <template #title>
              <el-icon><DataBoard /></el-icon>
              <span>业务模块</span>
            </template>
            <el-menu-item index="/config" :class="{ 'is-active': route.path.startsWith('/config') }">
              <el-icon><LayoutGrid /></el-icon>
              <span>表格配置</span>
            </el-menu-item>
            <el-menu-item index="/supervision/tasks" :class="{ 'is-active': route.path.startsWith('/supervision') }">
              <el-icon><FileCheck /></el-icon>
              <span>督办任务</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </nav>

      <!-- 折叠按钮 -->
      <div class="p-3 border-t border-border flex-shrink-0">
        <button
          @click="toggleCollapse"
          class="w-full h-10 flex items-center justify-center rounded-lg hover:bg-background-secondary transition-colors text-text-secondary hover:text-primary"
        >
          <el-icon :class="{ 'rotate-180': isCollapsed }" class="transition-transform duration-300">
            <Fold />
          </el-icon>
        </button>
      </div>

      <!-- 用户信息区 -->
      <div class="p-3 border-t border-border flex-shrink-0">
        <div class="flex items-center p-2 rounded-lg hover:bg-background-secondary transition-colors cursor-pointer group">
          <div class="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg shadow-primary/20">
            {{ userInitial }}
          </div>
          <transition name="fade">
            <div v-if="!isCollapsed" class="ml-3 overflow-hidden">
              <p class="text-sm font-medium text-text-primary truncate">{{ userName }}</p>
              <p class="text-[10px] text-text-tertiary truncate">系统管理员</p>
            </div>
          </transition>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col w-0 overflow-hidden">
      <!-- 顶部栏 -->
      <header class="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div class="flex items-center gap-4">
          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title && route.meta.title !== '首页'">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="flex items-center gap-4">
          <!-- 搜索框 -->
          <div class="relative">
            <el-input
              v-model="searchQuery"
              placeholder="搜索菜单..."
              prefix-icon="Search"
              size="small"
              class="w-48 !rounded-lg"
            />
          </div>

          <div class="h-6 w-px bg-border"></div>

          <!-- 租户选择器 -->
          <div class="flex items-center text-sm">
            <el-select
              v-model="currentTenant"
              placeholder="切换租户"
              size="small"
              class="!w-40"
              @change="handleTenantChange"
            >
              <template #prefix>
                <el-icon class="mr-1"><Building2 /></el-icon>
              </template>
              <el-option
                v-for="item in tenants"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>

          <!-- 通知图标 -->
          <el-button text circle class="!text-text-secondary hover:!text-primary">
            <el-badge :value="3" :max="9" class="item">
              <el-icon :size="20"><Bell /></el-icon>
            </el-badge>
          </el-button>

          <!-- 用户下拉菜单 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-background-secondary transition-colors">
              <span class="text-sm font-medium text-text-primary">{{ userName }}</span>
              <el-icon class="text-text-secondary"><ChevronDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Settings /></el-icon>
                  账号设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><LogOut /></el-icon>
                  <span class="text-functional-danger">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="flex-1 relative overflow-y-auto bg-background p-6 custom-scrollbar">
        <div class="h-full animate-fade-in">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { tenantApi } from '@/api/tenant'
import { authApi } from '@/api/auth'
import {
  Layers,
  Home,
  Settings,
  LayoutDashboard,
  Building2,
  User,
  Key,
  Shield,
  LayoutGrid,
  FileCheck,
  ChevronLeft,
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)
const searchQuery = ref('')
const tenants = ref<any[]>([])
const currentTenant = ref(userStore.currentTenantId)

const activeMenu = computed(() => {
  if (route.path.startsWith('/supervision')) {
    return '/supervision/tasks'
  }
  return route.path
})

const userName = computed(() => userStore.userInfo?.name || userStore.userInfo?.username || 'Admin')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const fetchTenants = async () => {
  try {
    const res = await tenantApi.getTenants()
    if (res.success && Array.isArray(res.data)) {
      tenants.value = res.data
      if (!userStore.currentTenantId && tenants.value.length > 0) {
        userStore.setTenantId(tenants.value[0].id)
        currentTenant.value = tenants.value[0].id
      }
    }
  } catch (error) {
    console.error('获取租户列表失败', error)
  }
}

const fetchCurrentUser = async () => {
  try {
    const res = await authApi.getMe()
    if (res.success && res.data) {
      userStore.setUserInfo(res.data)
      userStore.setPermissions(res.data.permissions || [])

      if (!userStore.currentTenantId && res.data.tenantId) {
        userStore.setTenantId(res.data.tenantId)
        currentTenant.value = res.data.tenantId
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

const initializeSession = async () => {
  if (!userStore.token) {
    router.replace('/login')
    return
  }

  try {
    await Promise.all([fetchCurrentUser(), fetchTenants()])
    currentTenant.value = userStore.currentTenantId
  } catch (error) {
    console.error('初始化登录态失败', error)
  }
}

const handleTenantChange = (tenantId: string) => {
  userStore.setTenantId(tenantId)
  currentTenant.value = tenantId
  ElMessage.success('租户切换成功')
  window.location.reload()
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } else if (command === 'profile') {
    ElMessage.info('个人中心功能开发中')
  } else if (command === 'settings') {
    ElMessage.info('账号设置功能开发中')
  }
}

onMounted(() => {
  initializeSession()
})
</script>

<style scoped>
/* 面包屑样式 */
:deep(.el-breadcrumb__inner) {
  color: #9CA3AF !important;
  font-weight: 500 !important;
}

:deep(.el-breadcrumb__inner a) {
  color: #9CA3AF !important;
  transition: color 0.2s !important;
}

:deep(.el-breadcrumb__inner a:hover) {
  color: #0052D9 !important;
}

:deep(.el-breadcrumb__separator) {
  color: #D1D5DB !important;
}

/* 菜单样式 */
:deep(.el-menu--collapse) {
  width: 72px !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px !important;
  line-height: 44px !important;
  padding-left: 12px !important;
  padding-right: 12px !important;
  border-radius: 10px !important;
  margin: 2px 0 !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(0, 82, 217, 0.1) 0%, rgba(0, 82, 217, 0.05) 100%) !important;
  color: #0052D9 !important;
  font-weight: 600 !important;
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #0052D9;
  border-radius: 0 2px 2px 0;
}

:deep(.el-sub-menu .el-menu-item) {
  padding-left: 44px !important;
  height: 40px !important;
  line-height: 40px !important;
}

:deep(.el-sub-menu__title) {
  padding-left: 12px !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 8px !important;
  box-shadow: none !important;
  border: 1px solid #E5E7EB !important;
  transition: all 0.2s !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: #D1D5DB !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #0052D9 !important;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1) !important;
}

/* 选择器样式 */
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px !important;
}

/* 下拉菜单 */
:deep(.el-dropdown-menu__item) {
  border-radius: 6px !important;
  margin: 2px 0 !important;
}

/* 徽章样式 */
:deep(.el-badge__content) {
  border: none !important;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
