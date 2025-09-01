<template>
  <div class="analyzer-app">
    <!-- 顶部导航栏 -->
    <div class="top-navbar">
      <div class="navbar-left">
        <div class="logo">
          <span class="logo-text">ANALYZER</span>
        </div>
      </div>
      <div class="navbar-center">
        <div class="view-tabs">
          <div
            :class="['tab-item', { active: activeTab === 'unfoldingView' }]"
            @click="activeTab = 'unfoldingView'"
          >
            UNFOLDING VIEW
          </div>
          <div
            :class="['tab-item', { active: activeTab === '3dModel' }]"
            @click="activeTab = '3dModel'"
          >
            3D MODEL
          </div>
        </div>
        <div class="project-selector">
          <el-select
            v-model="selectedProject"
            placeholder="Project2"
            size="small"
          >
            <el-option label="Project1" value="project1" />
            <el-option label="Project2" value="project2" />
            <el-option label="Project3" value="project3" />
          </el-select>
        </div>
      </div>
      <div class="navbar-right">
        <span class="panorama-label">全景视频</span>
        <el-button size="small" text>
          <el-icon><Menu /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-layout">
      <!-- 左侧3D模型区域 -->
      <div class="left-panel">
        <!-- 3D工具栏 -->
        <div class="model-toolbar">
          <div class="toolbar-group">
            <el-button size="small" circle>
              <el-icon><Position /></el-icon>
            </el-button>
            <el-button size="small" circle>
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button size="small" circle>
              <el-icon><View /></el-icon>
            </el-button>
            <el-button
              size="small"
              circle
              @click="loadMeshModel"
              :loading="loadingMesh"
            >
              <el-icon><Box /></el-icon>
            </el-button>
            <el-button size="small" circle>
              <el-icon><Compass /></el-icon>
            </el-button>
            <el-button size="small" circle>
              <el-icon><FullScreen /></el-icon>
            </el-button>
            <el-button size="small" circle>
              <el-icon><Setting /></el-icon>
            </el-button>
          </div>
          <div class="toolbar-group">
            <el-button
              size="small"
              @click="loadPointCloud"
              :loading="loadingPoints"
            >
              点云
            </el-button>
            <el-button size="small" @click="resetView"> 重置 </el-button>
          </div>
        </div>

        <!-- 3D模型渲染区域 -->
        <div class="model-viewer-container">
          <div ref="modelContainer" class="model-container">
            <canvas ref="modelCanvas" class="model-canvas"></canvas>

            <!-- 加载状态 -->
            <div v-if="loadingMesh || loadingPoints" class="loading-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>{{ loadingMesh ? "加载网格模型..." : "加载点云..." }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧全景视频区域 -->
      <div class="right-panel">
        <div class="panorama-section">
          <div class="panorama-header">
            <div class="section-title">
              <span>全景视频</span>
            </div>
            <div class="panorama-controls">
              <el-button size="small" text>
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="panorama-viewer-wrapper">
            <SimplePanoramaViewer />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { ElMessage } from "element-plus";
import {
  Box,
  Loading,
  Menu,
  Position,
  CopyDocument,
  View,
  Compass,
  FullScreen,
  Setting,
} from "@element-plus/icons-vue";
import SimplePanoramaViewer from "./SimplePanoramaViewer.vue";

// 3D场景相关
const modelContainer = ref<HTMLDivElement>();
const modelCanvas = ref<HTMLCanvasElement>();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;

// 模型状态
const loadingMesh = ref(false);
const loadingPoints = ref(false);

// UI状态
const activeTab = ref("3dModel");
const selectedProject = ref("project2");






// 当前加载的模型
let currentMesh: THREE.Mesh | null = null;
let currentPointCloud: THREE.Points | null = null;

// 视图控制函数
const resetView = () => {
  if (controls && camera) {
    // 重置相机位置
    camera.position.set(5, 5, 5);
    controls.target.set(0, 0, 0);
    controls.update();
  }
};

// 3D模型相关函数
const initScene = () => {
  if (!modelContainer.value || !modelCanvas.value) return;

  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // 创建相机
  const aspect =
    modelContainer.value.clientWidth / modelContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(5, 5, 5);

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: modelCanvas.value,
    antialias: true,
  });
  renderer.setSize(
    modelContainer.value.clientWidth,
    modelContainer.value.clientHeight
  );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 创建控制器
  controls = new OrbitControls(camera, modelCanvas.value);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // 添加网格辅助线
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);

  // 开始渲染循环
  animate();
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

const loadMeshModel = async () => {
  loadingMesh.value = true;
  try {
    const loader = new PLYLoader();
    const geometry = await new Promise<THREE.BufferGeometry>(
      (resolve, reject) => {
        loader.load("/Out/mesh.ply", resolve, undefined, reject);
      }
    );

    if (currentMesh) {
      scene.remove(currentMesh);
    }

    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    const material = new THREE.MeshLambertMaterial({
      color: geometry.attributes.color ? 0xffffff : 0x00aa00,
      vertexColors: !!geometry.attributes.color,
      side: THREE.DoubleSide,
    });

    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);

    // 调整相机位置
    const box = new THREE.Box3().setFromObject(currentMesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      camera.position.copy(center);
      camera.position.x += maxDim * 1.5;
      camera.position.y += maxDim * 1.5;
      camera.position.z += maxDim * 1.5;
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    }

    ElMessage.success("网格模型加载完成！");
  } catch (error) {
    ElMessage.error(`网格模型加载失败: ${error}`);
  } finally {
    loadingMesh.value = false;
  }
};

const loadPointCloud = async () => {
  loadingPoints.value = true;
  try {
    const loader = new PLYLoader();
    const geometry = await new Promise<THREE.BufferGeometry>(
      (resolve, reject) => {
        loader.load("/Out/sparse_point.ply", resolve, undefined, reject);
      }
    );

    if (currentPointCloud) {
      scene.remove(currentPointCloud);
    }

    const material = new THREE.PointsMaterial({
      color: geometry.attributes.color ? 0xffffff : 0xff4444,
      vertexColors: !!geometry.attributes.color,
      size: 0.05,
      sizeAttenuation: true,
    });

    currentPointCloud = new THREE.Points(geometry, material);
    scene.add(currentPointCloud);

    // 调整相机位置
    const box = new THREE.Box3().setFromObject(currentPointCloud);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      camera.position.copy(center);
      camera.position.x += maxDim * 1.5;
      camera.position.y += maxDim * 1.5;
      camera.position.z += maxDim * 1.5;
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    }

    ElMessage.success("点云加载完成！");
  } catch (error) {
    ElMessage.error(`点云加载失败: ${error}`);
  } finally {
    loadingPoints.value = false;
  }
};

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (controls) {
    controls.dispose();
  }

  if (renderer) {
    renderer.dispose();
  }
};

onMounted(() => {
  nextTick(() => {
    initScene();
    // 默认加载网格模型
    setTimeout(() => {
      loadMeshModel();
    }, 1000);
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.analyzer-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* 顶部导航栏 */
.top-navbar {
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-left .logo-text {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
}

.navbar-center {
  display: flex;
  align-items: center;
  gap: 32px;
}

.view-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.tab-item {
  padding: 8px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab-item.active {
  background: #ffd700;
  color: #333;
}

.project-selector {
  min-width: 120px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.panorama-label {
  font-size: 14px;
  font-weight: 500;
}

/* 主要布局 */
.main-layout {
  flex: 1;
  display: flex;
  gap: 8px;
  padding: 8px;
  min-height: 0;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 3D工具栏 */
.model-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e1e4e8;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 3D模型查看器 */
.model-viewer-container {
  flex: 1;
  position: relative;
  background: #f8f9fa;
}

.model-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.model-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 全景视频区域 */
.panorama-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panorama-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e1e4e8;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.panorama-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panorama-viewer-wrapper {
  flex: 1;
  position: relative;
  min-height: 400px;
  background: #000;
  border-radius: 0 0 8px 8px;
}







/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-overlay p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.is-loading {
  font-size: 24px;
  color: #409eff;
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

/* 响应式调整 */
@media (max-width: 1200px) {
  .main-layout {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    flex: none;
  }

  .left-panel {
    height: 50vh;
  }

  .right-panel {
    height: 50vh;
  }
  
  .panorama-viewer-wrapper {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .navbar-center {
    gap: 16px;
  }

  .view-tabs .tab-item {
    padding: 6px 12px;
    font-size: 12px;
  }

  .section-controls {
    flex-wrap: wrap;
    gap: 8px;
  }

  .search-input {
    width: 150px;
  }


}
</style>
