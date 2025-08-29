import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const sidebarCollapsed = ref(false)

  // 计算属性
  const isDarkMode = computed(() => theme.value === 'dark')

  // 方法
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    // 状态
    loading,
    theme,
    sidebarCollapsed,
    // 计算属性
    isDarkMode,
    // 方法
    setLoading,
    toggleTheme,
    toggleSidebar
  }
})
