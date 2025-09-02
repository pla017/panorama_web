<template>
  <div class="analyzer-app">
    <!-- 左侧侧边栏 -->
    <div class="left-sidebar">
      <!-- ANALYZER 标题 -->
      <div class="flex justify-center items-center p-4">
        <img src="@/assets/logo.svg" class="h-7" alt="" />
      </div>

      <!-- 导航按钮组 -->
      <div class="sidebar-nav">
        <div class="nav-button" @click="setActiveView('home')">
          <span>HOME</span>
        </div>
        <div class="nav-button" @click="setActiveView('project')">
          <span>PROJECT</span>
        </div>
        <div class="nav-button" @click="setActiveView('upload')">
          <span>UPLOAD</span>
        </div>
        <div class="nav-button current" @click="setActiveView('review')">
          <span>REVIEW</span>
        </div>
        <div class="nav-button" @click="setActiveView('analyzer')">
          <span>ANALYZER</span>
        </div>
        <div class="nav-button" @click="setActiveView('download')">
          <span>DOWNLOAD</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <!-- <div class="main-layout">
      <div class="left-panel">
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

        <div class="model-viewer-container">
          <div ref="modelContainer" class="model-container">
            <canvas ref="modelCanvas" class="model-canvas"></canvas>

            <div v-if="loadingMesh || loadingPoints" class="loading-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>{{ loadingMesh ? "加载网格模型..." : "加载点云..." }}</p>
            </div>
          </div>
        </div>
      </div>

     
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
    </div> -->

    <div class="grid grid-cols-[auto_55%] w-full p-5 mt-5">
      <!-- left -->
      <div class="p-2 flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="uppercase text-gray-500 text-lg">Review</span>

          <div class="flex items-center gap-2">
            <div
              class="flex items-center justify-center bg-[#686868] px-3 py-2 rounded-md"
            >
              <span class="uppercase text-white text-base">unfolding view</span>
            </div>

            <div
              class="flex items-center justify-center bg-[#E2BA06] px-3 py-2 rounded-md"
            >
              <span class="uppercase text-white text-base">3D model</span>
            </div>
          </div>
        </div>
        <div class="d-viewer-container">
          <!-- <div ref="modelContainer" class="model-container">
            <canvas ref="modelCanvas" class="model-canvas"></canvas>

            <div v-if="loadingMesh || loadingPoints" class="loading-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>{{ loadingMesh ? "加载网格模型..." : "加载点云..." }}</p>
            </div>
          </div> -->
        </div>
      </div>

      <!-- right -->
      <div class="p-2 flex flex-col gap-2">
        <div class="w-full flex justify-between items-center">
          <div>
            <el-select
              v-model="selectedProject"
              placeholder="请选择项目"
              size="small"
              style="width: 160px"
            >
              <el-option label="项目1" value="project1"></el-option>
              <el-option label="项目2" value="project2"></el-option>
              <el-option label="项目3" value="project3"></el-option>
            </el-select>
          </div>
          <img src="@/assets/operation.svg" class="w-10 h-10" alt="" />
        </div>
        <SimplePanoramaViewer ref="panoramaRef" />
        <div class="flex flex-col items-center justify-center w-full gap-4">
          <!-- 标签式进度条 -->
          <div class="w-full px-4">
            <div class="flex items-center justify-between mb-4">
              <span class="text-blue-500 text-sm font-mono">{{ formatTime(currentTime) }}</span>
              <span class="text-gray-500 text-sm font-mono">{{ formatTime(duration) }}</span>
            </div>
            
            <!-- 标签进度条容器 -->
            <div class="relative w-full">
              <!-- 进度轨道 -->
              <div 
                class="progress-track w-full h-2 bg-gray-300 rounded-full cursor-pointer relative overflow-visible"
                @click="seekTo"
                @mousedown="startDrag"
                ref="progressBarRef"
              >
                <!-- 播放进度背景 -->
                <div 
                  class="play-progress absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-300"
                  :style="{ width: playProgress + '%' }"
                ></div>
                

                
                <!-- 拖拽手柄 -->
                <div 
                  class="progress-handle absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-yellow-500 rounded-full shadow-lg transition-all duration-200 cursor-grab"
                  :class="{ 
                    'opacity-100 scale-110': isDragging || playProgress > 0,
                    'opacity-0': playProgress === 0,
                    'cursor-grabbing': isDragging
                  }"
                  :style="{ left: playProgress + '%', transform: 'translate(-50%, -50%)' }"
                  @mousedown.stop="startDrag"
                ></div>
              </div>
              
              <!-- 位置标签 -->
              <div class="markers-container absolute -top-8 left-0 right-0 h-8">
                <div 
                  v-for="(marker, index) in positionMarkers" 
                  :key="index"
                  class="position-marker absolute transform -translate-x-1/2 cursor-pointer group"
                  :style="{ left: marker.position + '%' }"
                  @click="jumpToMarker(marker)"
                >
                  <!-- 标签图标 -->
                  <div 
                    class="marker-icon w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-200 group-hover:scale-110"
                    :class="marker.color"
                    :title="marker.label"
                  >
                    {{ marker.icon }}
                  </div>
                  
                  <!-- 连接线 -->
                  <div class="marker-line absolute top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gray-400"></div>
                  
                  <!-- 标签提示 -->
                  <div class="marker-tooltip absolute top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    {{ marker.label }}
                    <div class="tooltip-time text-gray-300">{{ formatTime(marker.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="w-full flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-base">{{ formatTime(currentTime) }}</span>
              <div class="flex items-center gap-2">
                <button 
                  class="left-btn w-14 h-14 hover:scale-110 transition-transform" 
                  @click="seekToStart"
                  title="跳转到开始"
                ></button>
                <button 
                  class="left-next w-14 h-14 hover:scale-110 transition-transform" 
                  @click="seekBackward"
                  :title="`后退${seekInterval}秒`"
                ></button>
                <button 
                  class="play-btn w-14 h-14 hover:scale-110 transition-transform" 
                  @click="togglePlay"
                  :class="{ 'playing': isPlaying }"
                  title="播放/暂停"
                ></button>
                <button 
                  class="right-btn w-14 h-14 hover:scale-110 transition-transform" 
                  @click="seekForward"
                  :title="`前进${seekInterval}秒`"
                ></button>
                <button 
                  class="right-next w-14 h-14 hover:scale-110 transition-transform" 
                  @click="seekToEnd"
                  title="跳转到结尾"
                ></button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                class="screen-btn w-14 h-14 hover:scale-110 transition-transform" 
                @click="takeScreenshot"
                title="截图"
              ></button>
              <button 
                class="share-btn w-14 h-14 hover:scale-110 transition-transform" 
                @click="shareVideo"
                title="分享"
              ></button>
              <button 
                class="canvas-btn w-14 h-14 hover:scale-110 transition-transform" 
                @click="toggleVideoFullscreen"
                title="视频全屏"
              ></button>
              
              <!-- 倍速控制 -->
              <div class="relative">
                <button 
                  class="speed-control-btn w-14 h-14 hover:scale-110 transition-transform bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                  @click="toggleSpeedMenu"
                  :title="`播放速度: ${playbackSpeed}x`"
                >
                  {{ playbackSpeed }}x
                </button>
                
                <!-- 倍速选择菜单 -->
                <div 
                  v-if="showSpeedMenu"
                  class="speed-menu absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border p-2 min-w-20 z-50"
                  @click.stop
                >
                  <div 
                    v-for="speed in [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]"
                    :key="speed"
                    class="speed-option px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-100 text-center"
                    :class="{ 'bg-blue-100 text-blue-600': playbackSpeed === speed }"
                    @click="selectSpeed(speed)"
                  >
                    {{ speed }}x
                  </div>
                </div>
              </div>
              
              <!-- 快进/快退设置 -->
              <div class="relative">
                <button 
                  class="seek-settings-btn w-14 h-14 hover:scale-110 transition-transform bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold" 
                  @click="toggleSeekSettings"
                  :title="`快进/快退间隔: ${seekInterval}s`"
                >
                  {{ seekInterval }}s
                </button>
                
                <!-- 快进/快退设置菜单 -->
                <div 
                  v-if="showSeekSettings"
                  class="seek-menu absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border p-2 min-w-20 z-50"
                  @click.stop
                >
                  <div class="text-xs text-gray-500 px-2 py-1 border-b mb-1">快进/快退间隔</div>
                  <div 
                    v-for="interval in [10, 15, 20, 25, 30]"
                    :key="interval"
                    class="seek-option px-3 py-2 text-sm cursor-pointer rounded hover:bg-gray-100 text-center"
                    :class="{ 'bg-orange-100 text-orange-600': seekInterval === interval }"
                    @click="selectSeekInterval(interval)"
                  >
                    {{ interval }}s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { ElMessage } from "element-plus";

import SimplePanoramaViewer from "./SimplePanoramaViewer.vue";

// 3D场景相关
const modelContainer = ref<HTMLDivElement>();
const modelCanvas = ref<HTMLCanvasElement>();

// 全景视频控制相关
const panoramaRef = ref<any>();
const progressBarRef = ref<HTMLDivElement>();

// 视频播放状态
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playProgress = ref(0);
const bufferProgress = ref(0);
const isDragging = ref(false);
const playbackSpeed = ref(1.0);
const showSpeedMenu = ref(false);
const seekInterval = ref(10); // 默认快进/快退10秒
const showSeekSettings = ref(false);




// 动态生成的截图标签
const positionMarkers = ref<Array<{
  id: number;
  position: number;
  time: number;
  icon: string;
  label: string;
  color: string;
  thumbnail?: string;
}>>([]);

// 标签颜色配置
const markerColors = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-purple-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-teal-500'
];

// 标签图标配置
const markerIcons = ['📸', '🎯', '⭐', '🔥', '💎', '🎬', '📍', '✨'];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;

// 模型状态
const loadingMesh = ref(false);

// UI状态
const selectedProject = ref("project2");
const currentView = ref("review");

// 当前加载的模型
let currentMesh: THREE.Mesh | null = null;



// 设置当前视图
const setActiveView = (view: string) => {
  currentView.value = view;
  console.log("切换到视图:", view);
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

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 播放/暂停控制
const togglePlay = () => {
  if (panoramaRef.value && panoramaRef.value.togglePlay) {
    panoramaRef.value.togglePlay();
    isPlaying.value = !isPlaying.value;
  }
};

// 跳转到开始
const seekToStart = () => {
  if (panoramaRef.value && panoramaRef.value.seekTo) {
    panoramaRef.value.seekTo(0);
    currentTime.value = 0;
    playProgress.value = 0;
  }
};

// 跳转到结尾
const seekToEnd = () => {
  if (panoramaRef.value && panoramaRef.value.seekTo && duration.value > 0) {
    panoramaRef.value.seekTo(duration.value - 1);
    currentTime.value = duration.value - 1;
    playProgress.value = ((duration.value - 1) / duration.value) * 100;
  }
};

// 快退（可自定义时间）
const seekBackward = () => {
  if (panoramaRef.value && panoramaRef.value.seekTo && currentTime.value > 0) {
    const newTime = Math.max(0, currentTime.value - seekInterval.value);
    panoramaRef.value.seekTo(newTime);
    currentTime.value = newTime;
    playProgress.value = duration.value > 0 ? (newTime / duration.value) * 100 : 0;
  }
};

// 快进（可自定义时间）
const seekForward = () => {
  if (panoramaRef.value && panoramaRef.value.seekTo && duration.value > 0) {
    const newTime = Math.min(duration.value, currentTime.value + seekInterval.value);
    panoramaRef.value.seekTo(newTime);
    currentTime.value = newTime;
    playProgress.value = (newTime / duration.value) * 100;
  }
};

// 进度条点击跳转
const seekTo = (event: MouseEvent) => {
  if (!progressBarRef.value || duration.value === 0) return;

  const rect = progressBarRef.value.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const seekTime = percent * duration.value;

  if (panoramaRef.value && panoramaRef.value.seekTo) {
    panoramaRef.value.seekTo(seekTime);
    currentTime.value = seekTime;
    playProgress.value = percent * 100;
  }
};

// 截图功能
const takeScreenshot = () => {
  if (panoramaRef.value && panoramaRef.value.takeScreenshot) {
    panoramaRef.value.takeScreenshot();
    
    // 创建截图标签
    const currentTimeValue = currentTime.value;
    const currentPosition = duration.value > 0 ? (currentTimeValue / duration.value) * 100 : 0;
    
    // 选择颜色和图标
    const colorIndex = positionMarkers.value.length % markerColors.length;
    const iconIndex = positionMarkers.value.length % markerIcons.length;
    
    const newMarker = {
      id: Date.now(),
      position: currentPosition,
      time: currentTimeValue,
      icon: markerIcons[iconIndex],
      label: `截图 ${positionMarkers.value.length + 1}`,
      color: markerColors[colorIndex],
      thumbnail: '' // 可以后续添加缩略图
    };
    
    positionMarkers.value.push(newMarker);
    ElMessage.success(`已创建截图标签: ${newMarker.label}`);
  } else {
    ElMessage.info('截图功能');
  }
};

// 分享功能
const shareVideo = () => {
  ElMessage.info('分享功能');
  // 可以添加分享逻辑
};

// 视频全屏切换
const toggleVideoFullscreen = () => {
  if (panoramaRef.value && panoramaRef.value.toggleFullscreen) {
    panoramaRef.value.toggleFullscreen();
    ElMessage.success('切换视频全屏模式');
  } else {
    ElMessage.info('视频全屏功能');
  }
};

// 切换倍速菜单显示
const toggleSpeedMenu = () => {
  showSpeedMenu.value = !showSpeedMenu.value;
  showSeekSettings.value = false; // 关闭其他菜单
};

// 选择播放速度
const selectSpeed = (speed: number) => {
  playbackSpeed.value = speed;
  showSpeedMenu.value = false;
  
  // 同步到全景视频组件
  if (panoramaRef.value && panoramaRef.value.setPlaybackRate) {
    panoramaRef.value.setPlaybackRate(speed);
  }
  
  ElMessage.success(`播放速度已设置为 ${speed}x`);
};

// 切换快进/快退设置菜单
const toggleSeekSettings = () => {
  showSeekSettings.value = !showSeekSettings.value;
  showSpeedMenu.value = false; // 关闭其他菜单
};

// 选择快进/快退间隔
const selectSeekInterval = (interval: number) => {
  seekInterval.value = interval;
  showSeekSettings.value = false;
  ElMessage.success(`快进/快退间隔已设置为 ${interval}秒`);
};

// 跳转到标签位置
const jumpToMarker = (marker: any) => {
  if (panoramaRef.value && panoramaRef.value.seekTo) {
    panoramaRef.value.seekTo(marker.time);
    currentTime.value = marker.time;
    playProgress.value = marker.position;
    ElMessage.success(`跳转到: ${marker.label}`);
  }
};

// 更新标签位置（基于视频时长动态计算）
const updateMarkerPositions = () => {
  if (duration.value > 0) {
    positionMarkers.value.forEach(marker => {
      marker.position = (marker.time / duration.value) * 100;
    });
  }
};

// 开始拖拽
const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  let lastUpdateTime = 0;
  const updateInterval = 16; // 约60fps
  
  // 立即执行一次位置更新
  updateDragPosition(event);
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    
    // 节流更新，提高性能
    const now = Date.now();
    if (now - lastUpdateTime < updateInterval) {
      return;
    }
    lastUpdateTime = now;
    
    updateDragPosition(e);
  };
  
  const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.userSelect = ''; // 恢复文本选择
    document.body.style.cursor = '';
  };
  
  // 添加事件监听
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseup', onMouseUp);
  
  // 防止文本选择和设置拖拽光标
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
  
  // 阻止默认行为
  event.preventDefault();
  event.stopPropagation();
};

// 更新拖拽位置的辅助函数
const updateDragPosition = (event: MouseEvent) => {
  if (!progressBarRef.value || duration.value <= 0) return;
  
  const rect = progressBarRef.value.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const seekTime = percent * duration.value;
  
  // 立即更新UI状态
  playProgress.value = percent * 100;
  currentTime.value = seekTime;
  
  // 使用requestAnimationFrame来优化视频同步
  requestAnimationFrame(() => {
    if (panoramaRef.value && panoramaRef.value.seekTo) {
      panoramaRef.value.seekTo(seekTime);
    }
  });
};

// 监听全景视频组件状态变化
watch(() => panoramaRef.value, (newVal) => {
  if (newVal) {
    // 监听全景视频的状态变化
    const updateStates = () => {
      if (panoramaRef.value && panoramaRef.value.getState && !isDragging.value) {
        const state = panoramaRef.value.getState();
        
        // 更新状态（拖拽时不更新进度相关状态）
        const oldDuration = duration.value;
        if (!isDragging.value) {
          currentTime.value = state.currentTime || 0;
          playProgress.value = state.playProgress || 0;
        }
        duration.value = state.duration || 0;
        isPlaying.value = state.isPlaying || false;
        bufferProgress.value = state.bufferProgress || 0;
        
        // 当获得视频时长后，更新标签位置
        if (state.duration > 0 && oldDuration !== state.duration) {
          updateMarkerPositions();
        }
      }
    };

    // 定时更新状态
    const stateUpdateInterval = setInterval(updateStates, 100);
    
    // 组件卸载时清除定时器
    onUnmounted(() => {
      clearInterval(stateUpdateInterval);
    });
  }
}, { immediate: true });

// 监听视频时长变化，更新标签位置
watch(() => duration.value, (newDuration) => {
  if (newDuration > 0) {
    updateMarkerPositions();
  }
});

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showSpeedMenu.value = false;
    showSeekSettings.value = false;
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
  
  // 监听点击外部关闭菜单
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  cleanup();
  // 清理事件监听
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.d-viewer-container {
  border-radius: 8px;
  height: 100%;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
}

/* 标签式进度条样式 */
.progress-track {
  position: relative;
  transition: all 0.2s ease;
  z-index: 1;
}

.progress-track:hover {
  transform: scaleY(1.3);
}

.play-progress {
  position: relative;
  overflow: hidden;
  z-index: 2;
}



/* 位置标签样式 */
.markers-container {
  z-index: 10;
}

.position-marker {
  z-index: 15;
}

.marker-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.marker-icon:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.marker-line {
  transition: all 0.2s ease;
  opacity: 0.6;
}

.position-marker:hover .marker-line {
  opacity: 1;
  background-color: #374151;
}

.marker-tooltip {
  pointer-events: none;
  min-width: 80px;
  max-width: 200px;
}

.tooltip-time {
  font-size: 10px;
  margin-top: 2px;
}

/* 不同颜色标签的悬停效果 */
.bg-blue-500:hover {
  background-color: #3b82f6 !important;
}

.bg-green-500:hover {
  background-color: #10b981 !important;
}

.bg-purple-500:hover {
  background-color: #8b5cf6 !important;
}

.bg-red-500:hover {
  background-color: #ef4444 !important;
}

.bg-indigo-500:hover {
  background-color: #6366f1 !important;
}

.bg-yellow-500:hover {
  background-color: #eab308 !important;
}

/* 进度条动画效果 */
@keyframes progress-glow {
  0%, 100% { 
    box-shadow: 0 0 5px rgba(234, 179, 8, 0.5); 
  }
  50% { 
    box-shadow: 0 0 15px rgba(234, 179, 8, 0.8); 
  }
}

.play-progress {
  animation: progress-glow 2s ease-in-out infinite;
}

/* 拖拽手柄样式 */
.progress-handle {
  transition: opacity 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  z-index: 20;
  will-change: transform, opacity;
}

.progress-handle:hover {
  transform: translate(-50%, -50%) scale(1.15) !important;
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.5);
}

.progress-handle.cursor-grabbing {
  transform: translate(-50%, -50%) scale(1.2) !important;
  box-shadow: 0 6px 16px rgba(234, 179, 8, 0.7);
  transition: none; /* 拖拽时禁用过渡动画 */
}

/* 进度条悬停效果 */
.progress-track:hover .progress-handle {
  opacity: 1 !important;
}

/* 优化进度条性能 */
.progress-track {
  will-change: transform;
}

.play-progress {
  will-change: width;
  transition: width 0.1s ease;
}

/* 倍速控制按钮样式 */
.speed-control-btn {
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  border: 2px solid #6b7280;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.speed-control-btn:hover {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-color: #9ca3af;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 快进/快退设置按钮样式 */
.seek-settings-btn {
  background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
  border: 2px solid #f97316;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.seek-settings-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border-color: #fb923c;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 菜单通用样式 */
.speed-menu, .seek-menu {
  animation: fadeInUp 0.2s ease-out;
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.speed-option, .seek-option {
  transition: all 0.2s ease;
  font-weight: 500;
}

.speed-option:hover, .seek-option:hover {
  background-color: #f3f4f6 !important;
  transform: translateY(-1px);
}

.speed-option.bg-blue-100 {
  background-color: #dbeafe !important;
  color: #2563eb !important;
  font-weight: 600;
}

.seek-option.bg-orange-100 {
  background-color: #fed7aa !important;
  color: #ea580c !important;
  font-weight: 600;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@mixin button-bg($url) {
  background-image: url($url);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;

  &:active {
    filter: brightness(0.85);
    transform: scale(0.95);
    transition: filter 0.1s, transform 0.1s;
  }
}

.left-btn {
  @include button-bg("@/assets/left.svg");
}
.left-next {
  @include button-bg("@/assets/left_arrow.svg");
}
.play-btn {
  @include button-bg("@/assets/bofang.svg");
  position: relative;
  
  &.playing {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(64, 158, 255, 0.2);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 0.7; 
  }
  50% { 
    transform: scale(1.05); 
    opacity: 0.3; 
  }
}
.right-btn {
  @include button-bg("@/assets/right_arrow.svg");
}
.right-next {
  @include button-bg("@/assets/right.svg");
}

.screen-btn {
  @include button-bg("@/assets/jietu.svg");
}

.share-btn {
  @include button-bg("@/assets/share.svg");
}

.canvas-btn {
  @include button-bg("@/assets/screen.svg");
}

.bet-btn {
  @include button-bg("@/assets/bet.svg");
}

.analyzer-app {
  height: 100vh;
  display: flex;
  flex-direction: row;
  background: #f5f7fa;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

/* 左侧侧边栏 */
.left-sidebar {
  /* width: 180px; */
  height: 100vh;
  /* background: #f0f0f0; */
  /* border-right: 1px solid #ddd; */
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* .sidebar-header {
  padding: 15px 0;
  text-align: center;
  border-bottom: 1px solid #ddd;
  background: #e8e8e8;
} */

.analyzer-logo {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  letter-spacing: 1px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-button {
  background: linear-gradient(to right, #fafafa, #d7d7d6);
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  span {
    color: #666;
    font-size: 13px;
  }
}

.nav-button:hover {
  background: #e0e0e0;
  color: #333;
}

.nav-button.current {
  background: #ffd700;
  color: #333;
  font-weight: bold;
}

.nav-button span {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.sidebar-bottom {
  border-top: 1px solid #ddd;
  display: flex;
  flex-direction: column;
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
  position: relative;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* padding: 10px; */
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
  .left-sidebar {
    width: 80px;
  }

  .analyzer-logo {
    font-size: 10px;
  }

  .nav-button {
    padding: 8px 4px;
    font-size: 9px;
  }

  .nav-button span {
    font-size: 9px;
  }
}
</style>
