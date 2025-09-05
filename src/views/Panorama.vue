<template>
  <div class="panorama-page min-h-screen bg-gray-900">
    <!-- 顶部控制栏 -->
    <div class="control-bar bg-black bg-opacity-50 text-white p-4 absolute top-0 left-0 right-0 z-10">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <el-button @click="goHome" size="small">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <span class="text-lg font-medium">{{ currentScene?.name || '全景浏览' }}</span>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- 场景选择 -->
          <el-select v-model="currentSceneId" @change="handleSceneChange" size="small" style="width: 120px;">
            <el-option
              v-for="scene in scenes"
              :key="scene.id"
              :label="scene.name"
              :value="scene.id"
            />
          </el-select>
          
          <!-- 控制按钮 -->
          <el-button-group size="small">
            <el-button @click="toggleAutoRotate" :type="autoRotate ? 'primary' : 'default'">
              <el-icon><Refresh /></el-icon>
              {{ autoRotate ? '停止旋转' : '自动旋转' }}
            </el-button>
            <el-button @click="resetView">
              <el-icon><Aim /></el-icon>
              重置视角
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- Three.js 渲染容器 -->
    <div 
      ref="containerRef" 
      class="panorama-container w-full h-screen"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel="onWheel"
    >
      <canvas ref="canvasRef" class="three-canvas"></canvas>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <el-icon class="is-loading" style="font-size: 32px;"><Loading /></el-icon>
        <span class="ml-4 text-white text-lg">正在加载全景图...</span>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="info-bar bg-black bg-opacity-50 text-white p-4 absolute bottom-0 left-0 right-0">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm opacity-75">{{ currentScene?.description || '全景浏览模式' }}</p>
        </div>
        <div class="flex items-center space-x-4 text-sm opacity-75">
          <span>拖拽：旋转视角</span>
          <span>滚轮：缩放</span>
          <span>双击：重置</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePanoramaStore } from '@/stores/panorama'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Refresh, Aim, Loading } from '@element-plus/icons-vue'
import { initPanoramaViewer, type PanoramaViewer } from '@/utils/panorama'

const router = useRouter()
const panoramaStore = usePanoramaStore()

// 模板引用
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

// 全景查看器实例
let panoramaViewer: PanoramaViewer | null = null

// 响应式数据（保持 Ref 类型，避免 watch 重载选择错误）
const { scenes, currentSceneId, isLoading, autoRotate } = storeToRefs(panoramaStore)
const currentScene = computed(() => scenes.value.find((s) => s.id === currentSceneId.value))

// 鼠标交互状态
const isMouseDown = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

// 生命周期
onMounted(async () => {
  if (containerRef.value && canvasRef.value) {
    try {
      panoramaStore.setLoading(true)
      panoramaViewer = await initPanoramaViewer(canvasRef.value, containerRef.value)
      panoramaStore.setLoading(false)
    } catch (error) {
      console.error('初始化全景查看器失败:', error)
      panoramaStore.setLoading(false)
    }
  }
})

onUnmounted(() => {
  if (panoramaViewer) {
    panoramaViewer.dispose()
  }
})

// 监听场景变化
watch(currentSceneId, (newSceneId) => {
  const scene = scenes.value.find((s) => s.id === newSceneId)
  if (scene && panoramaViewer) {
    panoramaViewer.loadScene(scene.imageUrl)
  }
})

// 监听自动旋转状态
watch(autoRotate, (enabled) => {
  if (panoramaViewer) {
    panoramaViewer.setAutoRotate(enabled)
  }
})

// 方法
const goHome = () => {
  router.push('/')
}

const handleSceneChange = (sceneId: string) => {
  panoramaStore.setCurrentScene(sceneId)
}

const toggleAutoRotate = () => {
  panoramaStore.toggleAutoRotate()
}

const resetView = () => {
  if (panoramaViewer) {
    panoramaViewer.resetView()
  }
}

// 鼠标事件处理
const onMouseDown = (event: MouseEvent) => {
  isMouseDown.value = true
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseMove = (event: MouseEvent) => {
  if (!isMouseDown.value || !panoramaViewer) return
  
  const deltaX = event.clientX - mouseX.value
  const deltaY = event.clientY - mouseY.value
  
  panoramaViewer.rotate(deltaX * 0.01, deltaY * 0.01)
  
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseUp = () => {
  isMouseDown.value = false
}

const onWheel = (event: WheelEvent) => {
  if (!panoramaViewer) return
  
  event.preventDefault()
  const delta = event.deltaY * 0.001
  panoramaViewer.zoom(delta)
}
</script>

<style scoped>
.panorama-container {
  cursor: grab;
}

.panorama-container:active {
  cursor: grabbing;
}

.control-bar,
.info-bar {
  backdrop-filter: blur(10px);
}

.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
