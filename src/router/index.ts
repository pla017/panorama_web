import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '全景展示'
    }
  },
  {
    path: '/analyzer',
    name: 'Analyzer',
    component: () => import('@/views/Analyzer.vue'),
    meta: {
      title: 'Line AI Analyzer'
    }
  },
  {
    path: '/panorama',
    name: 'Panorama',
    component: () => import('@/views/Panorama.vue'),
    meta: {
      title: '全景浏览'
    }
  },
  {
    path: '/demo',
    name: 'Demo',
    component: () => import('@/views/Demo.vue'),
    meta: {
      title: '演示页面'
    }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/Test.vue'),
    meta: {
      title: '功能测试'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
