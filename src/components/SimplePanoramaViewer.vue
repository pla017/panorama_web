<template>
  <div class="simple-panorama-viewer">
    <!-- 顶部状态栏 -->
    <div class="top-status-bar">
      <div class="video-title">{{ currentVideo?.name || '全景视频播放器' }}</div>
      <div class="status-info">
        <el-tag :type="statusType" size="small">{{ status }}</el-tag>
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

    <!-- 主要视角容器 -->
    <div class="main-viewer-container">
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

        <!-- 四视角浮动面板 -->
        <div v-if="showQuadView" class="quad-view-overlay">
          <div class="quad-view-header">
            <span class="quad-view-title">四视角导航</span>
            <el-button size="small" text @click="showQuadView = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="quad-views-grid">
            <div 
              v-for="(view, index) in quadViews" 
              :key="index"
              :class="['quad-view-item', { active: activeQuadView === index }]"
              @click="switchToQuadView(index)"
            >
              <canvas 
                :ref="(el: any) => { if (el) quadCanvasRefs[index] = el as HTMLCanvasElement }"
                class="quad-canvas"
                width="120" 
                height="90"
              ></canvas>
              <div class="quad-view-label">{{ view.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom-controls">
      <!-- 第一行：播放控制和进度条 -->
      <div class="playback-row">
        <!-- 播放控制组 -->
        <div class="playback-controls">
          <!-- 视频导航 -->
          <el-button @click="previousVideo" size="small" :disabled="currentVideoIndex <= 0">
            <el-icon><ArrowLeftBold /></el-icon>
          </el-button>
          
          <!-- 快退 -->
          <el-button @click="skipBackward" size="small" :disabled="!video">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          
          <!-- 播放/暂停 -->
          <el-button @click="togglePlay" :type="isPlaying ? 'danger' : 'primary'" size="large">
            <el-icon size="20">
              <VideoPause v-if="isPlaying" />
              <VideoPlay v-else />
            </el-icon>
          </el-button>
          
          <!-- 快进 -->
          <el-button @click="skipForward" size="small" :disabled="!video">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
          
          <!-- 下一个视频 -->
          <el-button @click="nextVideo" size="small" :disabled="currentVideoIndex >= videoList.length - 1">
            <el-icon><ArrowRightBold /></el-icon>
          </el-button>
        </div>

        <!-- 进度条区域 -->
        <div class="progress-section">
          <div class="time-display">{{ formatTime(currentTime) }}</div>
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
          <div class="time-display">{{ formatTime(videoDuration) }}</div>
        </div>

        <!-- 右侧快捷功能 -->
        <div class="quick-controls">
          <!-- 音量控制 -->
          <el-button @click="toggleMute" size="small">
            <el-icon>
              <Mute v-if="isMuted" />
              <VideoPlay v-else />
            </el-icon>
          </el-button>
          
          <!-- 全屏 -->
          <el-button @click="toggleFullscreen" size="small">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 第二行：详细工具栏 -->
      <div class="toolbar-row">
        <div class="toolbar-group">
          <!-- 倍速和音量 -->
          <div class="media-controls">
            <span class="control-label">倍速:</span>
            <el-select v-model="playbackRate" @change="changePlaybackRate" size="small" style="width: 70px;">
              <el-option label="0.5x" :value="0.5" />
              <el-option label="1x" :value="1" />
              <el-option label="1.5x" :value="1.5" />
              <el-option label="2x" :value="2" />
              <el-option label="2.5x" :value="2.5" />
            </el-select>
            
            <span class="control-label ml-4">音量:</span>
            <el-slider
              v-model="volume"
              :max="100"
              :show-tooltip="false"
              @change="changeVolume"
              style="width: 80px;"
            />
            <span class="volume-text">{{ volume }}%</span>
          </div>

          <!-- 视角控制 -->
          <div class="view-controls">
            <el-button @click="resetView" size="small">
              <el-icon><Refresh /></el-icon>
              重置视角
            </el-button>
            <el-button @click="toggleAutoRotate" size="small" :type="autoRotate ? 'primary' : 'default'">
              <el-icon><Refresh /></el-icon>
              {{ autoRotate ? '停止旋转' : '自动旋转' }}
            </el-button>
          </div>

          <!-- 缩放控制 -->
          <div class="zoom-controls">
            <el-button @click="zoomOut" size="small" :disabled="currentFOV >= maxFOV">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button @click="resetZoom" size="small">
              <el-icon><Aim /></el-icon>
            </el-button>
            <el-button @click="zoomIn" size="small" :disabled="currentFOV <= minFOV">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
          </div>

          <!-- 功能按钮 -->
          <div class="function-controls">
            <!-- <el-button @click="toggleQuadView" size="small" :type="showQuadView ? 'primary' : 'default'">
              <el-icon><Grid /></el-icon>
              {{ showQuadView ? '单视角' : '四视角' }}
            </el-button> -->
            <el-button @click="captureScreenshot" size="small" :disabled="!video">
              <el-icon><Camera /></el-icon>
              截图
            </el-button>
            <el-button @click="addMarker" size="small" :disabled="!video">
              <el-icon><Plus /></el-icon>
              标记
            </el-button>
          </div>

          <!-- 管理功能 -->
          <div class="management-controls">
            <el-button @click="showMarkerManager = true" size="small">
              <el-icon><List /></el-icon>
              标记管理
            </el-button>
            <el-button @click="showVideoList = true" size="small">
              <el-icon><VideoPlay /></el-icon>
              视频列表
            </el-button>
            <el-button @click="showSettingsPanel = true" size="small">
              <el-icon><Setting /></el-icon>
              设置
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <el-dialog
      v-model="showSettingsPanel"
      title="播放器设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="settings-content">
        <!-- 快进快退时长设置 -->
        <div class="setting-group">
          <h4>快进/快退时长</h4>
          <el-radio-group v-model="skipTime" @change="onSkipTimeChange">
            <el-radio :label="10">10秒</el-radio>
            <el-radio :label="15">15秒</el-radio>
            <el-radio :label="20">20秒</el-radio>
            <el-radio :label="25">25秒</el-radio>
            <el-radio :label="30">30秒</el-radio>
          </el-radio-group>
        </div>

        <!-- 默认播放速率 -->
        <div class="setting-group">
          <h4>默认播放速率</h4>
          <el-select v-model="defaultPlaybackRate" @change="onDefaultPlaybackRateChange" style="width: 120px;">
            <el-option label="0.5x" :value="0.5" />
            <el-option label="0.75x" :value="0.75" />
            <el-option label="1x" :value="1" />
            <el-option label="1.25x" :value="1.25" />
            <el-option label="1.5x" :value="1.5" />
            <el-option label="2x" :value="2" />
            <el-option label="2.5x" :value="2.5" />
          </el-select>
        </div>

        <!-- 自动播放设置 -->
        <div class="setting-group">
          <h4>自动播放</h4>
          <el-switch 
            v-model="autoPlay" 
            @change="onAutoPlayChange"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <!-- 视频质量设置 -->
        <div class="setting-group">
          <h4>视频质量</h4>
          <el-select v-model="videoQuality" @change="onVideoQualityChange" style="width: 120px;">
            <el-option label="自动" value="auto" />
            <el-option label="高清" value="high" />
            <el-option label="标清" value="medium" />
            <el-option label="流畅" value="low" />
          </el-select>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetSettings">重置默认</el-button>
          <el-button type="primary" @click="showSettingsPanel = false">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视频列表面板 -->
    <el-drawer
      v-model="showVideoList"
      title="视频列表"
      :size="400"
      direction="rtl"
    >
      <div class="video-list-content">
        <!-- 当前播放信息 -->
        <div class="current-video-info">
          <h4>当前播放</h4>
          <div class="video-info-card">
            <div class="video-thumbnail">
              <canvas ref="thumbnailCanvas" width="120" height="68"></canvas>
            </div>
            <div class="video-details">
              <div class="video-name">{{ currentVideo?.name || '未知视频' }}</div>
              <div class="video-meta">
                <span>{{ formatTime(videoDuration) }}</span>
                <span>{{ videoInfo.width }}x{{ videoInfo.height }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频列表 -->
        <div class="video-list">
          <h4>播放列表 ({{ videoList.length }})</h4>
          <div class="video-list-items">
            <div 
              v-for="(video, index) in videoList" 
              :key="video.id"
              :class="['video-item', { active: index === currentVideoIndex }]"
              @click="switchToVideo(index)"
            >
              <div class="video-item-index">{{ index + 1 }}</div>
              <div class="video-item-info">
                <div class="video-item-name">{{ video.name }}</div>
                <div class="video-item-meta">
                  <span>{{ video.duration || '--:--' }}</span>
                  <span>{{ video.size || '--' }}</span>
                </div>
              </div>
              <div class="video-item-actions">
                <el-button size="small" @click.stop="removeVideo(index)" type="danger" :icon="Delete">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 添加视频 -->
        <div class="add-video-section">
          <el-upload
            :show-file-list="false"
            :before-upload="handleVideoUpload"
            accept="video/*"
            multiple
          >
            <el-button type="primary" :icon="Plus">添加视频</el-button>
          </el-upload>
        </div>
      </div>
    </el-drawer>

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
        <p><strong>相机角度:</strong> Y={{ camera ? (camera.rotation.y * 180 / Math.PI).toFixed(1) : 0 }}°</p>
        <p><strong>激活视角:</strong> {{ activeQuadView }} ({{ quadViews[activeQuadView]?.label || 'None' }})</p>
        <p><strong>控制器状态:</strong> {{ controls ? (controls.enabled ? '启用' : '禁用') : '未初始化' }}</p>
        <p><strong>四视角状态:</strong> {{ showQuadView ? '显示' : '隐藏' }} ({{ quadRenderers.length }} 渲染器)</p>
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
        <p><strong>Q/W/E/Ctrl+R:</strong> 四视角切换 (正面/右侧/背面/左侧)</p>
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
  Aim,
  Setting,
  ArrowLeftBold,
  ArrowRightBold,
  Delete,
  Grid,
  Close
} from '@element-plus/icons-vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 模板引用
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const previewCanvas = ref<HTMLCanvasElement>()
const thumbnailCanvas = ref<HTMLCanvasElement>()

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

// 新增功能状态
const showSettingsPanel = ref(false)
const showVideoList = ref(false)
const defaultPlaybackRate = ref(1)
const autoPlay = ref(false)
const videoQuality = ref('auto')

// 视频列表管理
interface VideoItem {
  id: string
  name: string
  url: string
  duration?: string
  size?: string
}

const videoList = ref<VideoItem[]>([
  {
    id: '1',
    name: 'stitched_output.mp4',
    url: '/Out/stitched_output.mp4',
    duration: '--:--',
    size: '--'
  }
])
const currentVideoIndex = ref(0)
const currentVideo = ref<VideoItem | null>(videoList.value[0])

// 视频信息
const videoInfo = ref({
  width: 0,
  height: 0,
  fps: 30
})

// 四视角功能
const showQuadView = ref(false)
const activeQuadView = ref(0)
const quadCanvasRefs: HTMLCanvasElement[] = []
const quadViews = ref([
  { label: '正面 0°', rotation: 0 },
  { label: '右侧 90°', rotation: Math.PI / 2 },
  { label: '背面 180°', rotation: Math.PI },
  { label: '左侧 270°', rotation: Math.PI * 1.5 }
])

// 预定义的角度数组，确保一致性
const QUAD_ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]

// 四视角渲染器
let quadRenderers: THREE.WebGLRenderer[] = []
let quadCameras: THREE.PerspectiveCamera[] = []
let quadControls: OrbitControls[] = []

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
    
    // 同步四视角相机
    syncQuadCameras()
    
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
    
    // 同步四视角相机
    syncQuadCameras()
    
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
  
  // 同步四视角相机
  syncQuadCameras()
  
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

// 新增功能方法
// 视频导航
const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    switchToVideo(currentVideoIndex.value - 1)
  }
}

const nextVideo = () => {
  if (currentVideoIndex.value < videoList.value.length - 1) {
    switchToVideo(currentVideoIndex.value + 1)
  }
}

const switchToVideo = async (index: number) => {
  if (index < 0 || index >= videoList.value.length) return
  
  const targetVideo = videoList.value[index]
  if (!targetVideo) return
  
  try {
    // 暂停当前视频
    if (video) {
      video.pause()
    }
    
    // 更新当前视频信息
    currentVideoIndex.value = index
    currentVideo.value = targetVideo
    videoUrl.value = targetVideo.url
    
    // 重新初始化视频
    loading.value = true
    status.value = '切换视频'
    statusMessage.value = `正在加载: ${targetVideo.name}`
    
    await init()
    
    // 重新初始化四视角
    await reinitQuadViews()
    
    ElMessage.success(`已切换到: ${targetVideo.name}`)
  } catch (error) {
    console.error('切换视频失败:', error)
    ElMessage.error('切换视频失败')
  }
}

// 设置相关方法
const onSkipTimeChange = (value: number) => {
  skipTime.value = value
  ElMessage.info(`快进/快退时长已设置为 ${value} 秒`)
}

const onDefaultPlaybackRateChange = (rate: number) => {
  defaultPlaybackRate.value = rate
  ElMessage.info(`默认播放速率已设置为 ${rate}x`)
}

const onAutoPlayChange = (enabled: boolean) => {
  autoPlay.value = enabled
  ElMessage.info(enabled ? '已开启自动播放' : '已关闭自动播放')
}

const onVideoQualityChange = (quality: string) => {
  videoQuality.value = quality
  ElMessage.info(`视频质量已设置为: ${quality}`)
}

const resetSettings = () => {
  skipTime.value = 10
  defaultPlaybackRate.value = 1
  autoPlay.value = false
  videoQuality.value = 'auto'
  ElMessage.success('设置已重置为默认值')
}

// 视频列表管理
const handleVideoUpload = (file: File) => {
  const videoUrl = URL.createObjectURL(file)
  const newVideo: VideoItem = {
    id: Date.now().toString(),
    name: file.name,
    url: videoUrl,
    size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
  }
  
  videoList.value.push(newVideo)
  ElMessage.success(`已添加视频: ${file.name}`)
  return false // 阻止上传
}

const removeVideo = (index: number) => {
  if (index < 0 || index >= videoList.value.length) return
  
  const video = videoList.value[index]
  videoList.value.splice(index, 1)
  
  // 如果删除的是当前播放的视频，切换到第一个
  if (index === currentVideoIndex.value) {
    if (videoList.value.length > 0) {
      switchToVideo(0)
    } else {
      currentVideoIndex.value = -1
      currentVideo.value = null
    }
  } else if (index < currentVideoIndex.value) {
    currentVideoIndex.value--
  }
  
  ElMessage.success(`已删除视频: ${video.name}`)
}

// 四视角功能方法
const toggleQuadView = async () => {
  showQuadView.value = !showQuadView.value
  if (showQuadView.value) {
    console.log('开启四视角模式')
    await initQuadViews()
    // 确保初始化成功后设置默认激活视角
    if (quadRenderers.length > 0) {
      activeQuadView.value = 0
      console.log('四视角初始化成功，设置默认激活视角为0')
    } else {
      console.error('四视角初始化失败')
      ElMessage.error('四视角初始化失败')
      showQuadView.value = false
      return
    }
  } else {
    disposeQuadViews()
  }
  ElMessage.info(showQuadView.value ? '已开启四视角模式' : '已关闭四视角模式')
}

const initQuadViews = async () => {
  if (!scene || !videoTexture) {
    console.warn('Scene or videoTexture not ready for quad views')
    return
  }
  
  // 等待DOM更新
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // 清理现有资源
  disposeQuadViews()
  
  quadRenderers = []
  quadCameras = []
  quadControls = []
  
  let successCount = 0
  
  quadViews.value.forEach((view, index) => {
    const canvas = quadCanvasRefs[index]
    if (!canvas) {
      console.warn(`Canvas ${index} not found`)
      return
    }
    
    try {
      // 创建渲染器
      const renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true,
        preserveDrawingBuffer: true
      })
      renderer.setSize(120, 90)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比以提高性能
      renderer.setClearColor(0x000000)
      
      // 创建相机
      const camera = new THREE.PerspectiveCamera(75, 120 / 90, 0.1, 1000)
      camera.position.set(0, 0, 1)
      
      // 使用预定义角度设置初始旋转
      const fixedAngle = QUAD_ANGLES[index]
      camera.rotation.set(0, fixedAngle, 0)
      camera.updateMatrixWorld(true)
      
      // 存储固定角度
      Object.defineProperty(camera, '_fixedAngle', {
        value: fixedAngle,
        writable: false
      })
      
      quadRenderers[index] = renderer
      quadCameras[index] = camera
      successCount++
      
      console.log(`Quad view ${index} (${view.label}) initialized successfully`)
      
    } catch (error) {
      console.error(`Failed to initialize quad view ${index}:`, error)
    }
  })
  
  if (successCount > 0) {
    console.log(`${successCount} quad views initialized successfully`)
    // 开始渲染循环
    renderQuadViews()
  } else {
    console.error('No quad views were initialized successfully')
  }
}

let quadViewAnimationId: number | null = null

const renderQuadViews = () => {
  if (!showQuadView.value || !scene || quadRenderers.length === 0) {
    quadViewAnimationId = null
    return
  }
  
  try {
    quadRenderers.forEach((renderer, index) => {
      if (renderer && quadCameras[index] && scene) {
        const quadCamera = quadCameras[index]
        
        // 确保四视角相机始终保持正确的固定角度
        const fixedAngle = (quadCamera as any)._fixedAngle
        if (fixedAngle !== undefined) {
          quadCamera.rotation.set(0, fixedAngle, 0)
        }
        
        // 确保相机矩阵是最新的
        quadCamera.updateMatrixWorld(true)
        renderer.render(scene, quadCamera)
      }
    })
  } catch (error) {
    console.error('Error rendering quad views:', error)
  }
  
  // 继续渲染循环
  if (showQuadView.value) {
    quadViewAnimationId = requestAnimationFrame(renderQuadViews)
  }
}

const switchToQuadView = (index: number) => {
  // 基本验证
  if (!camera || !controls || index < 0 || index >= quadViews.value.length) {
    console.error(`Invalid switch request: camera=${!!camera}, controls=${!!controls}, index=${index}`)
    return
  }
  
  const targetView = quadViews.value[index]
  console.log(`切换到: ${targetView.label} (${index})`)
  
  // 更新激活状态
  activeQuadView.value = index
  
  // 使用预定义的角度
  const targetAngle = QUAD_ANGLES[index]
  
  console.log(`目标角度: ${(targetAngle * 180 / Math.PI)}°`)
  
  // 直接设置相机角度，不使用动画避免冲突
  camera.position.set(0, 0, 1)
  camera.rotation.set(0, targetAngle, 0)
  camera.updateMatrixWorld(true)
  
  // 重置并更新控制器
  controls.target.set(0, 0, 0)
  controls.reset()
  
  console.log(`切换完成: ${targetView.label}`)
  ElMessage.success(`已切换到${targetView.label}`)
}

const disposeQuadViews = () => {
  // 停止渲染循环
  if (quadViewAnimationId) {
    cancelAnimationFrame(quadViewAnimationId)
    quadViewAnimationId = null
  }
  
  // 清理渲染器
  quadRenderers.forEach((renderer, index) => {
    if (renderer) {
      try {
        renderer.dispose()
        console.log(`Disposed quad renderer ${index}`)
      } catch (error) {
        console.error(`Error disposing quad renderer ${index}:`, error)
      }
    }
  })
  
  // 清理控制器
  quadControls.forEach((control, index) => {
    if (control) {
      try {
        control.dispose()
        console.log(`Disposed quad control ${index}`)
      } catch (error) {
        console.error(`Error disposing quad control ${index}:`, error)
      }
    }
  })
  
  // 重置数组
  quadRenderers.length = 0
  quadCameras.length = 0
  quadControls.length = 0
  
  console.log('All quad view resources disposed')
}

// 同步四视角相机与主相机的某些属性（如FOV变化）
const syncQuadCameras = () => {
  if (!camera || quadCameras.length === 0) return
  
  quadCameras.forEach((quadCamera) => {
    if (quadCamera) {
      // 同步FOV和投影矩阵
      quadCamera.fov = camera.fov
      quadCamera.updateProjectionMatrix()
    }
  })
}

// 标准化角度到 0-2π 范围
const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += Math.PI * 2
  while (angle >= Math.PI * 2) angle -= Math.PI * 2
  return angle
}

// 重新初始化四视角（用于视频切换或其他需要重置的情况）
const reinitQuadViews = async () => {
  if (showQuadView.value) {
    disposeQuadViews()
    await new Promise(resolve => setTimeout(resolve, 100))
    await initQuadViews()
  }
}

// 调试函数
const testSwitchView = (index: number) => {
  console.log(`=== 测试切换到视角 ${index} ===`)
  switchToQuadView(index)
}

const logCameraState = () => {
  if (!camera) {
    console.log('Camera not available')
    return
  }
  
  console.log('=== 相机状态详情 ===')
  console.log(`位置: x=${camera.position.x.toFixed(3)}, y=${camera.position.y.toFixed(3)}, z=${camera.position.z.toFixed(3)}`)
  console.log(`旋转: x=${camera.rotation.x.toFixed(3)}, y=${camera.rotation.y.toFixed(3)}, z=${camera.rotation.z.toFixed(3)}`)
  console.log(`旋转(度): x=${(camera.rotation.x * 180 / Math.PI).toFixed(1)}°, y=${(camera.rotation.y * 180 / Math.PI).toFixed(1)}°, z=${(camera.rotation.z * 180 / Math.PI).toFixed(1)}°`)
  console.log(`FOV: ${camera.fov}°`)
  
  if (controls) {
    console.log(`控制器启用: ${controls.enabled}`)
    console.log(`控制器目标: x=${controls.target.x.toFixed(3)}, y=${controls.target.y.toFixed(3)}, z=${controls.target.z.toFixed(3)}`)
  }
  
  console.log(`激活视角: ${activeQuadView.value} (${quadViews.value[activeQuadView.value]?.label || 'None'})`)
  console.log('==================')
}

const resetCameraManually = () => {
  if (!camera || !controls) {
    console.log('Camera or controls not available')
    return
  }
  
  console.log('=== 手动重置相机 ===')
  
  // 重置相机
  camera.position.set(0, 0, 1)
  camera.rotation.set(0, 0, 0)
  camera.updateMatrixWorld(true)
  
  // 重置控制器
  controls.target.set(0, 0, 0)
  controls.update()
  
  // 重置激活视角
  activeQuadView.value = 0
  
  console.log('相机已重置到初始状态')
  ElMessage.success('相机已重置')
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
    
    // 同步四视角相机FOV
    syncQuadCameras()
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
    case 'KeyQ':
      event.preventDefault()
      if (showQuadView.value) switchToQuadView(0) // 正面
      break
    case 'KeyW':
      event.preventDefault()
      if (showQuadView.value) switchToQuadView(1) // 右侧
      break
    case 'KeyE':
      event.preventDefault()
      if (showQuadView.value) switchToQuadView(2) // 背面
      break
    case 'KeyR':
      event.preventDefault()
      if (event.shiftKey) {
        toggleAutoRotate()
      } else if (event.ctrlKey && showQuadView.value) {
        switchToQuadView(3) // 左侧
      } else {
        resetView()
      }
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
  
  // 清理四视角资源
  disposeQuadViews()
  
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

/* 顶部状态栏样式 */
.top-status-bar {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.status-info {
  display: flex;
  align-items: center;
}

/* 底部控制栏样式 */
.bottom-controls {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
}

/* 第一行：播放控制和进度条 */
.playback-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.quick-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 第二行：详细工具栏 */
.toolbar-row {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.media-controls,
.view-controls,
.zoom-controls,
.function-controls,
.management-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.media-controls {
  padding: 6px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.control-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.volume-text {
  font-size: 11px;
  color: #9ca3af;
  min-width: 30px;
}

.ml-4 {
  margin-left: 16px;
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
  color: #6b7280;
  min-width: 45px;
  text-align: center;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.progress-container {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.progress-slider {
  width: 100%;
}

.progress-slider :deep(.el-slider__runway) {
  height: 6px;
  background-color: #f0f2f5;
  border-radius: 3px;
}

.progress-slider :deep(.el-slider__bar) {
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  border-radius: 3px;
}

.progress-slider :deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  border: 2px solid #409eff;
  background-color: white;
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

/* 设置面板样式 */
.settings-content {
  padding: 16px 0;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.setting-group .el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 视频列表样式 */
.video-list-content {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.current-video-info {
  margin-bottom: 24px;
}

.current-video-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.video-info-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.video-thumbnail {
  flex-shrink: 0;
}

.video-thumbnail canvas {
  border-radius: 4px;
  background: #000;
}

.video-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.video-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.video-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 12px;
}

.video-list {
  flex: 1;
  margin-bottom: 16px;
}

.video-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.video-list-items {
  max-height: 400px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.video-item:hover {
  background: #f0f0f0;
}

.video-item.active {
  background: #e6f7ff;
  border: 1px solid #1890ff;
}

.video-item-index {
  width: 24px;
  height: 24px;
  background: #666;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.video-item.active .video-item-index {
  background: #1890ff;
}

.video-item-info {
  flex: 1;
  min-width: 0;
}

.video-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-item-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 12px;
}

.video-item-actions {
  flex-shrink: 0;
}

.add-video-section {
  padding-top: 16px;
  border-top: 1px solid #eee;
}

/* 调试控制样式 */
.debug-controls {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #333;
}

.debug-controls h5 {
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 12px;
}

.debug-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.debug-buttons .el-button {
  font-size: 11px;
  padding: 4px 8px;
}

/* 主视角容器样式 */
.main-viewer-container {
  flex: 1;
  position: relative;
}

/* 四视角浮动面板样式 */
.quad-view-overlay {
  position: absolute;
  top: 50px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 280px;
}

.quad-view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quad-view-title {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.quad-views-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.quad-view-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
}

.quad-view-item:hover {
  border-color: #409EFF;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.quad-view-item.active {
  border-color: #67C23A;
  box-shadow: 0 4px 16px rgba(103, 194, 58, 0.4);
  background: rgba(103, 194, 58, 0.1);
}

.quad-canvas {
  width: 120px;
  height: 90px;
  display: block;
  background: #000;
  border-radius: 6px;
}

.quad-view-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 6px 4px 4px;
  font-weight: 500;
  border-radius: 0 0 6px 6px;
}

/* 响应式设计 */
/* 新的响应式设计 */
@media (max-width: 1024px) {
  .toolbar-group {
    gap: 16px;
  }
  
  .volume-control {
    padding: 2px 6px;
  }
}

@media (max-width: 768px) {
  .top-status-bar {
    padding: 6px 12px;
  }
  
  .video-title {
    font-size: 13px;
  }
  
  .bottom-controls {
    padding: 12px;
  }
  
  .playback-row {
    gap: 12px;
    margin-bottom: 10px;
  }
  
  .playback-controls {
    gap: 6px;
  }
  
  .progress-section {
    gap: 8px;
  }
  
  .time-display {
    font-size: 11px;
    min-width: 38px;
  }
  
  .quick-controls {
    gap: 6px;
  }
  
  .toolbar-row {
    padding-top: 10px;
  }
  
  .toolbar-group {
    gap: 16px;
    justify-content: space-around;
  }
  
  .media-controls,
  .view-controls,
  .zoom-controls,
  .function-controls,
  .management-controls {
    gap: 6px;
  }
  
  .media-controls {
    padding: 4px 8px;
  }
  
  .control-label {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .playback-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .progress-section {
    width: 100%;
    order: 2;
  }
  
  .playback-controls {
    order: 1;
    justify-content: center;
  }
  
  .quick-controls {
    order: 3;
    justify-content: center;
  }
  
  .toolbar-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .media-controls {
    width: 100%;
    justify-content: space-around;
  }
}

@media (max-width: 1200px) {
  .quad-view-overlay {
    min-width: 240px;
  }
  
  .quad-canvas {
    width: 100px;
    height: 75px;
  }
}

@media (max-width: 768px) {
  .quad-view-overlay {
    top: 60px;
    left: 10px;
    right: 10px;
    min-width: auto;
    padding: 12px;
  }
  
  .quad-views-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .quad-canvas {
    width: 80px;
    height: 60px;
  }
  
  .quad-view-title {
    font-size: 12px;
  }
  
  .quad-view-label {
    font-size: 10px;
    padding: 4px 2px 2px;
  }
  
  .quad-view-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }
}
</style>
