<template>
  <div class="simple-panorama-viewer">
    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- 第一行：播放控制 -->
      <div class="control-row">
        <div class="control-group">
          <!-- 播放/暂停 -->
          <el-button @click="togglePlay" :type="isPlaying ? 'danger' : 'primary'" size="small">
            <el-icon>
              <VideoPause v-if="isPlaying" />
              <VideoPlay v-else />
            </el-icon>
          </el-button>
          
          <!-- 快退 -->
          <el-button @click="skipBackward" size="small" :disabled="!video">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          
          <!-- 快进 -->
          <el-button @click="skipForward" size="small" :disabled="!video">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
          
          <!-- 时间显示和进度条 -->
          <div class="time-controls">
            <span class="time-display">{{ formatTime(currentTime) }}</span>
            <div class="progress-container">
              <el-slider
                v-model="currentTime"
                :max="videoDuration"
                :step="0.1"
                :show-tooltip="false"
                @change="handleSliderChange"
                @input="handleSliderInput"
                class="progress-slider"
              />
              <!-- 进度条标记点 -->
              <div class="progress-markers">
                <div 
                  v-for="marker in progressMarkers" 
                  :key="marker.id"
                  :style="{ left: (marker.time / videoDuration) * 100 + '%' }"
                  class="progress-marker"
                  :class="marker.type"
                  @click="seekTo(marker.time)"
                  @mouseenter="showMarkerTooltip(marker)"
                  @mouseleave="hideMarkerTooltip"
                >
                  <div class="marker-dot"></div>
                </div>
              </div>
              <!-- 悬停预览 -->
              <div 
                v-if="showPreview" 
                :style="{ left: previewPosition + 'px' }"
                class="progress-preview"
              >
                <div class="preview-thumbnail">
                  <canvas ref="previewCanvas" width="160" height="90"></canvas>
                </div>
                <div class="preview-time">{{ formatTime(previewTime) }}</div>
              </div>
            </div>
            <span class="time-display">{{ formatTime(videoDuration) }}</span>
          </div>
        </div>
        
        <div class="status-info">
          <el-tag :type="statusType">{{ status }}</el-tag>
          <span class="ml-2 text-sm text-gray-600">{{ statusMessage }}</span>
        </div>
      </div>

      <!-- 第二行：高级控制 -->
      <div class="control-row">
        <div class="control-group">
          <!-- 倍速控制 -->
          <div class="speed-control">
            <span class="control-label">倍速:</span>
            <el-select v-model="playbackRate" @change="changePlaybackRate" size="small" style="width: 80px;">
              <el-option label="0.5x" :value="0.5" />
              <el-option label="0.75x" :value="0.75" />
              <el-option label="1x" :value="1" />
              <el-option label="1.25x" :value="1.25" />
              <el-option label="1.5x" :value="1.5" />
              <el-option label="2x" :value="2" />
            </el-select>
          </div>

          <!-- 音量控制 -->
          <div class="volume-control">
            <el-button @click="toggleMute" size="small">
              <el-icon>
                <Mute v-if="isMuted" />
                <VideoPlay v-else />
              </el-icon>
            </el-button>
            <el-slider
              v-model="volume"
              :max="100"
              :show-tooltip="false"
              @change="changeVolume"
              style="width: 80px; margin: 0 8px;"
            />
          </div>

          <!-- 截图功能 -->
          <el-button @click="captureScreenshot" size="small" :disabled="!video">
            <el-icon><Camera /></el-icon>
            截图
          </el-button>

          <!-- 全屏 -->
          <el-button @click="toggleFullscreen" size="small">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>

          <!-- 自动旋转 -->
          <el-button @click="toggleAutoRotate" :type="autoRotate ? 'primary' : 'default'" size="small">
            <el-icon><Refresh /></el-icon>
            {{ autoRotate ? '停止旋转' : '自动旋转' }}
          </el-button>

          <!-- 缩放控制 -->
          <div class="zoom-controls">
            <el-button @click="zoomIn" size="small" :disabled="currentFOV <= minFOV">
              <el-icon><ZoomIn /></el-icon>
              放大
            </el-button>
            <el-button @click="zoomOut" size="small" :disabled="currentFOV >= maxFOV">
              <el-icon><ZoomOut /></el-icon>
              缩小
            </el-button>
            <el-button @click="resetZoom" size="small">
              <el-icon><Aim /></el-icon>
              原始尺寸
            </el-button>
          </div>

          <!-- 重置视角 -->
          <el-button @click="resetView" size="small">
            <el-icon><Refresh /></el-icon>
            重置视角
          </el-button>

          <!-- 标记管理 -->
          <div class="marker-controls">
            <el-button @click="addMarker" size="small" :disabled="!video">
              <el-icon><Plus /></el-icon>
              添加标记
            </el-button>
            <el-button @click="showMarkerManager = true" size="small">
              <el-icon><List /></el-icon>
              管理标记
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 标记管理对话框 -->
    <el-dialog 
      v-model="showMarkerManager" 
      title="进度标记管理" 
      width="600px"
    >
      <div class="marker-manager">
        <!-- 工具栏 -->
        <div class="marker-toolbar">
          <el-button @click="exportMarkers" size="small">
            <el-icon><Download /></el-icon>
            导出标记
          </el-button>
          <el-upload
            :show-file-list="false"
            :before-upload="() => false"
            @change="handleImportMarkers"
            accept=".json"
          >
            <el-button size="small">
              <el-icon><Upload /></el-icon>
              导入标记
            </el-button>
          </el-upload>
          <el-button @click="clearAllMarkers" size="small" type="danger">
            清空所有标记
          </el-button>
        </div>
        
        <div class="marker-list">
          <div 
            v-for="marker in progressMarkers" 
            :key="marker.id"
            class="marker-item"
          >
            <div class="marker-info">
              <div class="marker-type-icon" :class="marker.type">
                <div class="marker-dot"></div>
              </div>
              <div class="marker-details">
                <div class="marker-title">{{ marker.title }}</div>
                <div class="marker-time">{{ formatTime(marker.time) }}</div>
                <div class="marker-desc" v-if="marker.description">{{ marker.description }}</div>
              </div>
            </div>
            <div class="marker-actions">
              <el-button size="small" @click="seekTo(marker.time)">
                跳转
              </el-button>
              <el-button size="small" @click="editMarker(marker)">
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteMarker(marker.id)">
                删除
              </el-button>
            </div>
          </div>
          <div v-if="progressMarkers.length === 0" class="empty-markers">
            <el-empty description="暂无标记点" />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 添加/编辑标记对话框 -->
    <el-dialog 
      v-model="showMarkerDialog" 
      :title="editingMarker ? '编辑标记' : '添加标记'" 
      width="400px"
    >
      <el-form :model="markerForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="markerForm.title" placeholder="请输入标记标题" />
        </el-form-item>
        <el-form-item label="时间">
          <el-input-number 
            v-model="markerForm.time" 
            :min="0" 
            :max="videoDuration"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="markerForm.type" style="width: 100%">
            <el-option label="重要" value="important" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
            <el-option label="错误" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="markerForm.description" 
            type="textarea" 
            placeholder="请输入标记描述（可选）"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMarkerDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMarker">保存</el-button>
      </template>
    </el-dialog>

    <!-- 渲染容器 -->
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
      <div v-if="loading" class="overlay">
        <div class="loading-content">
          <el-loading-spinner size="large" />
          <p class="mt-4 text-white">{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-if="error" class="overlay">
        <div class="error-content">
          <el-icon size="48" color="#f56c6c"><Warning /></el-icon>
          <p class="mt-4 text-white">{{ error }}</p>
          <el-button @click="retry" class="mt-4">重试</el-button>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="debug-panel" v-if="showDebug">
      <h4>调试信息</h4>
      <div class="debug-info">
        <p><strong>视频路径:</strong> {{ videoUrl }}</p>
        <p><strong>视频状态:</strong> {{ videoState }}</p>
        <p><strong>视频时长:</strong> {{ videoDuration }}秒</p>
        <p><strong>当前时间:</strong> {{ currentTime }}秒</p>
        <p><strong>视频尺寸:</strong> {{ videoWidth }}x{{ videoHeight }}</p>
        <p><strong>播放速度:</strong> {{ playbackRate }}x</p>
        <p><strong>音量:</strong> {{ volume }}% {{ isMuted ? '(静音)' : '' }}</p>
        <p><strong>拖拽状态:</strong> {{ isDragging ? '拖拽中' : '正常' }}</p>
        <p><strong>视频状态:</strong> {{ video ? (video.paused ? '暂停' : '播放') : '未加载' }}</p>
        <p><strong>当前FOV:</strong> {{ currentFOV }}° ({{ getZoomPercentage() }})</p>
        <p><strong>Three.js场景:</strong> {{ sceneInfo }}</p>
      </div>
      
      <h5>快捷键</h5>
      <div class="shortcut-info">
        <p><strong>空格:</strong> 播放/暂停</p>
        <p><strong>←/→:</strong> 快退/快进</p>
        <p><strong>F:</strong> 全屏切换</p>
        <p><strong>M:</strong> 静音切换</p>
        <p><strong>R:</strong> 重置视角</p>
        <p><strong>Shift+R:</strong> 自动旋转</p>
        <p><strong>S:</strong> 截图</p>
        <p><strong>1-4:</strong> 倍速 (0.5x, 1x, 1.5x, 2x)</p>
        <p><strong>+/-:</strong> 放大/缩小</p>
        <p><strong>0:</strong> 恢复原始尺寸</p>
      </div>
      
      <el-button @click="showDebug = false" size="small">隐藏调试</el-button>
    </div>
    
    <el-button 
      v-if="!showDebug" 
      @click="showDebug = true" 
      size="small" 
      class="debug-toggle"
    >
      显示调试
    </el-button>
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
  DArrowLeft,
  DArrowRight,
  Camera,
  FullScreen,
  Mute,
  Plus,
  List,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Aim
} from '@element-plus/icons-vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 模板引用
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const previewCanvas = ref<HTMLCanvasElement>()

// 状态管理
const loading = ref(true)
const error = ref('')
const status = ref('初始化')
const statusMessage = ref('准备加载全景视频...')
const statusType = ref<'info' | 'success' | 'warning' | 'danger'>('info')
const loadingMessage = ref('正在初始化...')

// 播放控制
const isPlaying = ref(false)
const autoRotate = ref(false)
const playbackRate = ref(1)
const volume = ref(100)
const isMuted = ref(true) // 默认静音
const skipTime = ref(10) // 快进快退时间（秒）

// 进度标记相关
interface ProgressMarker {
  id: string
  time: number
  title: string
  description?: string
  type: 'important' | 'warning' | 'info' | 'error'
}

const progressMarkers = ref<ProgressMarker[]>([])
const showMarkerManager = ref(false)
const showMarkerDialog = ref(false)
const editingMarker = ref<ProgressMarker | null>(null)
const markerForm = ref<{
  title: string
  time: number
  description: string
  type: ProgressMarker['type']
}>({
  title: '',
  time: 0,
  description: '',
  type: 'info'
})

// 预览相关
const showPreview = ref(false)
const previewTime = ref(0)
const previewPosition = ref(0)

// 调试信息
const showDebug = ref(false)
const videoUrl = ref('/Out/stitched_output.mp4')
const videoState = ref('未加载')
const videoDuration = ref(0)
const currentTime = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const sceneInfo = ref('未创建')

// Three.js 对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let video: HTMLVideoElement
let videoTexture: THREE.VideoTexture
let mesh: THREE.Mesh
let animationId: number

// 鼠标交互
const isMouseDown = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

// 缩放控制
const currentFOV = ref(75) // 当前视野角度
const defaultFOV = 75 // 默认视野角度
const minFOV = 20 // 最小视野角度（最大放大）
const maxFOV = 120 // 最大视野角度（最大缩小）
const zoomSpeed = 5 // 缩放速度

// 初始化Three.js场景
const initScene = () => {
  if (!containerRef.value || !canvasRef.value) return false

  try {
    // 创建场景
    scene = new THREE.Scene()
    sceneInfo.value = '场景已创建'

    // 创建相机
    camera = new THREE.PerspectiveCamera(
      75,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 0.1)

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.value,
      antialias: true 
    })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000)

    // 创建控制器
    controls = new OrbitControls(camera, canvasRef.value)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = false
    controls.rotateSpeed = -0.5
    controls.minDistance = 0.1
    controls.maxDistance = 100
    controls.autoRotate = false
    controls.autoRotateSpeed = 2.0

    sceneInfo.value = '场景初始化完成'
    return true
  } catch (err) {
    console.error('Three.js场景初始化失败:', err)
    error.value = `场景初始化失败: ${err}`
    return false
  }
}

// 初始化视频
const initVideo = () => {
  return new Promise<void>((resolve, reject) => {
    loadingMessage.value = '创建视频元素...'
    
    // 创建视频元素
    video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.loop = false

    // 视频事件监听
    video.addEventListener('loadstart', () => {
      videoState.value = '开始加载'
      loadingMessage.value = '开始加载视频文件...'
    })

    video.addEventListener('loadedmetadata', () => {
      videoState.value = '元数据已加载'
      videoDuration.value = video.duration
      videoWidth.value = video.videoWidth
      videoHeight.value = video.videoHeight
      loadingMessage.value = '视频元数据加载完成...'
    })

    video.addEventListener('canplay', () => {
      videoState.value = '可以播放'
      loadingMessage.value = '创建视频纹理...'
      
      try {
        // 创建视频纹理
        videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter
        videoTexture.format = THREE.RGBAFormat

        // 创建球体几何体
        const geometry = new THREE.SphereGeometry(500, 60, 40)
        geometry.scale(-1, 1, 1) // 翻转以在内部显示

        // 创建材质和网格
        const material = new THREE.MeshBasicMaterial({ map: videoTexture })
        mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        status.value = '就绪'
        statusType.value = 'success'
        statusMessage.value = '全景视频已准备就绪'
        loading.value = false
        
        resolve()
      } catch (err) {
        console.error('创建视频纹理失败:', err)
        reject(err)
      }
    })

    video.addEventListener('timeupdate', () => {
      // 只在非拖拽状态下更新currentTime，避免与用户操作冲突
      if (!isDragging) {
        currentTime.value = video.currentTime
      }
      // 确保视频纹理在播放时持续更新
      if (videoTexture && !video.paused) {
        videoTexture.needsUpdate = true
      }
    })

    video.addEventListener('error', (event) => {
      console.error('视频加载错误:', event)
      const errorMsg = video.error ? 
        `视频错误 (${video.error.code}): ${getVideoErrorMessage(video.error.code)}` : 
        '视频加载失败'
      videoState.value = '加载错误'
      reject(new Error(errorMsg))
    })

    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('视频加载超时'))
    }, 15000)

    // 开始加载视频
    video.addEventListener('canplay', () => {
      clearTimeout(timeout)
    })
    
    video.src = videoUrl.value
    video.load()
  })
}

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera) return
  
  animationId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  renderer.render(scene, camera)
}

// 初始化
const init = async () => {
  try {
    status.value = '初始化场景'
    statusType.value = 'info'
    
    if (!initScene()) {
      throw new Error('场景初始化失败')
    }

    status.value = '加载视频'
    await initVideo()

    // 开始动画循环
    animate()

    status.value = '完成'
    statusType.value = 'success'
    statusMessage.value = '全景视频查看器已就绪'
    
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = `初始化失败: ${err}`
    status.value = '错误'
    statusType.value = 'danger'
    statusMessage.value = `初始化失败: ${err}`
    loading.value = false
  }
}

// 控制方法
const togglePlay = () => {
  if (!video) return
  
  if (video.paused) {
    video.play().then(() => {
      isPlaying.value = true
      ElMessage.success('开始播放')
    }).catch(err => {
      ElMessage.error(`播放失败: ${err.message}`)
    })
  } else {
    video.pause()
    isPlaying.value = false
    ElMessage.info('已暂停')
  }
}

const resetView = () => {
  if (controls && camera) {
    controls.reset()
    camera.position.set(0, 0, 0.1)
    
    // 重置缩放到原始尺寸
    currentFOV.value = defaultFOV
    camera.fov = defaultFOV
    camera.updateProjectionMatrix()
    
    ElMessage.success('视角和缩放已重置')
  }
}

const toggleAutoRotate = () => {
  if (controls) {
    controls.autoRotate = !controls.autoRotate
    autoRotate.value = controls.autoRotate
    ElMessage.info(autoRotate.value ? '开始自动旋转' : '停止自动旋转')
  }
}

// 缩放控制方法
const zoomIn = () => {
  if (!camera) return
  
  const newFOV = Math.max(minFOV, currentFOV.value - zoomSpeed * 2)
  if (newFOV !== currentFOV.value) {
    currentFOV.value = newFOV
    camera.fov = newFOV
    camera.updateProjectionMatrix()
    
    const zoomLevel = Math.round(((defaultFOV - newFOV) / (defaultFOV - minFOV)) * 100)
    ElMessage.success(`放大到 ${zoomLevel}%`)
  }
}

const zoomOut = () => {
  if (!camera) return
  
  const newFOV = Math.min(maxFOV, currentFOV.value + zoomSpeed * 2)
  if (newFOV !== currentFOV.value) {
    currentFOV.value = newFOV
    camera.fov = newFOV
    camera.updateProjectionMatrix()
    
    if (newFOV > defaultFOV) {
      const shrinkLevel = Math.round(((newFOV - defaultFOV) / (maxFOV - defaultFOV)) * 100)
      ElMessage.success(`缩小到 ${shrinkLevel}%`)
    } else {
      ElMessage.success('恢复到原始尺寸')
    }
  }
}

const resetZoom = () => {
  if (!camera) return
  
  currentFOV.value = defaultFOV
  camera.fov = defaultFOV
  camera.updateProjectionMatrix()
  ElMessage.success('已恢复到原始尺寸')
}

// 快进
const skipForward = () => {
  if (video && videoDuration.value > 0) {
    const newTime = Math.min(video.currentTime + skipTime.value, videoDuration.value)
    seekTo(newTime)
    ElMessage.info(`快进 ${skipTime.value} 秒`)
  }
}

// 快退
const skipBackward = () => {
  if (video && videoDuration.value > 0) {
    const newTime = Math.max(video.currentTime - skipTime.value, 0)
    seekTo(newTime)
    ElMessage.info(`快退 ${skipTime.value} 秒`)
  }
}

// 跳转到指定时间
const seekTo = (time: number) => {
  if (!video || videoDuration.value <= 0) return
  
  // 确保时间在有效范围内
  const clampedTime = Math.max(0, Math.min(time, videoDuration.value))
  
  try {
    console.log(`跳转到时间: ${clampedTime}秒`)
    
    // 设置视频时间
    video.currentTime = clampedTime
    currentTime.value = clampedTime
    
    // 强制更新视频纹理和渲染
    const forceUpdate = () => {
      if (videoTexture) {
        videoTexture.needsUpdate = true
        console.log('强制更新视频纹理')
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
        console.log('强制渲染一帧')
      }
    }
    
    // 无论播放还是暂停状态都需要处理
    const handleSeeked = () => {
      video.removeEventListener('seeked', handleSeeked)
      forceUpdate()
      console.log('seeked事件触发，画面已更新')
    }
    
    // 监听seeked事件
    video.addEventListener('seeked', handleSeeked)
    
    // 立即强制更新一次
    forceUpdate()
    
    // 设置超时防止事件未触发
    setTimeout(() => {
      video.removeEventListener('seeked', handleSeeked)
      forceUpdate()
      console.log('超时保护触发，强制更新画面')
    }, 300)
    
  } catch (error) {
    console.error('跳转时间失败:', error)
    ElMessage.error('跳转失败')
  }
}

// 改变播放速度
const changePlaybackRate = (rate: number) => {
  if (video) {
    video.playbackRate = rate
    playbackRate.value = rate
    ElMessage.info(`播放速度已设置为 ${rate}x`)
  }
}

// 音量控制
const changeVolume = (vol: number) => {
  if (video) {
    video.volume = vol / 100
    volume.value = vol
    if (vol > 0 && isMuted.value) {
      isMuted.value = false
      video.muted = false
    }
  }
}

// 静音/取消静音
const toggleMute = () => {
  if (video) {
    video.muted = !video.muted
    isMuted.value = video.muted
    ElMessage.info(isMuted.value ? '已静音' : '已取消静音')
  }
}

// 截图功能
const captureScreenshot = () => {
  if (!renderer || !scene || !camera) {
    ElMessage.error('渲染器未准备就绪')
    return
  }

  try {
    // 渲染当前帧
    renderer.render(scene, camera)
    
    // 获取canvas数据
    const canvas = renderer.domElement
    const dataURL = canvas.toDataURL('image/png')
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `panorama_screenshot_${new Date().getTime()}.png`
    link.href = dataURL
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('截图已保存')
  } catch (error) {
    console.error('截图失败:', error)
    ElMessage.error('截图失败')
  }
}

// 全屏切换
const toggleFullscreen = () => {
  if (!containerRef.value) return

  if (document.fullscreenElement) {
    document.exitFullscreen().then(() => {
      ElMessage.info('已退出全屏')
    }).catch(err => {
      ElMessage.error('退出全屏失败')
      console.error(err)
    })
  } else {
    containerRef.value.requestFullscreen().then(() => {
      ElMessage.success('已进入全屏')
    }).catch(err => {
      ElMessage.error('进入全屏失败')
      console.error(err)
    })
  }
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '00:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取缩放百分比显示
const getZoomPercentage = (): string => {
  if (currentFOV.value === defaultFOV) {
    return '原始尺寸'
  } else if (currentFOV.value < defaultFOV) {
    const zoomLevel = Math.round(((defaultFOV - currentFOV.value) / (defaultFOV - minFOV)) * 100)
    return `放大 ${zoomLevel}%`
  } else {
    const shrinkLevel = Math.round(((currentFOV.value - defaultFOV) / (maxFOV - defaultFOV)) * 100)
    return `缩小 ${shrinkLevel}%`
  }
}

// 进度标记管理
const addMarker = () => {
  if (!video) return
  
  markerForm.value = {
    title: `标记点 ${progressMarkers.value.length + 1}`,
    time: currentTime.value,
    description: '',
    type: 'info'
  }
  editingMarker.value = null
  showMarkerDialog.value = true
}

const editMarker = (marker: ProgressMarker) => {
  markerForm.value = {
    title: marker.title,
    time: marker.time,
    description: marker.description || '',
    type: marker.type
  }
  editingMarker.value = marker
  showMarkerDialog.value = true
}

const saveMarker = () => {
  if (!markerForm.value.title.trim()) {
    ElMessage.error('请输入标记标题')
    return
  }

  if (editingMarker.value) {
    // 编辑现有标记
    const index = progressMarkers.value.findIndex(m => m.id === editingMarker.value!.id)
    if (index > -1) {
      progressMarkers.value[index] = {
        ...editingMarker.value,
        ...markerForm.value
      }
      ElMessage.success('标记已更新')
    }
  } else {
    // 添加新标记
    const newMarker: ProgressMarker = {
      id: Date.now().toString(),
      ...markerForm.value
    }
    progressMarkers.value.push(newMarker)
    // 按时间排序
    progressMarkers.value.sort((a, b) => a.time - b.time)
    ElMessage.success('标记已添加')
  }

  showMarkerDialog.value = false
  editingMarker.value = null
}

const deleteMarker = (markerId: string) => {
  const index = progressMarkers.value.findIndex(m => m.id === markerId)
  if (index > -1) {
    progressMarkers.value.splice(index, 1)
    ElMessage.success('标记已删除')
  }
}

// 滑块拖拽处理
let isDragging = false

const handleSliderInput = (value: number) => {
  // 拖拽过程中只更新显示时间，不跳转视频
  isDragging = true
  previewTime.value = value
}

const handleSliderChange = (value: number) => {
  // 拖拽结束时才跳转视频
  isDragging = false
  seekTo(value)
}

// 进度悬停处理
const handleProgressHover = (value: number) => {
  if (!isDragging) {
    previewTime.value = value
  }
  // 暂时禁用预览功能，避免影响主视频播放
  // generatePreviewThumbnail(value)
}

const showMarkerTooltip = (marker: ProgressMarker) => {
  // 显示标记提示信息
  ElMessage.info(`${marker.title}: ${formatTime(marker.time)}`)
}

const hideMarkerTooltip = () => {
  // 隐藏提示信息
}

// 生成预览缩略图
const generatePreviewThumbnail = (time: number) => {
  if (!video || !previewCanvas.value || !renderer || !scene || !camera) return

  try {
    // 临时跳转到指定时间
    const originalTime = video.currentTime
    video.currentTime = time

    // 等待视频更新后渲染缩略图
    setTimeout(() => {
      if (!previewCanvas.value) return

      const ctx = previewCanvas.value.getContext('2d')
      if (!ctx) return

      // 渲染当前帧到预览canvas
      renderer.render(scene, camera)
      
      // 将主canvas内容复制到预览canvas
      ctx.drawImage(renderer.domElement, 0, 0, 160, 90)
      
      // 恢复原始播放位置
      video.currentTime = originalTime
    }, 100)
  } catch (error) {
    console.error('生成预览缩略图失败:', error)
  }
}

// 导出/导入标记
const exportMarkers = () => {
  const dataStr = JSON.stringify(progressMarkers.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `progress_markers_${new Date().getTime()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('标记已导出')
}

const handleImportMarkers = (file: any) => {
  if (!file.raw) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const markers = JSON.parse(e.target?.result as string)
      if (Array.isArray(markers)) {
        progressMarkers.value = markers.sort((a, b) => a.time - b.time)
        ElMessage.success(`已导入 ${markers.length} 个标记`)
      } else {
        throw new Error('无效的标记文件格式')
      }
    } catch (error) {
      ElMessage.error('导入标记失败: ' + error)
    }
  }
  reader.readAsText(file.raw)
}

const clearAllMarkers = () => {
  progressMarkers.value = []
  ElMessage.success('所有标记已清空')
}

const retry = () => {
  error.value = ''
  loading.value = true
  init()
}

// 鼠标事件
const onMouseDown = (event: MouseEvent) => {
  isMouseDown.value = true
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseMove = (event: MouseEvent) => {
  if (!isMouseDown.value) return
  mouseX.value = event.clientX
  mouseY.value = event.clientY
}

const onMouseUp = () => {
  isMouseDown.value = false
}

const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  if (!camera) return
  
  // 根据滚轮方向调整FOV
  const delta = event.deltaY > 0 ? zoomSpeed : -zoomSpeed
  const newFOV = currentFOV.value + delta
  
  // 限制FOV范围
  const clampedFOV = Math.max(minFOV, Math.min(maxFOV, newFOV))
  
  if (clampedFOV !== currentFOV.value) {
    currentFOV.value = clampedFOV
    camera.fov = clampedFOV
    camera.updateProjectionMatrix()
    
    // 显示缩放提示
    const zoomLevel = Math.round(((defaultFOV - clampedFOV) / (defaultFOV - minFOV)) * 100)
    if (clampedFOV < defaultFOV) {
      ElMessage.info(`放大 ${zoomLevel}%`)
    } else if (clampedFOV > defaultFOV) {
      const shrinkLevel = Math.round(((clampedFOV - defaultFOV) / (maxFOV - defaultFOV)) * 100)
      ElMessage.info(`缩小 ${shrinkLevel}%`)
    } else {
      ElMessage.info('原始尺寸')
    }
  }
}

// 窗口大小变化
const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // 如果在输入框中，忽略快捷键
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (event.code) {
    case 'Space':
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      skipBackward()
      break
    case 'ArrowRight':
      event.preventDefault()
      skipForward()
      break
    case 'KeyF':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'KeyM':
      event.preventDefault()
      toggleMute()
      break
    case 'KeyR':
      event.preventDefault()
      if (event.shiftKey) {
        toggleAutoRotate()
      } else {
        resetView()
      }
      break
    case 'KeyS':
      event.preventDefault()
      captureScreenshot()
      break
    case 'Digit1':
      event.preventDefault()
      changePlaybackRate(0.5)
      break
    case 'Digit2':
      event.preventDefault()
      changePlaybackRate(1)
      break
    case 'Digit3':
      event.preventDefault()
      changePlaybackRate(1.5)
      break
    case 'Digit4':
      event.preventDefault()
      changePlaybackRate(2)
      break
    case 'Equal':
    case 'NumpadAdd':
      event.preventDefault()
      zoomIn()
      break
    case 'Minus':
    case 'NumpadSubtract':
      event.preventDefault()
      zoomOut()
      break
    case 'Digit0':
    case 'Numpad0':
      event.preventDefault()
      resetZoom()
      break
  }
}

// 生命周期
onMounted(() => {
  init()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (video) {
    video.pause()
    video.src = ''
    video.load()
  }
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (controls) {
    controls.dispose()
  }
  
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})

// 辅助函数
function getVideoErrorMessage(code: number): string {
  switch (code) {
    case 1: return '视频加载被中止'
    case 2: return '网络错误'
    case 3: return '视频解码错误'
    case 4: return '视频格式不支持'
    default: return '未知错误'
  }
}
</script>

<style scoped>
.simple-panorama-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.control-panel {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.control-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.status-info {
  display: flex;
  align-items: center;
}

.time-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 300px;
}

.time-display {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.progress-container {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.progress-slider {
  width: 100%;
}

.progress-markers {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  pointer-events: none;
  transform: translateY(-50%);
}

.progress-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: all;
  z-index: 10;
}

.marker-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.progress-marker.important .marker-dot {
  background: #f56c6c;
}

.progress-marker.warning .marker-dot {
  background: #e6a23c;
}

.progress-marker.info .marker-dot {
  background: #409eff;
}

.progress-marker.error .marker-dot {
  background: #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.progress-marker:hover .marker-dot {
  transform: scale(1.3);
  transition: transform 0.2s ease;
}

.progress-preview {
  position: absolute;
  bottom: 30px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 8px;
  color: white;
  font-size: 12px;
  pointer-events: none;
  z-index: 20;
}

.preview-thumbnail {
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.preview-time {
  text-align: center;
  font-weight: 500;
}

.speed-control,
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.viewer-container {
  flex: 1;
  position: relative;
  background: #000;
  cursor: grab;
  overflow: hidden;
}

.viewer-container:active {
  cursor: grabbing;
}

.viewer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.loading-content,
.error-content {
  text-align: center;
  color: white;
}

.debug-panel {
  position: absolute;
  top: 60px;
  left: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px;
  border-radius: 8px;
  max-width: 300px;
  z-index: 20;
}

.debug-panel h4 {
  margin: 0 0 12px 0;
  color: #409EFF;
}

.debug-info p,
.shortcut-info p {
  margin: 4px 0;
  font-size: 12px;
  word-break: break-all;
}

.debug-panel h5 {
  margin: 12px 0 8px 0;
  color: #67C23A;
  font-size: 14px;
}

.debug-toggle {
  position: absolute;
  top: 60px;
  left: 16px;
  z-index: 20;
}

/* 标记管理样式 */
.marker-controls,
.zoom-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.marker-manager {
  max-height: 500px;
  overflow-y: auto;
}

.marker-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.marker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.marker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}

.marker-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.marker-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-type-icon .marker-dot {
  width: 12px;
  height: 12px;
}

.marker-details {
  flex: 1;
}

.marker-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.marker-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.marker-desc {
  font-size: 12px;
  color: #999;
}

.marker-actions {
  display: flex;
  gap: 8px;
}

.empty-markers {
  text-align: center;
  padding: 40px 20px;
}
</style>
