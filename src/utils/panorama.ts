import * as THREE from 'three'

export interface PanoramaViewer {
  loadScene: (imageUrl: string) => Promise<void>
  setAutoRotate: (enabled: boolean) => void
  rotate: (deltaX: number, deltaY: number) => void
  zoom: (delta: number) => void
  resetView: () => void
  dispose: () => void
}

export async function initPanoramaViewer(
  canvas: HTMLCanvasElement,
  container: HTMLElement
): Promise<PanoramaViewer> {
  // 场景、相机、渲染器
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

  // 创建球体几何体
  const geometry = new THREE.SphereGeometry(500, 60, 40)
  // 翻转几何体，使纹理在内部显示
  geometry.scale(-1, 1, 1)

  let material: THREE.MeshBasicMaterial
  let mesh: THREE.Mesh

  // 控制变量
  let autoRotate = false
  let rotationSpeed = 0.001
  
  // 相机控制
  const cameraTarget = new THREE.Vector3()
  let phi = 0 // 垂直角度
  let theta = 0 // 水平角度
  let radius = 1 // 缩放
  
  const minRadius = 0.1
  const maxRadius = 2

  // 加载纹理
  const loadScene = async (imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader()
      loader.load(
        imageUrl,
        (texture) => {
          // 移除旧的网格
          if (mesh) {
            scene.remove(mesh)
            material?.dispose()
          }
          
          // 创建新材质和网格
          material = new THREE.MeshBasicMaterial({ map: texture })
          mesh = new THREE.Mesh(geometry, material)
          scene.add(mesh)
          
          resolve()
        },
        undefined,
        (error) => {
          console.error('纹理加载失败:', error)
          reject(error)
        }
      )
    })
  }

  // 设置自动旋转
  const setAutoRotate = (enabled: boolean) => {
    autoRotate = enabled
  }

  // 手动旋转
  const rotate = (deltaX: number, deltaY: number) => {
    theta += deltaX
    phi += deltaY
    phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, phi))
    updateCamera()
  }

  // 缩放
  const zoom = (delta: number) => {
    radius += delta
    radius = Math.max(minRadius, Math.min(maxRadius, radius))
    updateCamera()
  }

  // 重置视角
  const resetView = () => {
    theta = 0
    phi = 0
    radius = 1
    updateCamera()
  }

  // 更新相机位置
  const updateCamera = () => {
    cameraTarget.x = radius * Math.sin(theta) * Math.cos(phi)
    cameraTarget.y = radius * Math.sin(phi)
    cameraTarget.z = radius * Math.cos(theta) * Math.cos(phi)
    
    camera.position.copy(cameraTarget)
    camera.lookAt(0, 0, 0)
  }

  // 处理窗口大小变化
  const handleResize = () => {
    const width = container.clientWidth
    const height = container.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate)
    
    // 自动旋转
    if (autoRotate) {
      theta += rotationSpeed
      updateCamera()
    }
    
    renderer.render(scene, camera)
  }

  // 清理资源
  const dispose = () => {
    geometry.dispose()
    if (material) material.dispose()
    if (mesh) scene.remove(mesh)
    renderer.dispose()
    window.removeEventListener('resize', handleResize)
  }

  // 初始化
  window.addEventListener('resize', handleResize)
  updateCamera()
  animate()

  // 加载默认场景（使用纯色作为占位）
  const canvas2D = document.createElement('canvas')
  canvas2D.width = 1024
  canvas2D.height = 512
  const ctx = canvas2D.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas2D.height)
  gradient.addColorStop(0, '#87CEEB') // 天空蓝
  gradient.addColorStop(1, '#98FB98') // 淡绿色
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas2D.width, canvas2D.height)
  
  const texture = new THREE.CanvasTexture(canvas2D)
  material = new THREE.MeshBasicMaterial({ map: texture })
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  return {
    loadScene,
    setAutoRotate,
    rotate,
    zoom,
    resetView,
    dispose
  }
}
