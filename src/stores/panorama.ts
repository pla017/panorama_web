import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Scene, Camera, WebGLRenderer } from 'three'

export interface PanoramaScene {
  id: string
  name: string
  imageUrl: string
  description?: string
}

export const usePanoramaStore = defineStore('panorama', () => {
  // Three.js 相关状态
  const scene = ref<Scene | null>(null)
  const camera = ref<Camera | null>(null)
  const renderer = ref<WebGLRenderer | null>(null)
  
  // 全景场景数据
  const scenes = ref<PanoramaScene[]>([
    {
      id: '1',
      name: '客厅',
      imageUrl: '/images/panorama/living-room.jpg',
      description: '现代简约客厅'
    },
    {
      id: '2',
      name: '卧室',
      imageUrl: '/images/panorama/bedroom.jpg',
      description: '温馨卧室'
    }
  ])
  
  const currentSceneId = ref<string>('1')
  const isLoading = ref(false)
  const autoRotate = ref(true)
  const rotationSpeed = ref(0.001)

  // 方法
  const setThreeJsInstances = (
    sceneInstance: Scene,
    cameraInstance: Camera,
    rendererInstance: WebGLRenderer
  ) => {
    scene.value = sceneInstance
    camera.value = cameraInstance
    renderer.value = rendererInstance
  }

  const setCurrentScene = (sceneId: string) => {
    const targetScene = scenes.value.find(s => s.id === sceneId)
    if (targetScene) {
      currentSceneId.value = sceneId
    }
  }

  const addScene = (newScene: PanoramaScene) => {
    scenes.value.push(newScene)
  }

  const removeScene = (sceneId: string) => {
    const index = scenes.value.findIndex(s => s.id === sceneId)
    if (index > -1) {
      scenes.value.splice(index, 1)
      // 如果删除的是当前场景，切换到第一个场景
      if (currentSceneId.value === sceneId && scenes.value.length > 0) {
        currentSceneId.value = scenes.value[0].id
      }
    }
  }

  const toggleAutoRotate = () => {
    autoRotate.value = !autoRotate.value
  }

  const setRotationSpeed = (speed: number) => {
    rotationSpeed.value = speed
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // 状态
    scene,
    camera,
    renderer,
    scenes,
    currentSceneId,
    isLoading,
    autoRotate,
    rotationSpeed,
    // 方法
    setThreeJsInstances,
    setCurrentScene,
    addScene,
    removeScene,
    toggleAutoRotate,
    setRotationSpeed,
    setLoading
  }
})
