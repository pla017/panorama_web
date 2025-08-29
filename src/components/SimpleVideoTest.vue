<template>
  <div class="video-test">
    <h2>视频文件测试</h2>
    
    <div class="test-section">
      <h3>1. 直接HTML视频标签测试</h3>
      <video 
        ref="testVideo"
        controls 
        width="400" 
        height="200"
        @loadedmetadata="onLoadedMetadata"
        @error="onVideoError"
        @canplay="onCanPlay"
        @loadstart="onLoadStart"
      >
        <source src="/Out/stitched_output.mp4" type="video/mp4">
        您的浏览器不支持视频标签。
      </video>
      
      <div class="video-info">
        <p><strong>状态:</strong> {{ videoStatus }}</p>
        <p><strong>错误:</strong> {{ videoError || '无' }}</p>
        <p><strong>时长:</strong> {{ videoDuration }}秒</p>
        <p><strong>分辨率:</strong> {{ videoWidth }}x{{ videoHeight }}</p>
      </div>
    </div>

    <div class="test-section">
      <h3>2. 文件访问测试</h3>
      <el-button @click="testFileAccess">测试文件访问</el-button>
      <p><strong>文件访问结果:</strong> {{ fileAccessResult }}</p>
    </div>

    <div class="test-section">
      <h3>3. Three.js VideoTexture 测试</h3>
      <el-button @click="testVideoTexture">测试VideoTexture</el-button>
      <canvas ref="testCanvas" width="400" height="200" style="border: 1px solid #ccc;"></canvas>
      <p><strong>VideoTexture状态:</strong> {{ textureStatus }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'

// 响应式数据
const testVideo = ref<HTMLVideoElement>()
const testCanvas = ref<HTMLCanvasElement>()

const videoStatus = ref('未开始')
const videoError = ref('')
const videoDuration = ref(0)
const videoWidth = ref(0)
const videoHeight = ref(0)
const fileAccessResult = ref('未测试')
const textureStatus = ref('未测试')

// 视频事件处理
const onLoadStart = () => {
  videoStatus.value = '开始加载'
  console.log('视频开始加载')
}

const onLoadedMetadata = () => {
  videoStatus.value = '元数据已加载'
  if (testVideo.value) {
    videoDuration.value = testVideo.value.duration
    videoWidth.value = testVideo.value.videoWidth
    videoHeight.value = testVideo.value.videoHeight
  }
  console.log('视频元数据已加载')
}

const onCanPlay = () => {
  videoStatus.value = '可以播放'
  console.log('视频可以播放')
}

const onVideoError = (event: Event) => {
  videoStatus.value = '加载错误'
  const video = event.target as HTMLVideoElement
  if (video.error) {
    videoError.value = `错误代码: ${video.error.code}, 消息: ${video.error.message || '未知错误'}`
  }
  console.error('视频加载错误:', event)
}

// 文件访问测试
const testFileAccess = async () => {
  try {
    fileAccessResult.value = '测试中...'
    const response = await fetch('/Out/stitched_output.mp4', { method: 'HEAD' })
    if (response.ok) {
      const contentLength = response.headers.get('content-length')
      const contentType = response.headers.get('content-type')
      fileAccessResult.value = `成功 - 大小: ${contentLength || '未知'} bytes, 类型: ${contentType || '未知'}`
    } else {
      fileAccessResult.value = `失败 - HTTP ${response.status}: ${response.statusText}`
    }
  } catch (error) {
    fileAccessResult.value = `失败 - ${error}`
    console.error('文件访问测试失败:', error)
  }
}

// VideoTexture 测试
const testVideoTexture = () => {
  if (!testCanvas.value) return
  
  textureStatus.value = '测试中...'
  
  try {
    // 创建场景和渲染器
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ canvas: testCanvas.value })
    renderer.setSize(400, 200)

    // 创建视频元素
    const video = document.createElement('video')
    video.src = '/Out/stitched_output.mp4'
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.loop = true

    video.addEventListener('canplay', () => {
      textureStatus.value = '视频可播放，创建纹理中...'
      
      try {
        // 创建视频纹理
        const videoTexture = new THREE.VideoTexture(video)
        videoTexture.minFilter = THREE.LinearFilter
        videoTexture.magFilter = THREE.LinearFilter

        // 创建平面几何体和材质
        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.MeshBasicMaterial({ map: videoTexture })
        const plane = new THREE.Mesh(geometry, material)
        scene.add(plane)

        // 渲染
        renderer.render(scene, camera)
        textureStatus.value = '成功 - VideoTexture 创建并渲染成功'
        
        // 播放视频
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
        })
        
        // 动画循环
        const animate = () => {
          requestAnimationFrame(animate)
          renderer.render(scene, camera)
        }
        animate()
        
      } catch (error) {
        textureStatus.value = `失败 - VideoTexture创建失败: ${error}`
        console.error('VideoTexture创建失败:', error)
      }
    })

    video.addEventListener('error', (event) => {
      textureStatus.value = `失败 - 视频加载失败: ${video.error?.message || '未知错误'}`
      console.error('VideoTexture测试中视频加载失败:', event)
    })

    video.load()
    
  } catch (error) {
    textureStatus.value = `失败 - ${error}`
    console.error('VideoTexture测试失败:', error)
  }
}

onMounted(() => {
  // 自动开始文件访问测试
  testFileAccess()
})
</script>

<style scoped>
.video-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

.video-info {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.video-info p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
