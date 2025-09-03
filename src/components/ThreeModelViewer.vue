<template>
  <div class="model-viewer-container">
    <!-- 顶部工具栏 -->
    <div class="model-toolbar" @click.stop>
      <div class="toolbar-left">
        <button class="tool-btn" @click="resetView" title="重置视角">重置</button>
        <button class="tool-btn" @click="toggleGrid" :class="{ active: gridVisible }" title="网格">网格</button>
        <button class="tool-btn" @click="toggleWireframe" :class="{ active: wireframeEnabled }" title="线框">线框</button>
        <button class="tool-btn" @click="reloadModel" title="重新加载">重载</button>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" @click="toggleSettings" title="更多设置">设置</button>
        <button class="tool-btn" @click="toggleFullscreen" title="全屏">全屏</button>

        <!-- 悬浮设置面板 -->
        <div v-if="showSettings" class="settings-popover" @click.stop>
          <div class="settings-section">
            <div class="section-title">视角预设</div>
            <div class="preset-row">
              <button class="preset-btn" @click="setTopView">顶视图</button>
              <button class="preset-btn" @click="setInsideBottomView">底视图</button>
              <button class="preset-btn" @click="setSideView">侧视图</button>
            </div>
          </div>
          <div class="settings-section">
            <div class="section-title">透明度</div>
            <div class="slider-row">
              <input class="slider" type="range" min="0.1" max="1" step="0.05" v-model.number="opacity" @input="applyOpacity" />
              <span class="slider-value">{{ opacity.toFixed(2) }}</span>
            </div>
          </div>
          <div class="settings-section">
            <div class="section-title">亮度</div>
            <div class="slider-row">
              <input class="slider" type="range" min="0.2" max="2" step="0.05" v-model.number="brightness" @input="applyBrightness" />
              <span class="slider-value">{{ brightness.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="modelContainer" class="model-container">
      <canvas ref="modelCanvas" class="model-canvas"></canvas>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { ElMessage } from "element-plus";

const props = withDefaults(defineProps<{
  modelUrl?: string;
  background?: number;
}>(), {
  modelUrl: "/Out/mesh.ply",
  background: 0xf0f0f0,
});

const modelContainer = ref<HTMLDivElement>();
const modelCanvas = ref<HTMLCanvasElement>();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;
let currentMesh: THREE.Mesh | null = null;
let gridHelper: THREE.GridHelper | null = null;
let ambientLight: THREE.AmbientLight | null = null;
let dirLight: THREE.DirectionalLight | null = null;

const gridVisible = ref(true);
const wireframeEnabled = ref(false);
const opacity = ref(1);
const brightness = ref(1);
const showSettings = ref(false);

// 点击外部关闭设置面板
const handleClickOutside = () => { showSettings.value = false };

// 缓存模型包围盒中心与尺寸，方便视角预设使用
const modelCenter = new THREE.Vector3();
const modelSize = new THREE.Vector3();

const initScene = () => {
  if (!modelContainer.value || !modelCanvas.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.background);

  const aspect = modelContainer.value.clientWidth / modelContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 5000);
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer({ canvas: modelCanvas.value, antialias: true });
  renderer.setSize(modelContainer.value.clientWidth, modelContainer.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  controls = new OrbitControls(camera, modelCanvas.value);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  ambientLight = new THREE.AmbientLight(0x404040, 0.6 * brightness.value);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 0.8 * brightness.value);
  dirLight.position.set(10, 10, 5);
  scene.add(dirLight);

  gridHelper = new THREE.GridHelper(10, 10);
  gridHelper.visible = gridVisible.value;
  scene.add(gridHelper);

  animate();
  window.addEventListener("resize", handleResize);
  document.addEventListener('click', handleClickOutside);
};

const toggleSettings = () => { showSettings.value = !showSettings.value };

const animate = () => {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
};

const handleResize = () => {
  if (!modelContainer.value || !renderer || !camera) return;
  const width = modelContainer.value.clientWidth;
  const height = modelContainer.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const loadMeshModel = async () => {
  try {
    const loader = new PLYLoader();
    const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
      loader.load(props.modelUrl, resolve, undefined, reject);
    });

    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      if (Array.isArray((currentMesh as any).material)) {
        (currentMesh as any).material.forEach((m: THREE.Material) => m.dispose());
      } else {
        (currentMesh as any).material.dispose?.();
      }
    }

    if (!geometry.attributes.normal) geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      color: geometry.attributes.color ? 0xffffff : 0x00aa00,
      vertexColors: !!geometry.attributes.color,
      side: THREE.DoubleSide,
      wireframe: wireframeEnabled.value,
      transparent: true,
      opacity: opacity.value,
    });

    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);

    updateModelBounds();
    fitCameraToObject(currentMesh);

    ElMessage.success("网格模型加载完成！");
  } catch (error) {
    ElMessage.error(`网格模型加载失败: ${error}`);
  }
};

const updateModelBounds = () => {
  if (!currentMesh) return;
  const box = new THREE.Box3().setFromObject(currentMesh);
  box.getCenter(modelCenter);
  box.getSize(modelSize);
};

const fitCameraToObject = (object: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(object);
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
};

// 视角预设
const setTopView = () => {
  if (!currentMesh) return;
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(modelCenter.x, modelCenter.y + maxDim * 2, modelCenter.z);
  camera.up.set(0, 0, -1);
  camera.lookAt(modelCenter);
  controls.target.copy(modelCenter);
  controls.update();
};

const setInsideBottomView = () => {
  if (!currentMesh) return;
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(modelCenter.x, modelCenter.y - maxDim * 0.2, modelCenter.z);
  camera.near = 0.001;
  camera.updateProjectionMatrix();
  camera.up.set(0, 0, 1);
  const upPoint = new THREE.Vector3(modelCenter.x, modelCenter.y + maxDim * 0.5, modelCenter.z);
  camera.lookAt(upPoint);
  controls.target.copy(upPoint);
  controls.update();
};

const setSideView = () => {
  if (!currentMesh) return;
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(modelCenter.x + maxDim * 2, modelCenter.y + maxDim * 0.3, modelCenter.z);
  camera.up.set(0, 1, 0);
  camera.lookAt(modelCenter);
  controls.target.copy(modelCenter);
  controls.update();
};

// 工具栏方法
const resetView = () => {
  if (currentMesh) {
    updateModelBounds();
    fitCameraToObject(currentMesh);
    ElMessage.success("视角已重置");
  }
};

const toggleGrid = () => {
  gridVisible.value = !gridVisible.value;
  if (gridHelper) gridHelper.visible = gridVisible.value;
};

const toggleWireframe = () => {
  wireframeEnabled.value = !wireframeEnabled.value;
  if (currentMesh) {
    const mat = currentMesh.material as THREE.MeshLambertMaterial;
    mat.wireframe = wireframeEnabled.value;
    mat.needsUpdate = true;
  }
};

const applyOpacity = () => {
  if (!currentMesh) return;
  const apply = (m: THREE.Material) => {
    const mm = m as THREE.MeshLambertMaterial;
    mm.transparent = true;
    mm.opacity = opacity.value;
    mm.needsUpdate = true;
  };
  if (Array.isArray((currentMesh as any).material)) {
    (currentMesh as any).material.forEach((m: THREE.Material) => apply(m));
  } else {
    apply((currentMesh as any).material);
  }
};

const applyBrightness = () => {
  if (ambientLight) ambientLight.intensity = 0.6 * brightness.value;
  if (dirLight) dirLight.intensity = 0.8 * brightness.value;
};

const toggleFullscreen = async () => {
  if (!modelContainer.value) return;
  const el = modelContainer.value as HTMLElement;
  try {
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  } catch (e) {
    // ignore
  }
};

const reloadModel = async () => {
  await loadMeshModel();
};

const cleanup = () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (controls) controls.dispose();
  if (renderer) renderer.dispose();
  window.removeEventListener("resize", handleResize);
  document.removeEventListener('click', handleClickOutside);
};

onMounted(() => {
  nextTick(() => {
    initScene();
    setTimeout(() => {
      loadMeshModel();
    }, 300);
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.model-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f8f9fa;
}

.model-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover { background: #f3f4f6; }
.tool-btn.active { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }

.settings-popover {
  position: absolute;
  top: 46px;
  right: 64px;
  width: 320px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  padding: 12px;
  z-index: 15;
}

.settings-section { margin-bottom: 10px; }
.settings-section:last-child { margin-bottom: 0; }
.section-title { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.preset-row { display: flex; gap: 8px; }
.preset-btn { flex: 1; height: 30px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; color: #374151; font-size: 12px; cursor: pointer; }
.preset-btn:hover { background: #f3f4f6; }

.slider-row { display: flex; align-items: center; gap: 8px; }
.slider { flex: 1; }
.slider-value { font-size: 12px; color: #374151; min-width: 34px; text-align: right; }

.model-container { width: 100%; height: 100%; position: relative; }
.model-canvas { width: 100%; height: 100%; display: block; }
</style>


