<template>
  <div class="panorama-video-viewer">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-group">
        <el-button-group size="small">
          <el-button @click="togglePlay" :type="isPlaying ? 'danger' : 'primary'">
            <el-icon>
              <VideoPause v-if="isPlaying" />
              <VideoPlay v-else />
            </el-icon>
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button @click="resetView">
            <el-icon><Refresh /></el-icon>
            重置视角
          </el-button>
          <el-button @click="toggleAutoRotate" :type="autoRotate ? 'primary' : 'default'">
            <el-icon><Refresh /></el-icon>
            {{ autoRotate ? '停止旋转' : '自动旋转' }}
          </el-button>
        </el-button-group>
      </div>
      
      <div class="control-group">
        <span class="control-label">视频进度:</span>
        <el-slider 
          v-model="videoProgress" 
          :max="videoDuration"
          :format-tooltip="formatTime"
          @change="seekVideo"
          @input="handleSliderInput"
          style="width: 200px; margin: 0 10px;"
        />
        <span class="time-display">{{ formatTime(videoProgress) }} / {{ formatTime(videoDuration) }}</span>
      </div>
    </div>

    <!-- Three.js 渲染容器 -->
    <div 
      ref="containerRef" 
      class="viewer-container"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @wheel="onWheel"
    >
      <canvas ref="canvasRef" class="viewer-canvas"></canvas>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="is-loading" style="font-size: 32px;"><Loading /></el-icon>
        <span class="loading-text">正在加载全景视频...</span>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="error-overlay">
        <el-icon size="48" color="#f56c6c"><Warning /></el-icon>
        <p class="error-text">{{ error }}</p>
        <el-button @click="retry">重试</el-button>
      </div>
    </div>

    <!-- 信息面板 -->
    <div class="info-panel">
      <div class="info-item">
        <span class="info-label">分辨率:</span>
        <span class="info-value">{{ videoInfo.width }}x{{ videoInfo.height }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">帧率:</span>
        <span class="info-value">{{ videoInfo.fps }} FPS</span>
      </div>
      <div class="info-item">
        <span class="info-label">时长:</span>
        <span class="info-value">{{ formatTime(videoDuration) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">操作:</span>
        <span class="info-value">拖拽旋转 | 滚轮缩放</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  VideoPlay, 
  VideoPause, 
  Refresh, 
  Warning,
  Loading
} from '@element-plus/icons-vue'
import { initPanoramaVideoViewer, type PanoramaVideoViewer } from '@/utils/panoramaVideo'

// 模板引用
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()

// 响应式数据
const loading = ref(true)
const error = ref('')
const isPlaying = ref(false)
const autoRotate = ref(false)
const videoProgress = ref(0)
const videoDuration = ref(0)

const videoInfo = ref({
  width: 0,
  height: 0,
  fps: 30
})

// 鼠标交互状态
const isMouseDown = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

// 全景视频查看器实例
let panoramaVideoViewer: PanoramaVideoViewer | null = null

// 生命周期
onMounted(async () => {
  if (containerRef.value && canvasRef.value) {
    try {
      loading.value = true
      error.value = ''
      
      panoramaVideoViewer = await initPanoramaVideoViewer(
        canvasRef.value, 
        containerRef.value,
        '/Out/stitched_output.mp4'
      )
      
      // 监听视频事件
      panoramaVideoViewer.onLoadedMetadata = (duration: number, width: number, height: number) => {
        videoDuration.value = duration
        videoInfo.value.width = width
        videoInfo.value.height = height
        loading.value = false
        ElMessage.success('全景视频加载完成')
      }
      
      panoramaVideoViewer.onTimeUpdate = (currentTime: number) => {
        videoProgress.value = currentTime
      }
      
      panoramaVideoViewer.onError = (errorMsg: string) => {
        error.value = errorMsg
        loading.value = false
        ElMessage.error(`视频加载失败: ${errorMsg}`)
      }
      
    } catch (err) {
      console.error('初始化全景视频查看器失败:', err)
      error.value = '初始化失败'
      loading.value = false
    }
  }
})

onUnmounted(() => {
  if (panoramaVideoViewer) {
    panoramaVideoViewer.dispose()
  }
})

// 方法
const togglePlay = () => {
  if (!panoramaVideoViewer) return
  
  if (isPlaying.value) {
    panoramaVideoViewer.pause()
  } else {
    panoramaVideoViewer.play()
  }
  isPlaying.value = !isPlaying.value
}

const resetView = () => {
  if (panoramaVideoViewer) {
    panoramaVideoViewer.resetView()
  }
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
  if (panoramaVideoViewer) {
    panoramaVideoViewer.setAutoRotate(autoRotate.value)
  }
}

// 拖动处理变量
let isDragging = false
let lastUpdateTime = 0
let pendingUpdate: number | null = null
const UPDATE_THROTTLE = 50 // 50ms 节流，提高响应性

const handleSliderInput = (value: number) => {
  // 拖动过程中实时更新视频画面
  isDragging = true
  
  // 使用requestAnimationFrame + 节流机制，确保流畅更新
  const now = Date.now()
  if (now - lastUpdateTime > UPDATE_THROTTLE) {
    lastUpdateTime = now
    
    // 取消之前的待处理更新
    if (pendingUpdate) {
      cancelAnimationFrame(pendingUpdate)
    }
    
    // 使用 requestAnimationFrame 确保在下一帧更新
    pendingUpdate = requestAnimationFrame(() => {
      if (panoramaVideoViewer) {
        panoramaVideoViewer.seekToImmediate(value)
      }
      pendingUpdate = null
    })
  }
}

const seekVideo = (value: number) => {
  // 拖拽结束时确保最终位置准确
  isDragging = false
  if (panoramaVideoViewer) {
    panoramaVideoViewer.seekTo(value)
  }
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const retry = async () => {
  if (containerRef.value && canvasRef.value) {
    try {
      loading.value = true
      error.value = ''
      
      panoramaVideoViewer = await initPanoramaVideoViewer(
        canvasRef.value, 
        containerRef.value,
        '/Out/stitched_output.mp4'
      )
      
      // 监听视频事件
      panoramaVideoViewer.onLoadedMetadata = (duration: number, width: number, height: number) => {
        videoDuration.value = duration
        videoInfo.value.width = width
        videoInfo.value.height = height
        loading.value = false
        ElMessage.success('全景视频加载完成')
      }
      
      panoramaVideoViewer.onTimeUpdate = (currentTime: number) => {
        videoProgress.value = currentTime
      }
      
      panoramaVideoViewer.onError = (errorMsg: string) => {
        error.value = errorMsg
        loading.value = false
        ElMessage.error(`视频加载失败: ${errorMsg}`)
      }
      
    } catch (err) {
      console.error('初始化全景视频查看器失败:', err)
      error.value = '初始化失败'
      loading.value = false
    }
  }
}

// 鼠标事件处理
const onMouseDown = (event: MouseEvent) => {
  isMouseDown.value = true
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseMove = (event: MouseEvent) => {
  if (!isMouseDown.value || !panoramaVideoViewer) return
  
  const deltaX = event.clientX - mouseX.value
  const deltaY = event.clientY - mouseY.value
  
  panoramaVideoViewer.rotate(deltaX * 0.01, deltaY * 0.01)
  
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseUp = () => {
  isMouseDown.value = false
}

const onWheel = (event: WheelEvent) => {
  if (!panoramaVideoViewer) return
  
  event.preventDefault()
  const delta = event.deltaY * 0.001
  panoramaVideoViewer.zoom(delta)
}
</script>

<style scoped>
.panorama-video-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.control-panel {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.time-display {
  font-size: 12px;
  color: #999;
  min-width: 80px;
}

.viewer-container {
  flex: 1;
  position: relative;
  background: #000;
  cursor: grab;
}

.viewer-container:active {
  cursor: grabbing;
}

.viewer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.loading-text,
.error-text {
  margin-top: 16px;
  font-size: 16px;
}

.info-panel {
  background: #f5f5f5;
  padding: 12px 16px;
  display: flex;
  gap: 24px;
  font-size: 12px;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group {
    justify-content: center;
  }
  
  .info-panel {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
