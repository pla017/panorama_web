import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface PanoramaVideoViewer {
  play: () => void
  pause: () => void
  seekTo: (time: number) => void
  seekToImmediate: (time: number) => void
  setAutoRotate: (enabled: boolean) => void
  rotate: (deltaX: number, deltaY: number) => void
  zoom: (delta: number) => void
  resetView: () => void
  dispose: () => void
  onLoadedMetadata?: (duration: number, width: number, height: number) => void
  onTimeUpdate?: (currentTime: number) => void
  onError?: (error: string) => void
}

export async function initPanoramaVideoViewer(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  videoUrl: string
): Promise<PanoramaVideoViewer> {
  // 创建场景、相机、渲染器
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  )
  
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true 
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000)

  // 创建视频元素
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.loop = false
  video.muted = true // 默认静音以避免自动播放限制
  video.playsInline = true

  // 创建球体几何体 (用于全景视频)
  const geometry = new THREE.SphereGeometry(500, 60, 40)
  geometry.scale(-1, 1, 1) // 翻转以在内部显示

  // 创建视频纹理
  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter
  videoTexture.format = THREE.RGBAFormat

  // 创建材质和网格
  const material = new THREE.MeshBasicMaterial({ map: videoTexture })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // 设置相机初始位置
  camera.position.set(0, 0, 1)

  // 创建轨道控制器
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = true
  controls.enablePan = false
  controls.rotateSpeed = -0.5 // 负值以匹配全景浏览的直觉
  controls.minDistance = 1
  controls.maxDistance = 100
  controls.autoRotate = false
  controls.autoRotateSpeed = 2.0

  // 控制变量
  let animationId: number
  let isDisposed = false

  // 回调函数
  let onLoadedMetadata: ((duration: number, width: number, height: number) => void) | undefined
  let onTimeUpdate: ((currentTime: number) => void) | undefined
  let onError: ((error: string) => void) | undefined

  // 视频事件处理
  const handleLoadedMetadata = () => {
    console.log('视频元数据加载完成:', {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight
    })
    
    if (onLoadedMetadata) {
      onLoadedMetadata(video.duration, video.videoWidth, video.videoHeight)
    }
  }

  const handleTimeUpdate = () => {
    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime)
    }
  }

  const handleError = (event: Event) => {
    console.error('视频加载错误:', event)
    const errorMsg = video.error ? 
      `视频错误 (${video.error.code}): ${getVideoErrorMessage(video.error.code)}` : 
      '未知视频错误'
    
    if (onError) {
      onError(errorMsg)
    }
  }

  const handleCanPlay = () => {
    console.log('视频可以播放')
  }

  // 绑定视频事件
  video.addEventListener('loadedmetadata', handleLoadedMetadata)
  video.addEventListener('timeupdate', handleTimeUpdate)
  video.addEventListener('error', handleError)
  video.addEventListener('canplay', handleCanPlay)

  // 窗口大小变化处理
  const handleResize = () => {
    if (isDisposed) return
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // 动画循环
  const animate = () => {
    if (isDisposed) return
    
    animationId = requestAnimationFrame(animate)
    
    controls.update()
    renderer.render(scene, camera)
  }

  // 加载视频
  const loadVideo = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        video.removeEventListener('canplay', handleLoad)
        video.removeEventListener('error', handleLoadError)
        resolve()
      }

      const handleLoadError = () => {
        video.removeEventListener('canplay', handleLoad)
        video.removeEventListener('error', handleLoadError)
        reject(new Error('视频加载失败'))
      }

      video.addEventListener('canplay', handleLoad)
      video.addEventListener('error', handleLoadError)
      
      video.src = videoUrl
      video.load()
    })
  }

  // API 方法
  const play = () => {
    if (video.paused) {
      video.play().catch(error => {
        console.error('播放失败:', error)
        if (onError) {
          onError('播放失败: ' + error.message)
        }
      })
    }
  }

  const pause = () => {
    if (!video.paused) {
      video.pause()
    }
  }

  const seekTo = (time: number) => {
    if (video.duration && time >= 0 && time <= video.duration) {
      video.currentTime = time
    }
  }

  const seekToImmediate = (time: number) => {
    if (video.duration && time >= 0 && time <= video.duration) {
      video.currentTime = time
      // 立即更新视频纹理
      videoTexture.needsUpdate = true
      // 立即渲染一帧
      renderer.render(scene, camera)
    }
  }

  const setAutoRotate = (enabled: boolean) => {
    controls.autoRotate = enabled
  }

  const rotate = (deltaX: number, deltaY: number) => {
    // 通过调整相机旋转角度实现旋转
    const spherical = new THREE.Spherical()
    spherical.setFromVector3(camera.position)
    spherical.theta += deltaX
    spherical.phi += deltaY
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    camera.position.setFromSpherical(spherical)
    camera.lookAt(0, 0, 0)
  }

  const zoom = (delta: number) => {
    // 通过调整相机位置实现缩放
    const direction = camera.getWorldDirection(new THREE.Vector3())
    camera.position.add(direction.multiplyScalar(delta * 10))
    
    // 限制缩放范围
    const distance = camera.position.length()
    if (distance < 1) {
      camera.position.normalize().multiplyScalar(1)
    } else if (distance > 100) {
      camera.position.normalize().multiplyScalar(100)
    }
  }

  const resetView = () => {
    camera.position.set(0, 0, 1)
    camera.lookAt(0, 0, 0)
    controls.reset()
  }

  const dispose = () => {
    isDisposed = true
    
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    
    // 清理视频
    video.pause()
    video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    video.removeEventListener('timeupdate', handleTimeUpdate)
    video.removeEventListener('error', handleError)
    video.removeEventListener('canplay', handleCanPlay)
    video.src = ''
    video.load()
    
    // 清理Three.js资源
    geometry.dispose()
    material.dispose()
    videoTexture.dispose()
    renderer.dispose()
    controls.dispose()
    
    // 清理事件监听
    window.removeEventListener('resize', handleResize)
  }

  // 初始化
  window.addEventListener('resize', handleResize)
  
  try {
    await loadVideo()
    animate()
  } catch (error) {
    console.error('视频加载失败:', error)
    if (onError) {
      onError('视频加载失败')
    }
  }

  return {
    play,
    pause,
    seekTo,
    seekToImmediate,
    setAutoRotate,
    rotate,
    zoom,
    resetView,
    dispose,
    get onLoadedMetadata() { return onLoadedMetadata },
    set onLoadedMetadata(callback) { onLoadedMetadata = callback },
    get onTimeUpdate() { return onTimeUpdate },
    set onTimeUpdate(callback) { onTimeUpdate = callback },
    get onError() { return onError },
    set onError(callback) { onError = callback }
  }
}

// 获取视频错误信息
function getVideoErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return '视频加载被中止'
    case 2:
      return '网络错误'
    case 3:
      return '视频解码错误'
    case 4:
      return '视频格式不支持'
    default:
      return '未知错误'
  }
}
