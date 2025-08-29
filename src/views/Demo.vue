<template>
  <div class="demo-page min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <el-button @click="goHome" text>
              <el-icon><ArrowLeft /></el-icon>
              返回首页
            </el-button>
            <h1 class="ml-4 text-xl font-semibold text-gray-900">技术演示</h1>
          </div>
          <div class="flex items-center">
            <el-switch
              v-model="isDarkMode"
              @change="toggleTheme"
              active-text="深色模式"
              inactive-text="浅色模式"
            />
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 技术栈展示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">技术栈展示</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <el-card v-for="tech in techStack" :key="tech.name" shadow="hover" class="tech-card">
            <div class="text-center">
              <div class="text-4xl mb-4">{{ tech.icon }}</div>
              <h3 class="text-lg font-semibold mb-2">{{ tech.name }}</h3>
              <p class="text-sm text-gray-600">{{ tech.description }}</p>
            </div>
          </el-card>
        </div>
      </section>

      <!-- Element Plus 组件演示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Element Plus 组件演示</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- 表单组件 -->
          <el-card title="表单组件" shadow="hover">
            <template #header>
              <div class="flex justify-between items-center">
                <span class="font-medium">表单组件</span>
                <el-tag type="primary" size="small">Form</el-tag>
              </div>
            </template>
            
            <el-form :model="form" label-width="80px">
              <el-form-item label="用户名">
                <el-input v-model="form.username" placeholder="请输入用户名" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="form.email" type="email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="城市">
                <el-select v-model="form.city" placeholder="请选择城市">
                  <el-option label="北京" value="beijing" />
                  <el-option label="上海" value="shanghai" />
                  <el-option label="深圳" value="shenzhen" />
                </el-select>
              </el-form-item>
              <el-form-item label="爱好">
                <el-checkbox-group v-model="form.hobbies">
                  <el-checkbox label="阅读" />
                  <el-checkbox label="运动" />
                  <el-checkbox label="音乐" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSubmit">提交</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 数据展示 -->
          <el-card title="数据展示" shadow="hover">
            <template #header>
              <div class="flex justify-between items-center">
                <span class="font-medium">数据展示</span>
                <el-tag type="success" size="small">Table</el-tag>
              </div>
            </template>
            
            <el-table :data="tableData" style="width: 100%" size="small">
              <el-table-column prop="name" label="姓名" width="80" />
              <el-table-column prop="age" label="年龄" width="60" />
              <el-table-column prop="city" label="城市" />
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </section>

      <!-- GSAP 动画演示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">GSAP 动画演示</h2>
        <el-card shadow="hover">
          <div class="flex flex-wrap gap-4 mb-6">
            <el-button @click="playFadeIn">淡入动画</el-button>
            <el-button @click="playSlideIn">滑入动画</el-button>
            <el-button @click="playRotate">旋转动画</el-button>
            <el-button @click="playScale">缩放动画</el-button>
            <el-button @click="playBounce">弹跳动画</el-button>
            <el-button @click="resetAnimation">重置</el-button>
          </div>
          
          <div class="flex justify-center">
            <div
              ref="animationBox"
              class="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
            >
              GSAP
            </div>
          </div>
        </el-card>
      </section>

      <!-- Three.js 基础演示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Three.js 基础演示</h2>
        <el-card shadow="hover">
          <div class="flex justify-between items-center mb-4">
            <div class="flex gap-4">
              <el-button @click="startRotation">开始旋转</el-button>
              <el-button @click="stopRotation">停止旋转</el-button>
              <el-button @click="changeColor">改变颜色</el-button>
            </div>
            <div class="text-sm text-gray-600">
              Three.js WebGL 渲染演示
            </div>
          </div>
          
          <div class="bg-gray-900 rounded-lg overflow-hidden">
            <canvas ref="threeCanvas" class="w-full h-64"></canvas>
          </div>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { gsap } from 'gsap'
import { initThreeDemo, type ThreeDemo } from '@/utils/threeDemo'

const router = useRouter()
const appStore = useAppStore()

// 响应式数据
const { isDarkMode } = appStore
const animationBox = ref<HTMLElement>()
const threeCanvas = ref<HTMLCanvasElement>()

let threeDemo: ThreeDemo | null = null

// 技术栈数据
const techStack = ref([
  {
    name: 'Vue 3',
    icon: '🖖',
    description: '渐进式JavaScript框架'
  },
  {
    name: 'Pinia',
    icon: '🍍',
    description: 'Vue的状态管理库'
  },
  {
    name: 'Three.js',
    icon: '🎮',
    description: '3D JavaScript库'
  },
  {
    name: 'GSAP',
    icon: '⚡',
    description: '高性能动画库'
  },
  {
    name: 'Element Plus',
    icon: '🎨',
    description: 'Vue 3 UI组件库'
  },
  {
    name: 'TailwindCSS',
    icon: '🎭',
    description: '实用优先的CSS框架'
  },
  {
    name: 'TypeScript',
    icon: '📘',
    description: 'JavaScript的超集'
  },
  {
    name: 'Vite',
    icon: '⚡',
    description: '下一代前端构建工具'
  }
])

// 表单数据
const form = ref({
  username: '',
  email: '',
  city: '',
  hobbies: []
})

// 表格数据
const tableData = ref([
  { name: '张三', age: 25, city: '北京' },
  { name: '李四', age: 30, city: '上海' },
  { name: '王五', age: 28, city: '深圳' }
])

// 生命周期
onMounted(() => {
  if (threeCanvas.value) {
    threeDemo = initThreeDemo(threeCanvas.value)
  }
})

onUnmounted(() => {
  if (threeDemo) {
    threeDemo.dispose()
  }
})

// 方法
const goHome = () => {
  router.push('/')
}

const toggleTheme = () => {
  appStore.toggleTheme()
}

const handleSubmit = () => {
  ElMessage.success('表单提交成功！')
  console.log('表单数据:', form.value)
}

const handleReset = () => {
  form.value = {
    username: '',
    email: '',
    city: '',
    hobbies: []
  }
  ElMessage.info('表单已重置')
}

const handleEdit = (row: any) => {
  ElMessage.info(`编辑用户: ${row.name}`)
}

const handleDelete = (row: any) => {
  ElMessage.warning(`删除用户: ${row.name}`)
}

// GSAP 动画方法
const playFadeIn = () => {
  if (!animationBox.value) return
  gsap.fromTo(animationBox.value, 
    { opacity: 0 }, 
    { opacity: 1, duration: 1, ease: "power2.out" }
  )
}

const playSlideIn = () => {
  if (!animationBox.value) return
  gsap.fromTo(animationBox.value, 
    { x: -200 }, 
    { x: 0, duration: 1, ease: "back.out(1.7)" }
  )
}

const playRotate = () => {
  if (!animationBox.value) return
  gsap.to(animationBox.value, { 
    rotation: 360, 
    duration: 2, 
    ease: "power2.inOut" 
  })
}

const playScale = () => {
  if (!animationBox.value) return
  gsap.fromTo(animationBox.value, 
    { scale: 0 }, 
    { scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" }
  )
}

const playBounce = () => {
  if (!animationBox.value) return
  gsap.to(animationBox.value, { 
    y: -50, 
    duration: 0.5, 
    yoyo: true, 
    repeat: 3, 
    ease: "power2.out" 
  })
}

const resetAnimation = () => {
  if (!animationBox.value) return
  gsap.set(animationBox.value, { 
    x: 0, 
    y: 0, 
    rotation: 0, 
    scale: 1, 
    opacity: 1 
  })
}

// Three.js 控制方法
const startRotation = () => {
  if (threeDemo) {
    threeDemo.startRotation()
  }
}

const stopRotation = () => {
  if (threeDemo) {
    threeDemo.stopRotation()
  }
}

const changeColor = () => {
  if (threeDemo) {
    threeDemo.changeColor()
  }
}
</script>

<style scoped>
.tech-card {
  transition: all 0.3s ease;
}

.tech-card:hover {
  transform: translateY(-4px);
}
</style>
