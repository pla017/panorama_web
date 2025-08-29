import * as THREE from 'three'

export interface ThreeDemo {
  startRotation: () => void
  stopRotation: () => void
  changeColor: () => void
  dispose: () => void
}

export function initThreeDemo(canvas: HTMLCanvasElement): ThreeDemo {
  // 创建场景、相机、渲染器
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75, 
    canvas.clientWidth / canvas.clientHeight, 
    0.1, 
    1000
  )
  
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true 
  })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x222222)

  // 创建几何体和材质
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  let material = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    shininess: 100 
  })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // 设置相机位置
  camera.position.z = 5

  // 控制变量
  let isRotating = false
  let animationId: number

  // 颜色数组
  const colors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
  let colorIndex = 0

  // 动画函数
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    if (isRotating) {
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    }
    
    renderer.render(scene, camera)
  }

  // 开始旋转
  const startRotation = () => {
    isRotating = true
  }

  // 停止旋转
  const stopRotation = () => {
    isRotating = false
  }

  // 改变颜色
  const changeColor = () => {
    colorIndex = (colorIndex + 1) % colors.length
    material.color.setHex(colors[colorIndex])
  }

  // 处理窗口大小变化
  const handleResize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // 清理资源
  const dispose = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    window.removeEventListener('resize', handleResize)
  }

  // 初始化
  window.addEventListener('resize', handleResize)
  animate()

  return {
    startRotation,
    stopRotation,
    changeColor,
    dispose
  }
}
