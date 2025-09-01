<template>
  <div class="panorama-video-viewer">
    <!-- Three.js 渲染容器 -->
    <div ref="containerRef" class="three-container" @contextmenu.prevent>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">正在加载全景视频...</p>
      </div>

      <!-- 播放按钮（未开始播放时显示） -->
      <div v-if="!hasStarted && !loading" class="initial-play-overlay">
        <div class="play-button-large" @click="startPlaying">
          <el-icon class="play-icon"><VideoPlay /></el-icon>
        </div>
        <p class="play-hint">点击开始播放全景视频</p>
      </div>
      
      <!-- 控制面板 -->
      <div 
        class="controls-overlay" 
        :class="{ 'show': showControls && hasStarted }"
        @mouseenter="onControlsMouseEnter"
        @mouseleave="onControlsMouseLeave"
      >
        <!-- 顶部控制区域 -->
        <div class="top-controls">
          <div class="control-group left">
            <div class="time-display">
              <span class="current-time">{{ formatTime(currentTime) }}</span>
              <span class="separator">/</span>
              <span class="total-time">{{ formatTime(duration) }}</span>
            </div>
          </div>
          
          <div class="control-group center">
            <el-button 
              :icon="DArrowLeft" 
              @click="seekBackward" 
              class="control-btn seek-btn"
              title="后退10秒"
              circle
            />
            <el-button 
              :icon="isPlaying ? VideoPause : VideoPlay" 
              @click="togglePlay"
              class="control-btn play-btn-main"
              size="large"
              circle
            />
            <el-button 
              :icon="DArrowRight" 
              @click="seekForward" 
              class="control-btn seek-btn"
              title="前进10秒"
              circle
            />
          </div>

          <div class="control-group right">
            <el-button 
              :icon="Camera" 
              @click="takeScreenshot"
              class="control-btn"
              title="截图"
              circle
            />
            <div class="speed-control">
              <el-dropdown @command="changePlaybackRate" trigger="click">
                <el-button class="control-btn speed-btn" circle>
                  <span class="speed-text">{{ playbackRate }}x</span>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="0.5">0.5x</el-dropdown-item>
                    <el-dropdown-item :command="0.75">0.75x</el-dropdown-item>
                    <el-dropdown-item :command="1">1x</el-dropdown-item>
                    <el-dropdown-item :command="1.25">1.25x</el-dropdown-item>
                    <el-dropdown-item :command="1.5">1.5x</el-dropdown-item>
                    <el-dropdown-item :command="2">2x</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 进度条区域 -->
        <div class="progress-area">
          <div class="progress-container" ref="progressRef" @click="seekTo">
            <!-- 进度条背景 -->
            <div class="progress-track">
              <!-- 缓冲进度 -->
              <div class="buffer-progress" :style="{ width: bufferProgress + '%' }"></div>
              <!-- 播放进度 -->
              <div class="play-progress" :style="{ width: playProgress + '%' }">
                <div class="progress-glow"></div>
              </div>
            </div>
            
            <!-- 截图标记点 -->
            <div 
              v-for="(marker, index) in timeMarkers" 
              :key="index"
              class="time-marker"
              :style="{ left: (marker.time / duration) * 100 + '%' }"
              @click.stop="seekToMarker(marker.time)"
            >
              <div class="marker-dot"></div>
              <div class="marker-tooltip">
                <img :src="marker.thumbnail" alt="截图" />
                <span>{{ formatTime(marker.time) }}</span>
              </div>
            </div>
            
            <!-- 进度条拖拽点 -->
            <div 
              class="progress-handle" 
              :style="{ left: playProgress + '%' }"
              @mousedown="startDrag"
            >
              <div class="handle-dot"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="volume-control" v-show="showControls && hasStarted">
        <div class="volume-slider-container">
          <el-slider
            v-model="volume"
            :min="0"
            :max="1"
            :step="0.05"
            @change="changeVolume"
            vertical
            height="80px"
          />
        </div>
        <el-button 
          :icon="videoRef?.muted ? Mute : Microphone" 
          @click="toggleMute"
          class="volume-btn"
          circle
          size="small"
        />
      </div>

      <!-- 视角重置按钮 -->
      <div class="view-reset-btn" v-show="hasStarted">
        <el-button 
          @click="resetView" 
          class="reset-btn"
          circle
          size="small"
          title="重置视角"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 隐藏的视频元素用于播放 -->
    <video 
      ref="videoRef"
      :src="videoSrc"
      muted
      crossorigin="anonymous"
      @loadedmetadata="onVideoLoaded"
      @timeupdate="onTimeUpdate"
      @progress="onProgress"
      @ended="onVideoEnded"
      style="display: none;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  VideoPlay, 
  VideoPause, 
  Camera, 
  DArrowLeft, 
  DArrowRight,
  Microphone,
  Mute,
  Refresh
} from '@element-plus/icons-vue'
import * as THREE from 'three'
import { ElMessage } from 'element-plus'

// 引用
const containerRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()
const progressRef = ref<HTMLDivElement>()

// 状态管理
const loading = ref(true)
const videoSrc = ref('/Out/stitched_output.mp4')
const isPlaying = ref(false)
const hasStarted = ref(false)
const showControls = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playProgress = ref(0)
const bufferProgress = ref(0)
const playbackRate = ref(1)
const volume = ref(1)
const isDragging = ref(false)

// Three.js 相关
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let sphere: THREE.Mesh
let videoTexture: THREE.VideoTexture

// 截图标记
const timeMarkers = ref<Array<{ time: number, thumbnail: string }>>([])

// 控制面板交互状态
const isControlsHovered = ref(false)

// 控制面板自动隐藏定时器
let controlsHideTimer: NodeJS.Timeout

// 启动控制面板自动隐藏定时器
const startControlsHideTimer = () => {
  clearTimeout(controlsHideTimer)
  
  // 只有在播放状态且已开始播放时才启动定时器
  if (isPlaying.value && hasStarted.value) {
    controlsHideTimer = setTimeout(() => {
      // 检查所有条件，确保可以隐藏
      if (isPlaying.value && !isDragging.value && !isControlsHovered.value) {
        showControls.value = false
        console.log('控制面板已隐藏')
      } else {
        console.log('控制面板隐藏被阻止:', {
          isPlaying: isPlaying.value,
          isDragging: isDragging.value,
          isControlsHovered: isControlsHovered.value
        })
      }
    }, 3000)
    console.log('启动控制面板隐藏定时器')
  } else {
    console.log('不启动定时器:', {
      isPlaying: isPlaying.value,
      hasStarted: hasStarted.value
    })
  }
}

// 显示控制面板并启动自动隐藏
const showControlsWithAutoHide = () => {
  if (!hasStarted.value) return
  
  showControls.value = true
  startControlsHideTimer()
}

// 鼠标/触摸控制
let isMouseDown = false
let mouseX = 0
let mouseY = 0
let lon = 0
let lat = 0
let phi = 0
let theta = 0

// 初始化 Three.js 场景
const initThreeJS = () => {
  if (!containerRef.value || !videoRef.value) return

  const container = containerRef.value
  const video = videoRef.value

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // 创建视频纹理
  videoTexture = new THREE.VideoTexture(video)
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  // 创建球体几何体
  const geometry = new THREE.SphereGeometry(500, 60, 40)
  geometry.scale(-1, 1, 1) // 翻转几何体，使纹理在内部显示

  // 创建材质
  const material = new THREE.MeshBasicMaterial({ map: videoTexture })

  // 创建球体网格
  sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)

  // 添加事件监听器
  addEventListeners()

  // 开始渲染循环
  animate()
}

// 添加事件监听器
const addEventListeners = () => {
  const canvas = renderer.domElement

  // 鼠标事件
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('wheel', onWheel)

  // 触摸事件
  canvas.addEventListener('touchstart', onTouchStart)
  canvas.addEventListener('touchmove', onTouchMove)
  canvas.addEventListener('touchend', onTouchEnd)

  // 窗口大小变化
  window.addEventListener('resize', onWindowResize)

  canvas.addEventListener('mousemove', showControlsWithAutoHide)
  canvas.addEventListener('click', showControlsWithAutoHide)
}

// 鼠标按下
const onMouseDown = (event: MouseEvent) => {
  isMouseDown = true
  mouseX = event.clientX
  mouseY = event.clientY
}

// 鼠标移动
const onMouseMove = (event: MouseEvent) => {
  if (!isMouseDown) return

  const deltaX = event.clientX - mouseX
  const deltaY = event.clientY - mouseY

  mouseX = event.clientX
  mouseY = event.clientY

  lon -= deltaX * 0.1
  lat += deltaY * 0.1

  lat = Math.max(-85, Math.min(85, lat))
  updateCamera()
}

// 鼠标释放
const onMouseUp = () => {
  isMouseDown = false
}

// 滚轮缩放
const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  const fov = camera.fov + event.deltaY * 0.05
  camera.fov = Math.max(10, Math.min(100, fov))
  camera.updateProjectionMatrix()
}

// 触摸开始
const onTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    mouseX = touch.clientX
    mouseY = touch.clientY
    isMouseDown = true
  }
}

// 触摸移动
const onTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 1 && isMouseDown) {
    const touch = event.touches[0]
    const deltaX = touch.clientX - mouseX
    const deltaY = touch.clientY - mouseY

    mouseX = touch.clientX
    mouseY = touch.clientY

    lon -= deltaX * 0.1
    lat += deltaY * 0.1

    lat = Math.max(-85, Math.min(85, lat))
    updateCamera()
  }
}

// 触摸结束
const onTouchEnd = () => {
  isMouseDown = false
}

// 更新相机位置
const updateCamera = () => {
  phi = THREE.MathUtils.degToRad(90 - lat)
  theta = THREE.MathUtils.degToRad(lon)

  const x = 500 * Math.sin(phi) * Math.cos(theta)
  const y = 500 * Math.cos(phi)
  const z = 500 * Math.sin(phi) * Math.sin(theta)

  camera.lookAt(new THREE.Vector3(x, y, z))
}

// 窗口大小变化
const onWindowResize = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

// 视频加载完成
const onVideoLoaded = () => {
  if (!videoRef.value) return
  
  duration.value = videoRef.value.duration
  loading.value = false
  
  // 初始化 Three.js 场景
  nextTick(() => {
    initThreeJS()
  })
}

// 开始播放
const startPlaying = () => {
  if (!videoRef.value) return
  
  hasStarted.value = true
  videoRef.value.play()
  isPlaying.value = true
  showControls.value = true
  
  // 启动自动隐藏定时器
  startControlsHideTimer()
}

// 重置视角
const resetView = () => {
  if (!camera) return
  
  // 重置相机位置和旋转
  lon = 0
  lat = 0
  updateCamera()
  
  // 重置缩放
  camera.fov = 75
  camera.updateProjectionMatrix()
  
  ElMessage.success('视角已重置')
}

// 播放/暂停切换
const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
    // 暂停时显示控制面板并停止自动隐藏
    showControls.value = true
    clearTimeout(controlsHideTimer)
  } else {
    videoRef.value.play()
    isPlaying.value = true
    // 开始播放时启动自动隐藏
    startControlsHideTimer()
  }
}

// 时间更新
const onTimeUpdate = () => {
  if (!videoRef.value || isDragging.value) return
  
  currentTime.value = videoRef.value.currentTime
  playProgress.value = (currentTime.value / duration.value) * 100
}

// 缓冲进度更新
const onProgress = () => {
  if (!videoRef.value) return
  
  const buffered = videoRef.value.buffered
  if (buffered.length > 0) {
    const bufferedEnd = buffered.end(buffered.length - 1)
    bufferProgress.value = (bufferedEnd / duration.value) * 100
  }
}

// 视频结束
const onVideoEnded = () => {
  isPlaying.value = false
  // 视频结束时显示控制面板
  showControls.value = true
}

// 跳转到指定时间
const seekTo = (event: MouseEvent) => {
  if (!progressRef.value || !videoRef.value) return

  const rect = progressRef.value.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const seekTime = percent * duration.value

  videoRef.value.currentTime = seekTime
  currentTime.value = seekTime
}

// 快进
const seekForward = () => {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.min(videoRef.value.currentTime + 10, duration.value)
}

// 快退
const seekBackward = () => {
  if (!videoRef.value) return
  videoRef.value.currentTime = Math.max(videoRef.value.currentTime - 10, 0)
}

// 改变播放速度
const changePlaybackRate = (rate: number) => {
  if (!videoRef.value) return
  videoRef.value.playbackRate = rate
}

// 改变音量
const changeVolume = (vol: number) => {
  if (!videoRef.value) return
  videoRef.value.volume = vol
}

// 静音切换
const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
}

// 截图功能
const takeScreenshot = () => {
  if (!renderer || !videoRef.value) return

  // 渲染当前帧到canvas
  renderer.render(scene, camera)
  
  // 获取canvas数据
  const canvas = renderer.domElement
  const dataURL = canvas.toDataURL('image/png')
  
  // 创建下载链接
  const link = document.createElement('a')
  link.download = `panorama_screenshot_${Date.now()}.png`
  link.href = dataURL
  link.click()
  
  // 添加时间标记
  const thumbnail = dataURL
  timeMarkers.value.push({
    time: currentTime.value,
    thumbnail
  })
  
  ElMessage.success('截图已保存')
}

// 跳转到标记点
const seekToMarker = (time: number) => {
  if (!videoRef.value) return
  videoRef.value.currentTime = time
}

// 进度条拖拽
const startDrag = () => {
  isDragging.value = true
  showControls.value = true
  
  const onDrag = (e: MouseEvent) => {
    if (!progressRef.value || !videoRef.value) return
    
    const rect = progressRef.value.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const seekTime = percent * duration.value
    
    videoRef.value.currentTime = seekTime
    currentTime.value = seekTime
    playProgress.value = percent * 100
  }
  
  const onDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', onDragEnd)
    
    // 拖拽结束后启动自动隐藏
    startControlsHideTimer()
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
}

// 控制面板鼠标事件
const onControlsMouseEnter = () => {
  isControlsHovered.value = true
  clearTimeout(controlsHideTimer)
}

const onControlsMouseLeave = () => {
  isControlsHovered.value = false
  // 鼠标离开控制面板后启动自动隐藏
  startControlsHideTimer()
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 组件挂载
onMounted(() => {
  // 不再自动播放，等待用户点击
})

// 组件卸载
onUnmounted(() => {
  if (renderer) {
    renderer.dispose()
  }
  window.removeEventListener('resize', onWindowResize)
  clearTimeout(controlsHideTimer)
})
</script>

<style scoped>
.panorama-video-viewer {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
  border-radius: 0;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
}

.three-container:active {
  cursor: grabbing;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: white;
  z-index: 1000;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border-top-color: #67c23a;
  animation-duration: 1.8s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border-top-color: #e6a23c;
  animation-duration: 2.4s;
}

.loading-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  letter-spacing: 0.5px;
}

/* 初始播放按钮 */
.initial-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(26, 26, 26, 0.7) 100%);
  backdrop-filter: blur(2px);
  z-index: 999;
}

.play-button-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.play-button-large::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-button-large:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 48px rgba(64, 158, 255, 0.4);
}

.play-button-large:hover::before {
  opacity: 1;
}

.play-button-large:active {
  transform: scale(0.95);
}

.play-icon {
  font-size: 32px;
  color: white;
  margin-left: 4px;
}

.play-hint {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  text-align: center;
  letter-spacing: 0.5px;
}

/* 控制面板 */
.controls-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  backdrop-filter: blur(10px);
  padding: 24px;
  transform: translateY(100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.controls-overlay.show {
  transform: translateY(0);
}

.top-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-group.left {
  flex: 1;
  justify-content: flex-start;
}

.control-group.center {
  flex: 0 0 auto;
  justify-content: center;
  gap: 16px;
}

.control-group.right {
  flex: 1;
  justify-content: flex-end;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  font-weight: 500;
}

.current-time {
  color: #409eff;
}

.separator {
  color: rgba(255, 255, 255, 0.6);
}

.total-time {
  color: rgba(255, 255, 255, 0.8);
}

.control-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.play-btn-main {
  width: 56px !important;
  height: 56px !important;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.play-btn-main:hover {
  background: linear-gradient(135deg, #529fff 0%, #7ed23a 100%) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.4);
}

.seek-btn {
  width: 40px !important;
  height: 40px !important;
}

.speed-btn {
  width: 40px !important;
  height: 40px !important;
  font-size: 12px !important;
}

.speed-text {
  font-size: 12px;
  font-weight: 600;
}

/* 进度条区域 */
.progress-area {
  position: relative;
}

.progress-container {
  width: 100%;
  height: 24px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.buffer-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.play-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  border-radius: 3px;
  transition: width 0.2s ease;
  overflow: hidden;
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 100%);
  animation: progress-glow 2s ease-in-out infinite;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 10;
}

.handle-dot {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.progress-container:hover .progress-handle {
  opacity: 1;
}

.progress-handle:hover .handle-dot {
  transform: scale(1.2);
}

/* 时间标记点 */
.time-marker {
  position: absolute;
  top: -12px;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  cursor: pointer;
  z-index: 15;
}

.marker-dot {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.marker-dot:hover {
  transform: scale(1.3);
  box-shadow: 0 4px 16px rgba(230, 162, 60, 0.5);
}

.marker-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  pointer-events: none;
  white-space: nowrap;
}

.marker-tooltip img {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  margin-bottom: 4px;
}

.marker-tooltip span {
  display: block;
  color: white;
  font-size: 12px;
  text-align: center;
}

.time-marker:hover .marker-tooltip {
  opacity: 1;
  visibility: visible;
}

/* 音量控制 */
.volume-control {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 101;
}

.volume-slider-container {
  position: relative;
}

.volume-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.volume-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-2px);
}

/* 视角重置按钮 */
.view-reset-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 101;
}

.reset-btn {
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.reset-btn:hover {
  background: rgba(0, 0, 0, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-2px);
}

/* 动画效果 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes progress-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .controls-overlay {
    padding: 16px;
  }
  
  .top-controls {
    margin-bottom: 16px;
  }
  
  .control-group.left,
  .control-group.right {
    display: none;
  }
  
  .control-group.center {
    flex: 1;
    justify-content: center;
  }
  
  .play-btn-main {
    width: 48px !important;
    height: 48px !important;
  }
  
  .seek-btn {
    width: 36px !important;
    height: 36px !important;
  }
  
  .volume-control {
    right: 16px;
    padding: 12px 8px;
  }
  
  .view-reset-btn {
    top: 16px;
    right: 16px;
  }
  
  .play-button-large {
    width: 60px;
    height: 60px;
  }
  
  .play-icon {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .controls-overlay {
    padding: 12px;
  }
  
  .top-controls {
    margin-bottom: 12px;
  }
  
  .play-btn-main {
    width: 44px !important;
    height: 44px !important;
  }
  
  .seek-btn {
    width: 32px !important;
    height: 32px !important;
  }
  
  .control-group.center {
    gap: 12px;
  }
  
  .play-button-large {
    width: 50px;
    height: 50px;
  }
  
  .play-icon {
    font-size: 20px;
  }
  
  .play-hint {
    font-size: 14px;
  }
}

/* 自定义滚动条 */
.progress-container::-webkit-scrollbar {
  display: none;
}

/* 禁用选择 */
.controls-overlay {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

/* Three.js canvas样式 */
.three-container canvas {
  display: block;
  border-radius: 0;
}

/* Element Plus 样式覆盖 */
:deep(.el-dropdown-menu) {
  background: rgba(0, 0, 0, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-dropdown-menu__item) {
  color: white !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-slider__bar) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
}

:deep(.el-slider__button) {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: 2px solid white !important;
}
</style>