<template>
  <div class="sidebar-container">
    <!-- 可折叠侧边栏 -->
    <div :class="['sidebar', { 'collapsed': collapsed }]">
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </div>

      <!-- 侧边栏标题 -->
      <div class="sidebar-header" v-show="!collapsed">
        <h2 class="title">Line AI Analyzer</h2>
      </div>

      <!-- 导航菜单 -->
      <div class="nav-menu">
        <div 
          v-for="item in menuItems" 
          :key="item.key"
          :class="['nav-item', { 'active': activeMenu === item.key }]"
          @click="selectMenu(item.key)"
        >
          <div class="nav-icon">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </div>
          <span class="nav-text" v-show="!collapsed">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 遮罩层（移动端） -->
    <div 
      v-if="!collapsed && isMobile" 
      class="sidebar-overlay"
      @click="toggleCollapse"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  House, 
  Folder, 
  Upload, 
  View, 
  DataAnalysis, 
  Download, 
  Share,
  User,
  QuestionFilled,
  Fold,
  Expand
} from '@element-plus/icons-vue'

interface MenuItem {
  key: string
  label: string
  icon: any
}

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'menu-select': [key: string]
}>()

// 响应式数据
const collapsed = ref(props.modelValue || false)
const activeMenu = ref('home')
const windowWidth = ref(window.innerWidth)

// 菜单项配置
const menuItems: MenuItem[] = [
  { key: 'home', label: 'Home', icon: House },
  { key: 'project', label: 'Project', icon: Folder },
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'review', label: 'Review', icon: View },
  { key: 'analysis', label: 'Analysis', icon: DataAnalysis },
  { key: 'download', label: 'Download', icon: Download },
  { key: 'share', label: 'Share', icon: Share },
  { key: 'account', label: 'Account', icon: User },
  { key: 'help', label: 'Help', icon: QuestionFilled }
]

// 计算属性
const isMobile = computed(() => windowWidth.value < 768)

// 方法
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  emit('update:modelValue', collapsed.value)
}

const selectMenu = (key: string) => {
  activeMenu.value = key
  emit('menu-select', key)
  
  // 移动端选择后自动收起
  if (isMobile.value) {
    collapsed.value = true
    emit('update:modelValue', collapsed.value)
  }
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 默认选中 review
  activeMenu.value = 'review'
  emit('menu-select', 'review')
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.sidebar-container {
  position: relative;
  height: 100%;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar.collapsed {
  width: 60px;
}

.collapse-btn {
  position: absolute;
  right: -15px;
  top: 20px;
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #666;
  transition: all 0.3s ease;
  z-index: 1001;
}

.collapse-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.nav-menu {
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin: 2px 8px;
  border-radius: 8px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: white;
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.nav-text {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.sidebar.collapsed .nav-text {
  opacity: 0;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}
</style>
