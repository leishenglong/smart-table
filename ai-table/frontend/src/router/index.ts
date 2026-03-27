import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/',
      component: () => import('@/views/layout/index.vue'),
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '首页' }
        },
        {
          path: 'table/:id',
          name: 'table',
          component: () => import('@/views/table/index.vue'),
          meta: { title: '表格展示' }
        },
        {
          path: 'config/:id?',
          name: 'config',
          component: () => import('@/views/config/index.vue'),
          meta: { title: '表格配置' }
        },
        {
          path: 'organization',
          name: 'organization',
          component: () => import('@/views/organization/index.vue'),
          meta: { title: '组织架构管理' }
        },
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/user/index.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'role',
          name: 'role',
          component: () => import('@/views/role/index.vue'),
          meta: { title: '角色权限管理' }
        },
        {
          path: 'permission',
          name: 'permission',
          component: () => import('@/views/permission/index.vue'),
          meta: { title: '权限资源管理' }
        },
        {
          path: 'supervision/tasks',
          name: 'supervision-tasks',
          component: () => import('@/views/supervision/tasks.vue'),
          meta: { title: '督办任务管理' }
        }

      ]
    },
    {
      path: '/fill/:token',
      name: 'fill',
      component: () => import('@/views/supervision/fill.vue'),
      meta: { title: '填写表格' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.path === '/login' && token) {
    next('/')
    return
  }

  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }

  next()
})

export default router
