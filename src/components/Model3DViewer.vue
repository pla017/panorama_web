<template>
  <div class="model-3d-viewer">
    <!-- 顶部紧凑控制栏 -->
    <div class="top-control-bar">
      <!-- 模型加载控制 -->
      <div class="control-section">
        <span class="section-label">模型:</span>
        <el-button-group size="small">
          <el-button @click="loadMeshModel" :loading="loadingMesh">
            <el-icon><Box /></el-icon>
            网格
          </el-button>
          <el-button @click="loadPointCloud" :loading="loadingPoints">
            <el-icon><Grid /></el-icon>
            点云
          </el-button>
        </el-button-group>
      </div>

      <!-- 视角控制 -->
      <div class="control-section">
        <span class="section-label">视角:</span>
        <el-button-group size="small">
          <el-button
            @click="setViewAngle('top')"
            :type="currentViewAngle === 'top' ? 'primary' : 'default'"
          >
            顶
          </el-button>
          <el-button
            @click="setViewAngle('bottom')"
            :type="currentViewAngle === 'bottom' ? 'primary' : 'default'"
          >
            底
          </el-button>
          <el-button
            @click="setViewAngle('side')"
            :type="currentViewAngle === 'side' ? 'primary' : 'default'"
          >
            侧
          </el-button>
          <el-button
            @click="setViewAngle('front')"
            :type="currentViewAngle === 'front' ? 'primary' : 'default'"
          >
            正
          </el-button>
          <el-button @click="resetModelView">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-button-group>
      </div>

              <!-- 视图模式 -->
        <div class="control-section">
          <span class="section-label">视图模式:</span>
          <el-radio-group
            v-model="displayMode"
            @change="changeDisplayMode"
            size="small"
          >
            <el-radio-button value="stereo">3D View 立体模式</el-radio-button>
            <el-radio-button value="side">Side View 侧面模式</el-radio-button>
            <el-radio-button value="section">Section View 剖面模式</el-radio-button>
          </el-radio-group>
        </div>

      <!-- 缩略图和轮廓控制 -->
      <div class="control-section">
        <span class="section-label">显示:</span>
        <el-button-group size="small">
          <el-button
            @click="toggleThumbnail"
            :type="showThumbnail ? 'primary' : 'default'"
          >
            缩略图
          </el-button>
          <el-button
            @click="toggleContour"
            :type="showContour ? 'primary' : 'default'"
          >
            轮廓
          </el-button>
        </el-button-group>
      </div>

      <!-- 显示选项 -->
      <div class="control-section">
        <span class="section-label">显示:</span>
        <el-button-group size="small">
          <el-button
            @click="toggleWireframe"
            :type="showWireframe ? 'primary' : 'default'"
          >
            线框
          </el-button>
          <!-- <el-button
            @click="togglePoints"
            :type="showPoints ? 'primary' : 'default'"
          >
            点
          </el-button> -->
        </el-button-group>
      </div>

      <!-- 快速调节 -->
      <div class="control-section">
        <span class="section-label">透明度:</span>
        <el-slider
          v-model="modelOpacity"
          :min="0"
          :max="100"
          @input="updateOpacity"
          style="width: 80px"
        />
        <span class="value-display">{{ modelOpacity }}%</span>
      </div>

      <div class="control-section">
        <span class="section-label">亮度:</span>
        <el-slider
          v-model="modelBrightness"
          :min="0"
          :max="200"
          @input="updateBrightness"
          style="width: 80px"
        />
        <span class="value-display">{{ modelBrightness }}%</span>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="main-layout">
      <!-- 左侧工具面板 -->
      <div class="left-sidebar">
        <!-- 位置微调工具 -->
        <div class="tool-panel">
          <div class="panel-header">
            <h4>位置微调</h4>
            <el-button
              @click="toggleFineTuneMode"
              :type="fineTuneMode ? 'primary' : 'default'"
              size="small"
            >
              {{ fineTuneMode ? "退出" : "开启" }}
            </el-button>
          </div>

          <div v-if="fineTuneMode" class="panel-content">
            <div class="direction-controls">
              <div class="direction-row">
                <el-button @click="adjustView('up')" size="small">↑</el-button>
              </div>
              <div class="direction-row">
                <el-button @click="adjustView('left')" size="small"
                  >←</el-button
                >
                <el-button @click="adjustView('center')" size="small"
                  >●</el-button
                >
                <el-button @click="adjustView('right')" size="small"
                  >→</el-button
                >
              </div>
              <div class="direction-row">
                <el-button @click="adjustView('down')" size="small"
                  >↓</el-button
                >
              </div>
             
            </div>
            
            <!-- 微调参数控制 -->
            <div class="fine-tune-settings">
              <div class="setting-item">
                <span class="setting-label">旋转速度:</span>
                <el-slider
                  v-model="rotationSpeed"
                  :min="0.1"
                  :max="5.0"
                  :step="0.1"
                  style="width: 80px"
                />
                <span class="value-display">{{ rotationSpeed }}</span>
              </div>
              <div class="setting-item">
                <span class="setting-label">平移距离:</span>
                <el-slider
                  v-model="panDistance"
                  :min="0.1"
                  :max="5.0"
                  :step="0.1"
                  style="width: 80px"
                />
                <span class="setting-label">{{ panDistance }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 测量工具 -->
        <div class="tool-panel">
          <div class="panel-header">
            <h4>测量工具 Measurement Tools</h4>
            <el-button
              @click="toggleMeasurementMode"
              :type="measurementMode ? 'primary' : 'default'"
              size="small"
            >
              {{ measurementMode ? "退出" : "开启" }}
            </el-button>
          </div>

          <div v-if="measurementMode" class="panel-content">
            <div class="compact-settings">
              <div class="setting-item">
                <el-checkbox
                  v-model="autoSnapEnabled"
                  @change="onAutoSnapToggle"
                  size="small"
                >
                  自动贴合
                </el-checkbox>
              </div>
            </div>

            <!-- 测量工具列表 -->
            <div class="measurement-tools-list">
              <div class="measurement-tool-item" @click="selectMeasureTool('contour')">
                <div class="tool-icon">📏</div>
                <div class="tool-info">
                  <div class="tool-name">轮廓测量 Contour Measure</div>
                  <div class="tool-value">{{ contourMeasurement.diameter }}mm</div>
                </div>
              </div>
              
              <div class="measurement-tool-item" @click="selectMeasureTool('distance')">
                <div class="tool-icon">📐</div>
                <div class="tool-info">
                  <div class="tool-name">直线测量 Distance Measure</div>
                  <div class="tool-value">{{ distanceMeasurement.distance.toFixed(1) }}m, {{ distanceMeasurement.percentage }}%</div>
                </div>
              </div>
              
              <div class="measurement-tool-item" @click="selectMeasureTool('diameter')">
                <div class="tool-icon">⭕</div>
                <div class="tool-info">
                  <div class="tool-name">直径测量 Diameter Measure</div>
                  <div class="tool-value">{{ diameterMeasurement.diameter }}mm</div>
                </div>
              </div>
              
              <div class="measurement-tool-item" @click="selectMeasureTool('area')">
                <div class="tool-icon">📦</div>
                <div class="tool-info">
                  <div class="tool-name">面积测量 Area Measure</div>
                  <div class="tool-value">
                    面积1: {{ areaMeasurement.areaValues[0]?.toFixed(2) || '0.00' }}m²
                    <span v-if="areaMeasurement.areaValues.length > 1">
                      , 面积2: {{ areaMeasurement.areaValues[1]?.toFixed(2) }}m²
                    </span>
                    <span v-if="areaMeasurement.areas.length === 2">
                      , 重叠: {{ areaMeasurement.percentage.toFixed(2) }}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="measurement-tool-item" @click="selectMeasureTool('angle')">
                <div class="tool-icon">📐</div>
                <div class="tool-info">
                  <div class="tool-name">角度测量 Angle Measure</div>
                  <div class="tool-value">{{ angleMeasurement.angle.toFixed(1) }}°</div>
                </div>
              </div>
            </div>

            <el-tabs v-model="activeMeasureTool" size="small" type="card">
              <el-tab-pane label="轮廓" name="contour"></el-tab-pane>
              <el-tab-pane label="距离" name="distance"></el-tab-pane>
              <el-tab-pane label="直径" name="diameter"></el-tab-pane>
              <el-tab-pane label="面积" name="area"></el-tab-pane>
              <el-tab-pane label="角度" name="angle"></el-tab-pane>
            </el-tabs>

            <!-- 轮廓测量控制 -->
            <div
              v-if="activeMeasureTool === 'contour'"
              class="contour-controls"
            >
              <el-button
                @click="toggleContourMeasurement"
                :type="contourMeasurement.enabled ? 'primary' : 'default'"
                size="small"
              >
                {{
                  contourMeasurement.enabled ? "关闭轮廓测量" : "开启轮廓测量"
                }}
              </el-button>
              <div v-if="contourMeasurement.enabled" class="contour-info">
                <p>点击触发黄线标记，可拖动</p>
                <p>轮廓: {{ contourMeasurement.diameter }}mm</p>
              </div>
            </div>

            <!-- 水平直径测量控制 -->
            <div
              v-if="activeMeasureTool === 'diameter'"
              class="diameter-controls"
            >
              <el-button
                @click="toggleDiameterMeasurement"
                :type="diameterMeasurement.enabled ? 'primary' : 'default'"
                size="small"
              >
                {{
                  diameterMeasurement.enabled ? "关闭直径测量" : "开启直径测量"
                }}
              </el-button>
              <div v-if="diameterMeasurement.enabled" class="diameter-info">
                <p>随鼠标滚动圆大小变化动态直径</p>
                <p>直径: {{ diameterMeasurement.diameter.toFixed(1) }}mm</p>
              </div>
            </div>

            <div class="measurement-actions">
              <el-button @click="clearMeasurements" size="small"
                >清除</el-button
              >
              <el-button @click="saveMeasurements" type="primary" size="small"
                >保存</el-button
              >
            </div>
            
            <!-- 调试工具 -->
            <div class="debug-tools">
              <el-button @click="debugInfo" size="small" type="info">
                调试信息
              </el-button>
              <el-button @click="testThumbnailSync" size="small" type="warning">
                测试同步
              </el-button>
              <el-button @click="checkControlsStatus" size="small" type="error">
                检查控制器状态
              </el-button>
            </div>
          </div>
        </div>

        <!-- 模型信息面板 -->
        <div class="tool-panel">
          <div class="panel-header">
            <h4>模型信息</h4>
          </div>
          <div class="panel-content">
            <div class="info-item">
              <span class="info-label">类型:</span>
              <span class="info-value">{{ currentModelType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">顶点:</span>
              <span class="info-value">{{ modelVertexCount }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">面数:</span>
              <span class="info-value">{{ modelFaceCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧3D渲染区域 -->
      <div class="viewer-layout">
        <!-- 主窗口 -->
        <div ref="modelContainer" class="model-container main-viewer" :class="{ 'measurement-mode': measurementMode }">
          <canvas ref="modelCanvas" class="model-canvas"></canvas>
          
          <!-- 测量模式提示 -->
          <div v-if="measurementMode" class="measurement-mode-indicator">
            <el-icon><Aim /></el-icon>
            <span>测量模式 - 3D拖动已禁用</span>
          </div>

          <!-- 自动贴合实时预览光标 -->
          <div
            v-if="autoSnapEnabled && measurementMode && snapPreview.visible"
            class="snap-preview-cursor"
            :style="{
              left: snapPreview.screenX + 'px',
              top: snapPreview.screenY + 'px',
            }"
          >
            <div class="cursor-ring"></div>
            <div class="cursor-dot"></div>
          </div>

          <!-- 测量点标记 -->
          <div
            v-for="(point, index) in currentMeasurementPoints"
            :key="'point-' + index"
            class="measurement-marker"
            :style="{
              left: point.screen.x + 'px',
              top: point.screen.y + 'px',
            }"
          >
            <div class="marker-ring"></div>
            <div class="marker-dot"></div>
            <div class="marker-label">{{ index + 1 }}</div>
          </div>

          <!-- 整体水平直径测量线 -->
          <div v-if="diameterMeasurement.enabled" class="diameter-measurement">
            <div
              class="diameter-line"
              :style="{
                top: diameterMeasurement.yPosition + 'px',
                left: diameterMeasurement.startX + 'px',
                width:
                  diameterMeasurement.endX - diameterMeasurement.startX + 'px',
              }"
              @mousedown="startDragDiameter"
            >
              <div class="diameter-handle left" @mousedown.stop="startDragDiameter"></div>
              <div class="diameter-handle right" @mousedown.stop="startDragDiameter"></div>
              <div class="diameter-value">
                {{ diameterMeasurement.diameter.toFixed(1) }}mm
              </div>
            </div>
          </div>

          <!-- 轮廓线条显示 -->
          <canvas
            v-if="showContour"
            ref="contourCanvas"
            class="contour-overlay"
          ></canvas>

          <!-- 加载状态 -->
          <div v-if="loadingMesh || loadingPoints" class="loading-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>{{ loadingMesh ? "加载网格模型..." : "加载点云..." }}</p>
          </div>

          <!-- 视角操作提示 -->
          <div class="interaction-hints">
            <p>左键拖动: 旋转 | 滚轮: 缩放 | 右键拖动: 平移</p>
            <p v-if="displayMode !== 'stereo'">
              {{ getViewRestrictionHint() }}
            </p>
          </div>
        </div>

        <!-- 缩略图窗口 -->
        <div
          v-if="showThumbnail"
          ref="thumbnailContainer"
          class="model-container thumbnail-viewer"
        >
          <canvas ref="thumbnailCanvas" class="model-canvas"></canvas>
          <div class="thumbnail-label">{{ getThumbnailLabel() }}</div>

          <!-- 缩略图轮廓线 -->
          <canvas
            v-if="showContour"
            ref="thumbnailContourCanvas"
            class="contour-overlay"
          ></canvas>

          <!-- 缩略图直径线 -->
          <div
            v-if="diameterMeasurement.enabled"
            class="diameter-measurement thumbnail-diameter"
          >
            <div
              class="diameter-line"
              :style="{
                top: diameterMeasurement.yPosition * 0.5 + 'px',
                left: '20px',
                width: 'calc(100% - 40px)',
              }"
            >
              <div class="diameter-value small">
                {{ diameterMeasurement.diameter.toFixed(1) }}mm
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, nextTick } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { ElMessage } from "element-plus";
import { Box, Grid, Refresh, Loading } from "@element-plus/icons-vue";

// 3D场景相关
const modelContainer = ref<HTMLDivElement>();
const modelCanvas = ref<HTMLCanvasElement>();
const thumbnailContainer = ref<HTMLDivElement>();
const thumbnailCanvas = ref<HTMLCanvasElement>();
const contourCanvas = ref<HTMLCanvasElement>();
const thumbnailContourCanvas = ref<HTMLCanvasElement>();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;

// 缩略图场景
let thumbnailScene: THREE.Scene;
let thumbnailCamera: THREE.PerspectiveCamera;
let thumbnailRenderer: THREE.WebGLRenderer;
let thumbnailControls: OrbitControls;

// 模型状态
const loadingMesh = ref(false);
const loadingPoints = ref(false);
const currentModelType = ref("无");
const modelVertexCount = ref(0);
const modelFaceCount = ref(0);
const modelOpacity = ref(100);
const modelBrightness = ref(100);
const showWireframe = ref(false);
const showPoints = ref(false);

// 视角和显示模式
const currentViewAngle = ref("default");
const displayMode = ref<"stereo" | "side" | "section">("stereo");
const showThumbnail = ref(false);
const showContour = ref(false);

// 位置微调
const fineTuneMode = ref(false);
const rotationSpeed = ref(2.0); // 增加默认旋转速度
const panDistance = ref(2.0); // 增加默认平移距离

// 整体水平直径测量
const diameterMeasurement = reactive({
  enabled: false,
  yPosition: 200,
  startX: 100,
  endX: 300,
  diameter: 600, // 默认显示600mm
  isDragging: false,
  dragStartY: 0,
  dragStartX: 0,
  isDraggingStart: false,
  isDraggingEnd: false,
});

// 当前加载的模型
let currentMesh: THREE.Mesh | null = null;
let currentPointCloud: THREE.Points | null = null;

// 测量功能
const measurementMode = ref(false);
const activeMeasureTool = ref("distance");
const currentMeasurementPoints = ref<
  Array<{ world: THREE.Vector3; screen: { x: number; y: number } }>
>([]);

// 3D圆测量相关
const circleMeasurement = reactive({
  enabled: false,
  center: new THREE.Vector3(),
  radius: 100,
  floatingLabel: null as null | { position: THREE.Vector3; value: string },
  overlay: null as null | THREE.Mesh,
  isCenterFixed: false,
});

// 自动贴合功能
const autoSnapEnabled = ref(true);
const snapDistance = ref(20); // 贴合距离（像素）
const snapPreview = reactive({
  visible: false,
  screenX: 0,
  screenY: 0,
  worldPosition: new THREE.Vector3(),
  snapPoint: new THREE.Vector3(),
});

// 用于实时贴合检测的变量
const snapRaycaster = new THREE.Raycaster();
const snapMouse = new THREE.Vector2();

// 测量数据
const distanceMeasurement = reactive({
  points: [] as THREE.Vector3[],
  distance: 0,
  percentage: 0, // 百分比
});

const areaMeasurement = reactive({
  areas: [] as Array<THREE.Vector3[]>, // 最多两个区域
  areaValues: [] as number[],
  percentage: 0,
});

const angleMeasurement = reactive({
  points: [] as THREE.Vector3[],
  angle: 0,
});

// 轮廓测量
const contourMeasurement = reactive({
  enabled: false,
  diameter: 600, // 默认600mm
  position: { x: 0, y: 0, z: 0 },
  isDragging: false,
});



const savedMeasurements = ref<
  Array<{ type: string; value: string; timestamp: string }>
>([]);

// Raycaster for picking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

onMounted(() => {
  // 使用nextTick确保DOM完全渲染后再初始化
  nextTick(() => {
    initScene();
    setupEventListeners();
    // 自动检查文件并加载默认模型
    setTimeout(() => {
      checkFiles();
      // 默认加载网格模型
      loadMeshModel();
      // 自动开启缩略图并加载点云模型
      showThumbnail.value = false;
      nextTick(() => {
        setTimeout(() => {
          initThumbnailViewer();
        }, 500);
      });
    }, 1000);
  });
});

onUnmounted(() => {
  cleanup();
});

const initScene = () => {
  console.log("🔧 初始化3D场景...");

  if (!modelContainer.value || !modelCanvas.value) {
    console.error("❌ DOM元素未准备好:", {
      modelContainer: !!modelContainer.value,
      modelCanvas: !!modelCanvas.value,
    });
    return;
  }

  // 强制重新计算布局
  modelContainer.value.style.display = 'none';
  modelContainer.value.offsetHeight; // 触发重排
  modelContainer.value.style.display = '';

  console.log("✅ DOM元素检查通过");
  console.log("📐 容器尺寸:", {
    width: modelContainer.value.clientWidth,
    height: modelContainer.value.clientHeight,
  });

  try {
    // 创建场景
    console.log("🌍 创建Three.js场景...");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    console.log("📷 创建透视相机...");
    const containerWidth = modelContainer.value.clientWidth || 800;
    const containerHeight = modelContainer.value.clientHeight || 600;
    const aspect = containerWidth / containerHeight;
    
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(5, 5, 5);
    console.log("📷 相机位置:", camera.position, "宽高比:", aspect);

    // 创建渲染器
    console.log("🎨 创建WebGL渲染器...");
    renderer = new THREE.WebGLRenderer({
      canvas: modelCanvas.value,
      antialias: true,
    });
    
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    console.log("🎨 渲染器设置完成", {
      canvasSize: { width: containerWidth, height: containerHeight },
      pixelRatio: renderer.getPixelRatio()
    });

    // 创建控制器
    console.log("🎮 创建轨道控制器...");
    controls = new OrbitControls(camera, modelCanvas.value);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加控制器变化事件监听器
    controls.addEventListener('change', onMainControlsChange);
    
    console.log("🎮 控制器设置完成");

    // 添加光照
    console.log("💡 添加环境光和平行光...");
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    console.log("💡 光照设置完成");

    // 添加网格辅助线
    console.log("📏 添加网格辅助线...");
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    console.log("✅ 3D场景初始化完成！");
    console.log("📊 场景对象数量:", scene.children.length);

    // 延迟渲染，确保DOM完全准备好
    setTimeout(() => {
      // 立即渲染一次场景
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        console.log("🎨 延迟渲染完成");
      }
    }, 100);

    // 开始渲染循环
    animate();


  } catch (error) {
    console.error("❌ 初始化3D场景失败:", error);
    ElMessage.error("3D场景初始化失败");
  }
};

let frameCount = 0;
const animate = () => {
  animationId = requestAnimationFrame(animate);

  // 每1000帧输出一次调试信息
  if (frameCount % 1000 === 0) {
    console.log("🎬 渲染循环运行中...", {
      frame: frameCount,
      hasControls: !!controls,
      hasRenderer: !!renderer,
      hasScene: !!scene,
      hasCamera: !!camera,
      sceneChildren: scene?.children.length || 0,
    });
  }
  frameCount++;

  // 强制确保测量模式下控制器被禁用
  if (measurementMode.value) {
    if (controls && controls.enabled) {
      controls.enabled = false;
      console.log("🔒 强制禁用主视图控制器（测量模式）");
    }
    if (thumbnailControls && thumbnailControls.enabled) {
      thumbnailControls.enabled = false;
      console.log("🔒 强制禁用缩略图控制器（测量模式）");
    }
  }

  if (controls) {
    controls.update();
    
    // 立体模式下同步主视图到缩略图
    if (displayMode.value === "stereo" && 
        thumbnailCamera && 
        thumbnailControls && 
        showThumbnail.value) {
      // 两个窗口均可同步进行3D视角操作
      thumbnailCamera.position.copy(camera.position);
      thumbnailCamera.lookAt(controls.target);
      thumbnailControls.target.copy(controls.target);
      thumbnailControls.update();
    }
    
    // 侧面模式和剖面模式下，缩略图跟随主视图的目标点
    if ((displayMode.value === "side" || displayMode.value === "section") && 
        thumbnailCamera && 
        thumbnailControls && 
        showThumbnail.value) {
      
      // 获取主视图的目标点
      const target = controls.target.clone();
      const offsetDistance = 10;
      
      if (displayMode.value === "side") {
        // 侧面模式：缩略图显示端面视图，跟随主视图的目标点
        const newPosition = new THREE.Vector3(
          target.x,
          target.y, 
          target.z + offsetDistance
        );
        
        thumbnailCamera.position.copy(newPosition);
        thumbnailCamera.lookAt(target);
        thumbnailControls.target.copy(target);
      } else if (displayMode.value === "section") {
        // 剖面模式：缩略图显示侧面视图，跟随主视图的目标点
        const newPosition = new THREE.Vector3(
          target.x + offsetDistance,
          target.y,
          target.z
        );
        
        thumbnailCamera.position.copy(newPosition);
        thumbnailCamera.lookAt(target);
        thumbnailControls.target.copy(target);
      }
      
      thumbnailControls.update();
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  } else {
    console.warn("⚠️ 渲染对象缺失:", {
      renderer: !!renderer,
      scene: !!scene,
      camera: !!camera,
    });
  }

  // 渲染缩略图
  if (
    thumbnailRenderer &&
    thumbnailScene &&
    thumbnailCamera &&
    showThumbnail.value
  ) {
    if (thumbnailControls) {
      thumbnailControls.update();
    }
    thumbnailRenderer.render(thumbnailScene, thumbnailCamera);

    // 调试信息：每1000帧输出一次缩略图状态
    if (frameCount % 1000 === 0) {
      console.log("🖼️ 缩略图渲染状态:", {
        hasRenderer: !!thumbnailRenderer,
        hasScene: !!thumbnailScene,
        hasCamera: !!thumbnailCamera,
        isVisible: showThumbnail.value,
        sceneChildren: thumbnailScene?.children.length || 0,
        displayMode: displayMode.value,
      });
    }
  }
};

const setupEventListeners = () => {
  if (!modelCanvas.value) return;

  modelCanvas.value.addEventListener("click", onCanvasClick);
  modelCanvas.value.addEventListener("mousemove", onCanvasMouseMove);
  modelCanvas.value.addEventListener("mouseenter", onCanvasMouseEnter);
  modelCanvas.value.addEventListener("mouseleave", onCanvasMouseLeave);
  window.addEventListener("resize", onWindowResize);
};

// 主视图控制器变化事件处理
const onMainControlsChange = () => {
  // 在侧面和剖面模式下，同步缩略图
  if ((displayMode.value === "side" || displayMode.value === "section") && 
      thumbnailCamera && thumbnailControls && showThumbnail.value && controls) {
    
    const target = controls.target.clone();
    const offsetDistance = 10;
    
    if (displayMode.value === "side") {
      // 侧面模式：缩略图显示端面视图，跟随主视图的目标点
      const newPosition = new THREE.Vector3(
        target.x,
        target.y, 
        target.z + offsetDistance
      );
      
      thumbnailCamera.position.copy(newPosition);
      thumbnailCamera.lookAt(target);
      thumbnailControls.target.copy(target);
      
      console.log("🖼️ 侧面模式缩略图同步:", {
        target: target,
        position: thumbnailCamera.position
      });
    } else if (displayMode.value === "section") {
      // 剖面模式：缩略图显示侧面视图，跟随主视图的目标点
      const newPosition = new THREE.Vector3(
        target.x + offsetDistance,
        target.y,
        target.z
      );
      
      thumbnailCamera.position.copy(newPosition);
      thumbnailCamera.lookAt(target);
      thumbnailControls.target.copy(target);
      
      console.log("🖼️ 剖面模式缩略图同步:", {
        target: target,
        position: thumbnailCamera.position
      });
    }
    
    thumbnailControls.update();
  }
};

const onCanvasClick = (event: MouseEvent) => {
  if (!measurementMode.value || !modelCanvas.value) return;

  // 处理圆测量模式
  if (activeMeasureTool.value === 'circle') {
    if (!circleMeasurement.isCenterFixed) {
      // 取当前鼠标位置作为圆心
      let center: THREE.Vector3;
      if (autoSnapEnabled.value && snapPreview.visible) {
        center = snapPreview.snapPoint.clone();
      } else {
        const rect = modelCanvas.value.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const objects = [];
        if (currentMesh) objects.push(currentMesh);
        if (currentPointCloud) objects.push(currentPointCloud);
        const intersects = raycaster.intersectObjects(objects);
        if (intersects.length > 0) {
          center = intersects[0].point.clone();
        } else {
          ElMessage.warning("请点击模型表面进行测量");
          return;
        }
      }
      circleMeasurement.center.copy(center);
      circleMeasurement.isCenterFixed = true;
      updateCircleOverlay();
      ElMessage.info("圆心已固定，可用滚轮调整半径");
      return;
    }
    return;
  }

  let finalPoint: THREE.Vector3;
  let screenPos: { x: number; y: number };

  if (autoSnapEnabled.value && snapPreview.visible) {
    // 使用贴合点
    finalPoint = snapPreview.snapPoint.clone();
    screenPos = {
      x: snapPreview.screenX,
      y: snapPreview.screenY,
    };
    console.log("🎯 使用自动贴合点:", finalPoint);
  } else {
    // 使用原始射线检测
    const rect = modelCanvas.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const objects = [];
    if (currentMesh) objects.push(currentMesh);
    if (currentPointCloud) objects.push(currentPointCloud);
    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
      finalPoint = intersects[0].point.clone();
      screenPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    } else {
      ElMessage.warning("请点击模型表面进行测量");
      return;
    }
  }

  currentMeasurementPoints.value.push({
    world: finalPoint,
    screen: screenPos,
  });

  updateMeasurement();
};

// 鼠标移动事件 - 实时贴合预览
const onCanvasMouseMove = (event: MouseEvent) => {
  if (!autoSnapEnabled.value || !measurementMode.value || !modelCanvas.value) {
    snapPreview.visible = false;
    return;
  }

  const rect = modelCanvas.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // 转换为Three.js坐标系
  snapMouse.x = (mouseX / rect.width) * 2 - 1;
  snapMouse.y = -(mouseY / rect.height) * 2 + 1;

  snapRaycaster.setFromCamera(snapMouse, camera);

  const objects = [];
  if (currentMesh) objects.push(currentMesh);
  if (currentPointCloud) objects.push(currentPointCloud);

  const intersects = snapRaycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point;

    // 寻找最近的顶点进行贴合
    const snapPoint = findNearestVertex(intersectPoint, intersects[0].object);

    if (snapPoint) {
      // 计算贴合点的屏幕坐标
      const screenPoint = worldToScreen(snapPoint);

      // 检查是否在贴合距离内
      const distance = Math.sqrt(
        Math.pow(screenPoint.x - mouseX, 2) +
          Math.pow(screenPoint.y - mouseY, 2)
      );

      if (distance <= snapDistance.value) {
        snapPreview.visible = true;
        snapPreview.screenX = screenPoint.x;
        snapPreview.screenY = screenPoint.y;
        snapPreview.worldPosition.copy(intersectPoint);
        snapPreview.snapPoint.copy(snapPoint);
      } else {
        // 如果超出贴合距离，使用原始交点
        snapPreview.visible = true;
        snapPreview.screenX = mouseX;
        snapPreview.screenY = mouseY;
        snapPreview.worldPosition.copy(intersectPoint);
        snapPreview.snapPoint.copy(intersectPoint);
      }
    }
  } else {
    snapPreview.visible = false;
  }
};

// 鼠标进入画布
const onCanvasMouseEnter = () => {
  if (autoSnapEnabled.value && measurementMode.value) {
    document.body.style.cursor = "crosshair";
  }
};

// 鼠标离开画布
const onCanvasMouseLeave = () => {
  snapPreview.visible = false;
  document.body.style.cursor = "default";
};

// 寻找最近的顶点进行贴合
const findNearestVertex = (
  intersectPoint: THREE.Vector3,
  object: THREE.Object3D
): THREE.Vector3 | null => {
  if (!object || !(object as THREE.Mesh).geometry) return null;

  const geometry = (object as THREE.Mesh).geometry;
  const position = geometry.attributes.position;

  if (!position) return null;

  let nearestVertex = new THREE.Vector3();
  let minDistance = Infinity;
  let found = false;

  const vertex = new THREE.Vector3();
  const worldMatrix = object.matrixWorld;

  // 遍历所有顶点找到最近的
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    vertex.applyMatrix4(worldMatrix); // 转换到世界坐标

    const distance = vertex.distanceTo(intersectPoint);
    if (distance < minDistance) {
      minDistance = distance;
      nearestVertex.copy(vertex);
      found = true;
    }
  }

  return found ? nearestVertex : null;
};

// 世界坐标转屏幕坐标
const worldToScreen = (worldPos: THREE.Vector3): { x: number; y: number } => {
  if (!modelCanvas.value || !camera) return { x: 0, y: 0 };

  const vector = worldPos.clone();
  vector.project(camera);

  const rect = modelCanvas.value.getBoundingClientRect();
  const x = (vector.x * 0.5 + 0.5) * rect.width;
  const y = (vector.y * -0.5 + 0.5) * rect.height;

  return { x, y };
};

// 自动贴合开关切换
const onAutoSnapToggle = (enabled: boolean) => {
  if (enabled) {
    ElMessage.success("自动贴合已开启，测量点将自动吸附到模型表面");
  } else {
    ElMessage.info("自动贴合已关闭");
    snapPreview.visible = false;
  }
};

const updateMeasurement = () => {
  const points = currentMeasurementPoints.value.map((p) => p.world);

  switch (activeMeasureTool.value) {
    case "distance":
      if (points.length >= 2) {
        distanceMeasurement.points = points.slice(0, 2);
        distanceMeasurement.distance = points[0].distanceTo(points[1]);
        // 计算百分比（基于模型尺寸）
        const model = currentMesh || currentPointCloud;
        if (model) {
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          distanceMeasurement.percentage = Math.round((distanceMeasurement.distance / maxDim) * 100);
        }
        if (points.length > 2) {
          currentMeasurementPoints.value = currentMeasurementPoints.value.slice(0, 2);
        }
      }
      break;
    case "area":
      // 最多只能绘制两个面
      if (areaMeasurement.areas.length >= 2) {
        ElMessage.warning("最多只能绘制两个面");
        return;
      }
      if (points.length >= 3) {
        const polygon = [...points];
        const area = calculatePolygonArea(polygon);
        areaMeasurement.areas.push(polygon);
        areaMeasurement.areaValues.push(area);

        if (areaMeasurement.areas.length === 2) {
          // 计算第二个面占第一个面的重叠比例
          const overlapPercent = calculatePolygonOverlapPercentage(
            areaMeasurement.areas[0],
            areaMeasurement.areas[1]
          );
          areaMeasurement.percentage = overlapPercent;
        }
        currentMeasurementPoints.value = [];
      }
      break;
    case "angle":
      if (points.length >= 3) {
        angleMeasurement.points = points.slice(0, 3);
        angleMeasurement.angle = calculateAngle(
          points[0],
          points[1],
          points[2]
        );
        if (points.length > 3) {
          currentMeasurementPoints.value = currentMeasurementPoints.value.slice(0, 3);
        }
      }
      break;
    case "circle":
      // 圆测量不通过updateMeasurement处理
      break;
  }
};

// 计算两个多边形重叠百分比（2D投影后面积比，百分比）
function calculatePolygonOverlapPercentage(poly1: THREE.Vector3[], poly2: THREE.Vector3[]): number {
  // 简单投影到XZ平面
  const p1 = poly1.map(v => ({ x: v.x, y: v.z }));
  const p2 = poly2.map(v => ({ x: v.x, y: v.z }));
  // 使用多边形布尔运算库或射线法，简单实现用canvas 2d Path2D
  // 这里只能粗略估算，用canvas离屏采样
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  // 找最大边界
  const all = [...p1, ...p2];
  const minX = Math.min(...all.map(p => p.x));
  const minY = Math.min(...all.map(p => p.y));
  const maxX = Math.max(...all.map(p => p.x));
  const maxY = Math.max(...all.map(p => p.y));
  const margin = 1e-6;
  const scaleX = (canvas.width - 2) / (maxX - minX + margin);
  const scaleY = (canvas.height - 2) / (maxY - minY + margin);
  // 画第一个区域
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  p1.forEach((pt, i) => {
    const x = 1 + (pt.x - minX) * scaleX;
    const y = 1 + (pt.y - minY) * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  // 画第二个区域
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  p2.forEach((pt, i) => {
    const x = 1 + (pt.x - minX) * scaleX;
    const y = 1 + (pt.y - minY) * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "#00ff00";
  ctx.fill();
  ctx.restore();
  // 统计重叠像素数量
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let overlapPx = 0;
  for (let i = 0; i < imgData.length; i += 4) {
    if (imgData[i + 3] > 0) overlapPx++;
  }
  // 再计算第一个区域的像素数量
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  p1.forEach((pt, i) => {
    const x = 1 + (pt.x - minX) * scaleX;
    const y = 1 + (pt.y - minY) * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "#ff0000";
  ctx.fill();
  const imgData1 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let area1Px = 0;
  for (let i = 0; i < imgData1.length; i += 4) {
    if (imgData1[i + 3] > 0) area1Px++;
  }
  if (area1Px === 0) return 0;
  return (overlapPx / area1Px) * 100;
}

const calculatePolygonArea = (points: THREE.Vector3[]): number => {
  if (points.length < 3) return 0;

  // 简化的多边形面积计算（假设平面多边形）
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].z - points[j].x * points[i].z;
  }
  return Math.abs(area) / 2;
};

const calculateAngle = (
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3
): number => {
  const v1 = new THREE.Vector3().subVectors(p1, p2);
  const v2 = new THREE.Vector3().subVectors(p3, p2);
  return v1.angleTo(v2) * (180 / Math.PI);
};

const onWindowResize = () => {
  if (!modelContainer.value) return;

  // 强制重新计算布局
  modelContainer.value.style.display = 'none';
  modelContainer.value.offsetHeight; // 触发重排
  modelContainer.value.style.display = '';

  // 更新主视图
  const containerWidth = modelContainer.value.clientWidth || 800;
  const containerHeight = modelContainer.value.clientHeight || 600;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);

  // 强制重新渲染
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }

  // 更新缩略图
  if (
    showThumbnail.value &&
    thumbnailContainer.value &&
    thumbnailCamera &&
    thumbnailRenderer
  ) {
    thumbnailCamera.aspect =
      thumbnailContainer.value.clientWidth /
      thumbnailContainer.value.clientHeight;
    thumbnailCamera.updateProjectionMatrix();
    thumbnailRenderer.setSize(
      thumbnailContainer.value.clientWidth,
      thumbnailContainer.value.clientHeight
    );
    
    // 重新加载点云模型到缩略图
    loadPointCloudToThumbnail();
  }

  // 重新绘制轮廓线
  if (showContour.value) {
    drawContour();
  }
};

const loadMeshModel = async () => {
  loadingMesh.value = true;

  try {
    console.log("开始加载网格模型: /Out/mesh.ply");

    const loader = new PLYLoader();

    // 先尝试获取文件信息
    const fileCheck = await fetch("/Out/mesh.ply", { method: "HEAD" });
    if (!fileCheck.ok) {
      throw new Error(
        `文件不存在或无法访问: ${fileCheck.status} ${fileCheck.statusText}`
      );
    }

    console.log("文件检查通过，开始加载PLY...");

    const geometry = await new Promise<THREE.BufferGeometry>(
      (resolve, reject) => {
        loader.load(
          "/Out/mesh.ply",
          (geometry) => {
            console.log("PLY文件加载成功:", geometry);
            console.log("几何体属性:", Object.keys(geometry.attributes));
            resolve(geometry);
          },
          (progress) => {
            console.log("加载进度:", progress);
          },
          (error) => {
            console.error("PLY文件加载失败:", error);
            reject(error);
          }
        );
      }
    );

    console.log("几何体信息:", {
      vertices: geometry.attributes.position?.count || 0,
      hasNormals: !!geometry.attributes.normal,
      hasColors: !!geometry.attributes.color,
      hasUVs: !!geometry.attributes.uv,
    });

    // 清除之前的模型
    if (currentMesh) {
      scene.remove(currentMesh);
    }

    // 计算法线（如果没有的话）
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    // 创建材质，支持顶点颜色
    const material = new THREE.MeshLambertMaterial({
      color: geometry.attributes.color ? 0xffffff : 0x00aa00,
      vertexColors: !!geometry.attributes.color,
      side: THREE.DoubleSide,
    });

    // 创建网格
    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);

    // 更新模型信息
    currentModelType.value = "网格模型";
    modelVertexCount.value = geometry.attributes.position.count;
    modelFaceCount.value = geometry.index ? geometry.index.count / 3 : 0;

    console.log("模型统计:", {
      vertices: modelVertexCount.value,
      faces: modelFaceCount.value,
    });

    // 调整相机位置
    const box = new THREE.Box3().setFromObject(currentMesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log("模型边界框:", {
      center: center,
      size: size,
    });

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      camera.position.copy(center);
      camera.position.x += maxDim * 1.5;
      camera.position.y += maxDim * 1.5;
      camera.position.z += maxDim * 1.5;
      camera.lookAt(center);

      controls.target.copy(center);
      controls.update();
    } else {
      // 如果模型太小或边界框异常，使用默认位置
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    // 强制重新渲染场景
    setTimeout(() => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        console.log("🎨 模型加载后强制渲染完成");
      }
    }, 50);

    ElMessage.success(`网格模型加载完成！顶点数: ${modelVertexCount.value}`);
  } catch (error) {
    console.error("加载网格模型失败:", error);
    ElMessage.error(`网格模型加载失败: ${error}`);
  } finally {
    loadingMesh.value = false;
  }
};

const loadPointCloud = async () => {
  loadingPoints.value = true;

  try {
    console.log("开始加载点云: /Out/sparse_point.ply");

    const loader = new PLYLoader();
    const geometry = await new Promise<THREE.BufferGeometry>(
      (resolve, reject) => {
        loader.load(
          "/Out/sparse_point.ply",
          (geometry) => {
            console.log("点云PLY文件加载成功:", geometry);
            resolve(geometry);
          },
          (progress) => {
            console.log("点云加载进度:", progress);
          },
          (error) => {
            console.error("点云PLY文件加载失败:", error);
            reject(error);
          }
        );
      }
    );

    console.log("点云几何体信息:", {
      points: geometry.attributes.position?.count || 0,
      hasColors: !!geometry.attributes.color,
    });

    // 清除之前的点云
    if (currentPointCloud) {
      scene.remove(currentPointCloud);
    }

    // 创建点材质，支持顶点颜色
    const material = new THREE.PointsMaterial({
      color: geometry.attributes.color ? 0xffffff : 0xff4444,
      vertexColors: !!geometry.attributes.color,
      size: 0.05,
      sizeAttenuation: true,
    });

    // 创建点云
    currentPointCloud = new THREE.Points(geometry, material);
    scene.add(currentPointCloud);

    // 更新模型信息
    currentModelType.value = "点云";
    modelVertexCount.value = geometry.attributes.position.count;
    modelFaceCount.value = 0;

    console.log("点云统计:", {
      points: modelVertexCount.value,
    });

    // 调整相机位置
    const box = new THREE.Box3().setFromObject(currentPointCloud);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    console.log("点云边界框:", {
      center: center,
      size: size,
    });

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      camera.position.copy(center);
      camera.position.x += maxDim * 1.5;
      camera.position.y += maxDim * 1.5;
      camera.position.z += maxDim * 1.5;
      camera.lookAt(center);

      controls.target.copy(center);
      controls.update();
    } else {
      // 如果点云太小或边界框异常，使用默认位置
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    // 强制重新渲染场景
    setTimeout(() => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
        console.log("🎨 点云加载后强制渲染完成");
      }
    }, 50);

    ElMessage.success(`点云加载完成！点数: ${modelVertexCount.value}`);
  } catch (error) {
    console.error("加载点云失败:", error);
    ElMessage.error(`点云加载失败: ${error}`);
  } finally {
    loadingPoints.value = false;
  }
};

// 检查文件是否存在
const checkFiles = async () => {
  const files = [
    { name: "网格模型", path: "/Out/mesh.ply" },
    { name: "点云", path: "/Out/sparse_point.ply" },
    { name: "视频", path: "/Out/stitched_output.mp4" },
  ];

  console.log("开始检查文件...");

  for (const file of files) {
    try {
      const response = await fetch(file.path, { method: "HEAD" });
      if (response.ok) {
        console.log(`✓ ${file.name} 文件存在: ${file.path}`);
        ElMessage.success(`${file.name} 文件检查通过`);
      } else {
        console.log(
          `✗ ${file.name} 文件不存在或无法访问: ${file.path} (状态: ${response.status})`
        );
        ElMessage.error(`${file.name} 文件不存在 (${response.status})`);
      }
    } catch (error) {
      console.error(`✗ 检查 ${file.name} 文件时出错:`, error);
      ElMessage.error(`检查 ${file.name} 文件失败`);
    }
  }
};



// 视角预设
const setViewAngle = (angle: string) => {
  if (!camera || !controls) return;

  currentViewAngle.value = angle;

  switch (angle) {
    case "top":
      // 顶视图
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);
      break;
    case "bottom":
      // 内部底视图
      camera.position.set(0, -5, 0);
      camera.lookAt(0, 0, 0);
      break;
    case "side":
      // 外部侧视图
      camera.position.set(10, 0, 0);
      camera.lookAt(0, 0, 0);
      break;
    case "front":
      // 正面视图
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      break;
  }

  controls.target.set(0, 0, 0);
  controls.update();
  ElMessage.success(`已切换到${getViewAngleName(angle)}`);
};

const getViewAngleName = (angle: string): string => {
  const names: Record<string, string> = {
    top: "顶视图",
    bottom: "内部底视图",
    side: "外部侧视图",
    front: "正面视图",
  };
  return names[angle] || "默认视角";
};

const resetModelView = () => {
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
  currentViewAngle.value = "default";
};

const toggleWireframe = () => {
  showWireframe.value = !showWireframe.value;
  if (
    currentMesh &&
    currentMesh.material instanceof THREE.MeshLambertMaterial
  ) {
    currentMesh.material.wireframe = showWireframe.value;
  }
};

const togglePoints = () => {
  showPoints.value = !showPoints.value;
  if (
    currentMesh &&
    currentMesh.material instanceof THREE.MeshLambertMaterial
  ) {
    // 切换到点显示模式需要更换材质
    if (showPoints.value) {
      const pointMaterial = new THREE.PointsMaterial({
        color: 0x00ff00,
        size: 0.02,
      });
      const points = new THREE.Points(currentMesh.geometry, pointMaterial);
      scene.remove(currentMesh);
      scene.add(points);
    }
  }
};

const updateOpacity = () => {
  const opacity = modelOpacity.value / 100;

  if (
    currentMesh &&
    currentMesh.material instanceof THREE.MeshLambertMaterial
  ) {
    currentMesh.material.opacity = opacity;
    currentMesh.material.transparent = opacity < 1;
  }

  if (
    currentPointCloud &&
    currentPointCloud.material instanceof THREE.PointsMaterial
  ) {
    currentPointCloud.material.opacity = opacity;
    currentPointCloud.material.transparent = opacity < 1;
  }
};

// 亮度调整
const updateBrightness = () => {
  const brightness = modelBrightness.value / 100;

  if (
    currentMesh &&
    currentMesh.material instanceof THREE.MeshLambertMaterial
  ) {
    // 调整材质的颜色来模拟亮度
    const baseColor = 0x00aa00;
    const r = (((baseColor >> 16) & 255) / 255) * brightness;
    const g = (((baseColor >> 8) & 255) / 255) * brightness;
    const b = ((baseColor & 255) / 255) * brightness;
    currentMesh.material.color.setRGB(r, g, b);
  }
};

// 显示模式切换
const changeDisplayMode = (mode: "stereo" | "side" | "section") => {
  displayMode.value = mode;

  // 根据模式调整主视图控制器限制（仅在非测量模式下）
  if (controls && !measurementMode.value) {
    switch (mode) {
      case "stereo":
        // 模式1：立体模式
        // 显示方式：主窗口和缩略窗口都显示相同类型的视图（均为侧面或均为端面）
        // 操作特点：两个窗口均可同步进行3D视角操作
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        break;
      case "side":
        // 模式2：侧面模式
        // 显示方式：主视图侧面、缩略图端面
        // 操作限制：在侧面视角只能左右旋转不能上下翻转
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minPolarAngle = Math.PI / 2 - 0.1; // 限制为水平视角（只能左右旋转）
        controls.maxPolarAngle = Math.PI / 2 + 0.1;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        break;
      case "section":
        // 模式3：剖面模式
        // 显示方式：主视图端面、缩略图侧面
        // 操作限制：在剖面图只能向着上下拉近拉远，不能左右侧面旋转调整
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minAzimuthAngle = 0; // 限制为端面视角（只能上下拉近拉远）
        controls.maxAzimuthAngle = 0;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        break;
    }
  }

  // 如果缩略图开启，更新缩略图视角和限制
  if (showThumbnail.value && thumbnailCamera) {
    setupThumbnailView();
    applyThumbnailViewRestrictions();
    
    // 立体模式下立即同步主视图到缩略图
    if (mode === "stereo" && camera && controls) {
      thumbnailCamera.position.copy(camera.position);
      thumbnailCamera.lookAt(controls.target);
      if (thumbnailControls) {
        thumbnailControls.target.copy(controls.target);
      }
    }
    
    // 侧面模式和剖面模式下，缩略图跟随主视图的目标点
    if ((mode === "side" || mode === "section") && controls) {
      const target = controls.target.clone();
      if (mode === "side") {
        // 侧面模式：缩略图显示端面视图
        thumbnailCamera.position.set(target.x, target.y, target.z + 10);
        thumbnailCamera.lookAt(target);
      } else if (mode === "section") {
        // 剖面模式：缩略图显示侧面视图
        thumbnailCamera.position.set(target.x + 10, target.y, target.z);
        thumbnailCamera.lookAt(target);
      }
      if (thumbnailControls) {
        thumbnailControls.target.copy(target);
      }
    }
  }

  // 更新轮廓线
  if (showContour.value) {
    drawContour();
  }

  ElMessage.info(`已切换到${getDisplayModeName(mode)}`);
};

const getDisplayModeName = (mode: string): string => {
  const names: Record<string, string> = {
    stereo: "立体模式（同步操作）",
    side: "侧面模式（主视图侧面）",
    section: "剖面模式（主视图端面）",
  };
  return names[mode] || "未知模式";
};

// 位置微调
const toggleFineTuneMode = () => {
  fineTuneMode.value = !fineTuneMode.value;
  console.log("🎮 微调模式切换:", fineTuneMode.value);
  ElMessage.info(
    fineTuneMode.value ? "已开启位置微调模式" : "已关闭位置微调模式"
  );
};

const adjustView = (direction: string) => {
  console.log("🎮 微调操作:", direction);
  
  if (!camera || !controls) {
    console.error("❌ 相机或控制器未初始化");
    return;
  }

  const speed = rotationSpeed.value * 0.5; // 增加旋转速度
  const distance = panDistance.value * 1.0; // 增加平移距离
  
  console.log("📊 微调参数:", { direction, speed, distance, displayMode: displayMode.value });

  switch (direction) {
    case "up":
      console.log("⬆️ 向上调整");
      if (displayMode.value === "section") {
        // 剖面模式：只能上下移动
        camera.position.y += distance;
        console.log("📷 剖面模式：相机Y位置增加", distance);
      } else if (displayMode.value === "side") {
        // 侧面模式：不允许上下翻转
        console.log("⚠️ 侧面模式：不允许上下翻转");
        ElMessage.warning("侧面模式只能左右旋转，不能上下翻转");
      } else {
        // 立体模式：可以自由旋转
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.phi -= speed * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
        console.log("📷 立体模式：相机位置更新", camera.position);
      }
      break;
    case "down":
      console.log("⬇️ 向下调整");
      if (displayMode.value === "section") {
        // 剖面模式：只能上下移动
        camera.position.y -= distance;
        console.log("📷 剖面模式：相机Y位置减少", distance);
      } else if (displayMode.value === "side") {
        // 侧面模式：不允许上下翻转
        console.log("⚠️ 侧面模式：不允许上下翻转");
        ElMessage.warning("侧面模式只能左右旋转，不能上下翻转");
      } else {
        // 立体模式：可以自由旋转
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.phi += speed * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
        console.log("📷 立体模式：相机位置更新", camera.position);
      }
      break;
    case "left":
      console.log("⬅️ 向左调整");
      if (displayMode.value === "section") {
        // 剖面模式：不允许左右旋转
        console.log("⚠️ 剖面模式：不允许左右旋转");
        ElMessage.warning("剖面模式只能上下拉近拉远，不能左右旋转");
      } else {
        // 侧面模式和立体模式：可以左右旋转
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.theta += speed * 0.01;
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
        console.log("📷 左右旋转：相机位置更新", camera.position);
      }
      break;
    case "right":
      console.log("➡️ 向右调整");
      if (displayMode.value === "section") {
        // 剖面模式：不允许左右旋转
        console.log("⚠️ 剖面模式：不允许左右旋转");
        ElMessage.warning("剖面模式只能上下拉近拉远，不能左右旋转");
      } else {
        // 侧面模式和立体模式：可以左右旋转
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.theta -= speed * 0.01;
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
        console.log("📷 左右旋转：相机位置更新", camera.position);
      }
      break;
    case "center":
      console.log("🎯 重置到中心");
      // 重置到中心
      controls.target.set(0, 0, 0);
      console.log("📷 目标点重置", controls.target);
      break;
  }

  controls.update();
  
  // 强制重新渲染场景
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

const toggleMeasurementMode = () => {
  measurementMode.value = !measurementMode.value;
  if (!measurementMode.value) {
    clearMeasurements();
  }
};

// 选择测量工具
const selectMeasureTool = (tool: string) => {
  // 清理测量模式相关状态
  currentMeasurementPoints.value = [];
  // 清理浮标和圆测量
  circleMeasurement.floatingLabel = null;
  circleMeasurement.overlay = null;
  circleMeasurement.isCenterFixed = false;
  areaMeasurement.areas = [];
  areaMeasurement.areaValues = [];
  areaMeasurement.percentage = 0;

  activeMeasureTool.value = tool;
  
  // 开启测量模式时禁用3D模型拖动
  if (tool !== 'none') {
    measurementMode.value = true;
    if (controls) {
      controls.enabled = false;
      console.log("🔒 测量模式：已禁用主视图3D模型拖动");
    }
    if (thumbnailControls) {
      thumbnailControls.enabled = false;
      console.log("🔒 测量模式：已禁用缩略图3D模型拖动");
    }
  } else {
    measurementMode.value = false;
    if (controls) {
      controls.enabled = true;
      console.log("🔓 测量模式：已启用主视图3D模型拖动");
    }
    if (thumbnailControls) {
      thumbnailControls.enabled = true;
      console.log("🔓 测量模式：已启用缩略图3D模型拖动");
    }
  }
  
  console.log("🔧 选择测量工具:", tool);
  
  // 根据工具类型设置相应的测量模式
  switch (tool) {
    case 'contour':
      contourMeasurement.enabled = true;
      break;
    case 'diameter':
      diameterMeasurement.enabled = true;
      break;
    case 'circle':
      circleMeasurement.enabled = true;
      circleMeasurement.isCenterFixed = false;
      break;
    case 'distance':
    case 'area':
    case 'angle':
      // 这些工具需要点击选择点
      break;
  }
  
  ElMessage.info(`已选择${getMeasureToolName(tool)}`);
};

// 获取测量工具名称
const getMeasureToolName = (tool: string): string => {
  const names: Record<string, string> = {
    contour: "轮廓测量",
    distance: "直线测量", 
    diameter: "直径测量",
    area: "面积测量",
    angle: "角度测量"
  };
  return names[tool] || "未知工具";
};

const clearMeasurements = () => {
  currentMeasurementPoints.value = [];
  distanceMeasurement.points = [];
  distanceMeasurement.distance = 0;
  areaMeasurement.areas = [];
  areaMeasurement.areaValues = [];
  areaMeasurement.percentage = 0;
  angleMeasurement.points = [];
  angleMeasurement.angle = 0;
  // 清除圆测量
  circleMeasurement.floatingLabel = null;
  circleMeasurement.overlay = null;
  circleMeasurement.isCenterFixed = false;
  
  // 清除测量时重新启用3D模型拖动
  measurementMode.value = false;
  if (controls) {
    controls.enabled = true;
    console.log("🔓 清除测量：已重新启用主视图3D模型拖动");
  }
  if (thumbnailControls) {
    thumbnailControls.enabled = true;
    console.log("🔓 清除测量：已重新启用缩略图3D模型拖动");
  }
};

const saveMeasurements = () => {
  const timestamp = new Date().toLocaleString();

  if (
    activeMeasureTool.value === "distance" &&
    distanceMeasurement.distance > 0
  ) {
    savedMeasurements.value.push({
      type: "距离",
      value: `${distanceMeasurement.distance.toFixed(3)} 单位`,
      timestamp,
    });
  }

if (activeMeasureTool.value === "area" && areaMeasurement.areaValues.length > 0) {
    savedMeasurements.value.push({
      type: "面积",
      value:
        areaMeasurement.areaValues.length === 2
          ? `面积1: ${areaMeasurement.areaValues[0].toFixed(3)}㎡, 面积2: ${areaMeasurement.areaValues[1].toFixed(3)}㎡, 重叠: ${areaMeasurement.percentage.toFixed(2)}%`
          : `面积1: ${areaMeasurement.areaValues[0].toFixed(3)}㎡`,
      timestamp,
    });
  }

  if (activeMeasureTool.value === "angle" && angleMeasurement.angle > 0) {
    savedMeasurements.value.push({
      type: "角度",
      value: `${angleMeasurement.angle.toFixed(1)}°`,
      timestamp,
    });
  }

  clearMeasurements();
  ElMessage.success("测量结果已保存");
};

// 移除测量结果（预留功能）
// const removeMeasurement = (index: number) => {
//   savedMeasurements.value.splice(index, 1)
// }

// 获取视角限制提示
const getViewRestrictionHint = (): string => {
  switch (displayMode.value) {
    case "stereo":
      return "立体模式：两个窗口均可同步进行3D视角操作";
    case "side":
      return "侧面模式：在侧面视角只能左右旋转不能上下翻转";
    case "section":
      return "剖面模式：在剖面图只能向着上下拉近拉远，不能左右侧面旋转调整";
    default:
      return "";
  }
};

// 获取缩略图标签
const getThumbnailLabel = (): string => {
  switch (displayMode.value) {
    case "stereo":
      return "同步";
    case "side":
      return "端面";
    case "section":
      return "侧面";
    default:
      return "同步";
  }
};

// 缩略图和轮廓线功能实现
const toggleThumbnail = () => {
  showThumbnail.value = !showThumbnail.value;

  if (showThumbnail.value) {
    // 使用nextTick确保DOM更新后再初始化缩略图
    nextTick(() => {
      setTimeout(() => {
        initThumbnailViewer();
      }, 100); // 给DOM一点时间完全渲染
    });
  } else {
    disposeThumbnailViewer();
  }

  ElMessage.info(showThumbnail.value ? "缩略图窗口已开启" : "缩略图窗口已关闭");
};

const toggleContour = () => {
  showContour.value = !showContour.value;
  if (showContour.value) {
    drawContour();
  }
  ElMessage.info(showContour.value ? "轮廓线显示已开启" : "轮廓线显示已关闭");
};

const initThumbnailViewer = () => {
  if (!thumbnailContainer.value || !thumbnailCanvas.value) {
    console.error("❌ 缩略图DOM元素未准备好");
    return;
  }

  console.log("🖼️ 初始化缩略图视窗...");
  console.log("📐 缩略图容器尺寸:", {
    width: thumbnailContainer.value.clientWidth,
    height: thumbnailContainer.value.clientHeight,
  });

  try {
    // 创建缩略图场景
    thumbnailScene = new THREE.Scene();
    thumbnailScene.background = new THREE.Color(0xf0f0f0);

    // 创建缩略图相机
    const aspect =
      thumbnailContainer.value.clientWidth /
      thumbnailContainer.value.clientHeight;
    thumbnailCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

    // 创建缩略图渲染器
    thumbnailRenderer = new THREE.WebGLRenderer({
      canvas: thumbnailCanvas.value,
      antialias: true,
    });
    thumbnailRenderer.setSize(
      thumbnailContainer.value.clientWidth,
      thumbnailContainer.value.clientHeight
    );
    thumbnailRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能

    // 创建缩略图控制器（根据模式可能被限制）
    thumbnailControls = new OrbitControls(
      thumbnailCamera,
      thumbnailCanvas.value
    );
    thumbnailControls.enableDamping = true;
    thumbnailControls.dampingFactor = 0.05;

    // 根据显示模式设置缩略图视角
    setupThumbnailView();

    // 根据显示模式限制缩略图控制
    applyThumbnailViewRestrictions();

    // 缩略图始终显示点云模型
    loadPointCloudToThumbnail();

    // 立即渲染一次缩略图
    if (thumbnailRenderer && thumbnailScene && thumbnailCamera) {
      thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
    }

    console.log("✅ 缩略图视窗初始化完成");
  } catch (error) {
    console.error("❌ 缩略图视窗初始化失败:", error);
    ElMessage.error("缩略图视窗初始化失败");
  }
};

const setupThumbnailView = () => {
  if (!thumbnailCamera) return;

  switch (displayMode.value) {
    case "stereo":
      // 模式1：立体模式
      // 显示方式：主窗口和缩略窗口都显示相同类型的视图（均为侧面或均为端面）
      if (camera) {
        thumbnailCamera.position.copy(camera.position);
        thumbnailCamera.lookAt(controls?.target || new THREE.Vector3(0, 0, 0));
        // 同步控制器目标点
        if (thumbnailControls) {
          thumbnailControls.target.copy(controls?.target || new THREE.Vector3(0, 0, 0));
        }
      }
      break;
    case "side":
      // 模式2：侧面模式
      // 显示方式：主视图侧面、缩略图端面
      if (controls) {
        // 缩略图显示端面视图，跟随主视图的目标点
        const target = controls.target.clone();
        thumbnailCamera.position.set(target.x, target.y, target.z + 10); // 端面视图（Z轴正方向）
        thumbnailCamera.lookAt(target);
        if (thumbnailControls) {
          thumbnailControls.target.copy(target);
        }
      } else {
        thumbnailCamera.position.set(0, 0, 10); // 默认端面视图
        thumbnailCamera.lookAt(0, 0, 0);
        if (thumbnailControls) {
          thumbnailControls.target.set(0, 0, 0);
        }
      }
      break;
    case "section":
      // 模式3：剖面模式
      // 显示方式：主视图端面、缩略图侧面
      if (controls) {
        // 缩略图显示侧面视图，跟随主视图的目标点
        const target = controls.target.clone();
        thumbnailCamera.position.set(target.x + 10, target.y, target.z); // 侧面视图（X轴正方向）
        thumbnailCamera.lookAt(target);
        if (thumbnailControls) {
          thumbnailControls.target.copy(target);
        }
      } else {
        thumbnailCamera.position.set(10, 0, 0); // 默认侧面视图
        thumbnailCamera.lookAt(0, 0, 0);
        if (thumbnailControls) {
          thumbnailControls.target.set(0, 0, 0);
        }
      }
      break;
  }
};

// 加载点云模型到缩略图
const loadPointCloudToThumbnail = () => {
  if (!thumbnailScene) {
    console.error("❌ 缩略图场景未初始化");
    return;
  }

  console.log("🖼️ 加载点云模型到缩略图...");

  // 清除缩略图场景中的现有模型
  const modelsToRemove = thumbnailScene.children.filter(
    (child) => child instanceof THREE.Mesh || child instanceof THREE.Points
  );
  modelsToRemove.forEach((model) => thumbnailScene.remove(model));

  // 检查点云文件是否存在
  fetch("/Out/sparse_point.ply", { method: "HEAD" })
    .then((response) => {
      if (response.ok) {
        console.log("✅ 点云文件存在，开始加载到缩略图...");
        
        // 使用PLYLoader加载点云
        const loader = new PLYLoader();
        loader.load(
          "/Out/sparse_point.ply",
          (geometry) => {
            console.log("✅ 点云几何体加载成功，顶点数:", geometry.attributes.position.count);
            
            // 创建点云材质
            const material = new THREE.PointsMaterial({
              size: 0.05,
              vertexColors: true,
            });

            // 创建点云对象
            const pointCloud = new THREE.Points(geometry, material);
            pointCloud.visible = true;
            pointCloud.position.set(0, 0, 0);

            // 添加到缩略图场景
            thumbnailScene.add(pointCloud);

            // 立即渲染缩略图
            if (thumbnailRenderer && thumbnailScene && thumbnailCamera) {
              thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
              console.log("🎨 缩略图点云渲染完成");
            }

            console.log("✅ 点云模型已加载到缩略图");
          },
          (progress) => {
            console.log("📊 点云加载进度:", (progress.loaded / progress.total * 100).toFixed(1) + "%");
          },
          (error) => {
            console.error("❌ 点云加载失败:", error);
            ElMessage.error("点云模型加载失败");
          }
        );
      } else {
        console.warn("⚠️ 点云文件不存在，缩略图将显示空白");
        // 即使没有点云文件，也要渲染缩略图
        if (thumbnailRenderer && thumbnailScene && thumbnailCamera) {
          thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
        }
      }
    })
    .catch((error) => {
      console.error("❌ 检查点云文件失败:", error);
      // 即使检查失败，也要渲染缩略图
      if (thumbnailRenderer && thumbnailScene && thumbnailCamera) {
        thumbnailRenderer.render(thumbnailScene, thumbnailCamera);
      }
    });
};

const syncModelToThumbnail = () => {
  if (!thumbnailScene) return;

  // 清除缩略图场景中的模型
  const modelsToRemove = thumbnailScene.children.filter(
    (child) => child instanceof THREE.Mesh || child instanceof THREE.Points
  );
  modelsToRemove.forEach((model) => thumbnailScene.remove(model));

  // 缩略图始终显示点云模型
  if (currentPointCloud) {
    const pointsClone = currentPointCloud.clone();
    thumbnailScene.add(pointsClone);
  } else {
    // 如果没有点云模型，尝试加载点云模型到缩略图
    loadPointCloudToThumbnail();
  }

  // 添加光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  thumbnailScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  thumbnailScene.add(directionalLight);
};

const applyThumbnailViewRestrictions = () => {
  if (!thumbnailControls) return;

  // 在测量模式下不修改控制器设置
  if (measurementMode.value) {
    console.log("🔒 测量模式：跳过缩略图控制器限制设置");
    return;
  }

  switch (displayMode.value) {
    case "stereo":
      // 模式1：立体模式
      // 两个窗口均可同步进行3D视角操作
      thumbnailControls.enableRotate = true;
      thumbnailControls.enablePan = true;
      thumbnailControls.enableZoom = true;
      thumbnailControls.minPolarAngle = 0;
      thumbnailControls.maxPolarAngle = Math.PI;
      thumbnailControls.minAzimuthAngle = -Infinity;
      thumbnailControls.maxAzimuthAngle = Infinity;
      break;
    case "side":
      // 模式2：侧面模式
      // 缩略图显示端面视图，可以自由操作
      thumbnailControls.enableRotate = true;
      thumbnailControls.enablePan = true;
      thumbnailControls.enableZoom = true;
      thumbnailControls.minPolarAngle = 0;
      thumbnailControls.maxPolarAngle = Math.PI;
      thumbnailControls.minAzimuthAngle = -Infinity;
      thumbnailControls.maxAzimuthAngle = Infinity;
      break;
    case "section":
      // 模式3：剖面模式
      // 缩略图显示侧面视图，可以自由操作
      thumbnailControls.enableRotate = true;
      thumbnailControls.enablePan = true;
      thumbnailControls.enableZoom = true;
      thumbnailControls.minPolarAngle = 0;
      thumbnailControls.maxPolarAngle = Math.PI;
      thumbnailControls.minAzimuthAngle = -Infinity;
      thumbnailControls.maxAzimuthAngle = Infinity;
      break;
  }
};

const disposeThumbnailViewer = () => {
  if (thumbnailControls) {
    thumbnailControls.dispose();
  }

  if (thumbnailRenderer) {
    thumbnailRenderer.dispose();
  }
};

const drawContour = () => {
  if (!showContour.value || !contourCanvas.value || !modelContainer.value)
    return;

  console.log("🎨 绘制轮廓线...");

  // 设置轮廓画布尺寸
  const rect = modelContainer.value.getBoundingClientRect();
  contourCanvas.value.width = rect.width;
  contourCanvas.value.height = rect.height;

  const ctx = contourCanvas.value.getContext("2d");
  if (!ctx) return;

  // 清除画布
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 绘制模型轮廓线（简化版本）
  if (currentMesh || currentPointCloud) {
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // 绘制边界框轮廓
    const model = currentMesh || currentPointCloud;
    if (model) {
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 将3D边界框投影到2D屏幕坐标
      const screenCenter = worldToScreen(center);
      const halfWidth = size.x * 50; // 简化的投影计算
      const halfHeight = size.y * 50;

      ctx.beginPath();
      ctx.rect(
        screenCenter.x - halfWidth,
        screenCenter.y - halfHeight,
        halfWidth * 2,
        halfHeight * 2
      );
      ctx.stroke();
    }
  }

  // 绘制直径测量线的轮廓
  if (diameterMeasurement.enabled) {
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    
    const y = diameterMeasurement.yPosition;
    const startX = diameterMeasurement.startX;
    const endX = diameterMeasurement.endX;
    
    // 绘制水平直径线
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // 绘制端点标记
    ctx.fillStyle = "#ffaa00";
    ctx.beginPath();
    ctx.arc(startX, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(endX, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制直径数值
    ctx.fillStyle = "#ffaa00";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${diameterMeasurement.diameter.toFixed(1)}mm`,
      (startX + endX) / 2,
      y - 10
    );
  }

  // 如果有缩略图，也绘制缩略图轮廓
  if (
    showThumbnail.value &&
    thumbnailContourCanvas.value &&
    thumbnailContainer.value
  ) {
    drawThumbnailContour();
  }
};

const drawThumbnailContour = () => {
  if (!thumbnailContourCanvas.value || !thumbnailContainer.value) return;

  const rect = thumbnailContainer.value.getBoundingClientRect();
  thumbnailContourCanvas.value.width = rect.width;
  thumbnailContourCanvas.value.height = rect.height;

  const ctx = thumbnailContourCanvas.value.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, rect.width, rect.height);

  // 绘制缩略图轮廓（不同颜色）
  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  // 简化的轮廓绘制
  ctx.beginPath();
  ctx.rect(
    rect.width * 0.2,
    rect.height * 0.2,
    rect.width * 0.6,
    rect.height * 0.6
  );
  ctx.stroke();

  // 绘制缩略图中的直径测量线
  if (diameterMeasurement.enabled) {
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    // 缩略图中的位置需要按比例缩放
    const scaleX = rect.width / (modelContainer.value?.clientWidth || 800);
    const scaleY = rect.height / (modelContainer.value?.clientHeight || 600);
    
    const y = diameterMeasurement.yPosition * scaleY;
    const startX = diameterMeasurement.startX * scaleX;
    const endX = diameterMeasurement.endX * scaleX;
    
    // 绘制水平直径线
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
    
    // 绘制端点标记
    ctx.fillStyle = "#ffaa00";
    ctx.beginPath();
    ctx.arc(startX, y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(endX, y, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制直径数值
    ctx.fillStyle = "#ffaa00";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${diameterMeasurement.diameter.toFixed(1)}mm`,
      (startX + endX) / 2,
      y - 5
    );
  }
};

// 轮廓测量功能
const toggleContourMeasurement = () => {
  contourMeasurement.enabled = !contourMeasurement.enabled;
  if (contourMeasurement.enabled) {
    ElMessage.success("轮廓测量已开启，点击触发黄线标记，可拖动");
  } else {
    ElMessage.info("轮廓测量已关闭");
  }
};

// 整体水平直径测量功能
const toggleDiameterMeasurement = () => {
  diameterMeasurement.enabled = !diameterMeasurement.enabled;
  if (diameterMeasurement.enabled) {
    // 初始化测量线位置
    if (modelContainer.value) {
      const rect = modelContainer.value.getBoundingClientRect();
      diameterMeasurement.yPosition = rect.height / 2;
      diameterMeasurement.startX = rect.width * 0.2;
      diameterMeasurement.endX = rect.width * 0.8;
      calculateDiameter();
    }
    ElMessage.success("整体水平直径测量已开启，可拖动测量线调整位置");
  } else {
    ElMessage.info("整体水平直径测量已关闭");
  }
};

const startDragDiameter = (event: MouseEvent) => {
  if (!diameterMeasurement.enabled) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const rect = modelContainer.value?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // 判断是拖动整条线还是端点
  const lineY = diameterMeasurement.yPosition;
  const startX = diameterMeasurement.startX;
  const endX = diameterMeasurement.endX;
  
  // 检查是否点击在端点附近
  const handleRadius = 10;
  const distanceToStart = Math.sqrt((mouseX - startX) ** 2 + (mouseY - lineY) ** 2);
  const distanceToEnd = Math.sqrt((mouseX - endX) ** 2 + (mouseY - lineY) ** 2);
  
  if (distanceToStart <= handleRadius) {
    diameterMeasurement.isDraggingStart = true;
    console.log("🎯 开始拖动直径测量线起点");
  } else if (distanceToEnd <= handleRadius) {
    diameterMeasurement.isDraggingEnd = true;
    console.log("🎯 开始拖动直径测量线终点");
  } else if (Math.abs(mouseY - lineY) <= 5 && mouseX >= startX && mouseX <= endX) {
    diameterMeasurement.isDragging = true;
    diameterMeasurement.dragStartY = mouseY - lineY;
    console.log("🎯 开始拖动直径测量线");
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!diameterMeasurement.enabled) return;
    
    const rect = modelContainer.value?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (diameterMeasurement.isDragging) {
      // 拖动整条线
      const newY = mouseY - diameterMeasurement.dragStartY;
      diameterMeasurement.yPosition = Math.max(50, Math.min(rect.height - 50, newY));
    } else if (diameterMeasurement.isDraggingStart) {
      // 拖动起点
      diameterMeasurement.startX = Math.max(50, Math.min(diameterMeasurement.endX - 50, mouseX));
    } else if (diameterMeasurement.isDraggingEnd) {
      // 拖动终点
      diameterMeasurement.endX = Math.max(diameterMeasurement.startX + 50, Math.min(rect.width - 50, mouseX));
    }
    
    // 计算直径
    calculateDiameter();
    
    // 实时更新轮廓线
    if (showContour.value) {
      drawContour();
    }
  };

  const handleMouseUp = () => {
    diameterMeasurement.isDragging = false;
    diameterMeasurement.isDraggingStart = false;
    diameterMeasurement.isDraggingEnd = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    console.log("✅ 结束拖动直径测量线");
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const calculateDiameter = () => {
  // 基于测量线位置和模型数据计算实际直径
  if (!currentMesh && !currentPointCloud) {
    diameterMeasurement.diameter = 615.0; // 默认值
    return;
  }

  // 简化版本：基于测量线的像素宽度和模型边界框估算
  const pixelWidth = diameterMeasurement.endX - diameterMeasurement.startX;
  const model = currentMesh || currentPointCloud;

  if (model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // 假设模型单位是米，转换为毫米
    diameterMeasurement.diameter = (pixelWidth / 400) * maxDim * 1000;
  } else {
    diameterMeasurement.diameter = 615.0;
  }
};

// 调试信息函数
const debugInfo = () => {
  console.log("🔍 调试信息:");
  console.log("主视图状态:", {
    hasContainer: !!modelContainer.value,
    hasCanvas: !!modelCanvas.value,
    containerSize: modelContainer.value
      ? {
          width: modelContainer.value.clientWidth,
          height: modelContainer.value.clientHeight,
        }
      : null,
    hasScene: !!scene,
    hasCamera: !!camera,
    hasRenderer: !!renderer,
    hasControls: !!controls,
    sceneChildren: scene?.children.length || 0,
  });

  console.log("缩略图状态:", {
    isVisible: showThumbnail.value,
    hasContainer: !!thumbnailContainer.value,
    hasCanvas: !!thumbnailCanvas.value,
    containerSize: thumbnailContainer.value
      ? {
          width: thumbnailContainer.value.clientWidth,
          height: thumbnailContainer.value.clientHeight,
        }
      : null,
    hasScene: !!thumbnailScene,
    hasCamera: !!thumbnailCamera,
    hasRenderer: !!thumbnailRenderer,
    hasControls: !!thumbnailControls,
    sceneChildren: thumbnailScene?.children.length || 0,
  });

  console.log("模型状态:", {
    hasMesh: !!currentMesh,
    hasPointCloud: !!currentPointCloud,
    modelType: currentModelType.value,
    vertexCount: modelVertexCount.value,
    faceCount: modelFaceCount.value,
  });

  ElMessage.info("调试信息已输出到控制台");
};

// 测试缩略图同步函数
const testThumbnailSync = () => {
  console.log("🧪 测试缩略图同步...");
  
  if (!controls || !thumbnailCamera || !thumbnailControls) {
    console.error("❌ 控制器未准备好");
    ElMessage.error("控制器未准备好");
    return;
  }
  
  // 模拟主视图控制器变化
  const originalTarget = controls.target.clone();
  controls.target.set(originalTarget.x + 5, originalTarget.y + 3, originalTarget.z + 2);
  controls.update();
  
  console.log("🔄 主视图目标点已改变:", {
    original: originalTarget,
    new: controls.target.clone()
  });
  
  // 手动触发同步
  onMainControlsChange();
  
  ElMessage.success("缩略图同步测试完成，请查看控制台");
};

// 检查控制器状态函数
const checkControlsStatus = () => {
  console.log("🔍 检查控制器状态:");
  console.log("测量模式:", measurementMode.value);
  console.log("主视图控制器:", {
    exists: !!controls,
    enabled: controls?.enabled,
    enableRotate: controls?.enableRotate,
    enablePan: controls?.enableZoom,
    enableZoom: controls?.enableZoom
  });
  console.log("缩略图控制器:", {
    exists: !!thumbnailControls,
    enabled: thumbnailControls?.enabled,
    enableRotate: thumbnailControls?.enableRotate,
    enablePan: thumbnailControls?.enableZoom,
    enableZoom: thumbnailControls?.enableZoom
  });
  
  // 强制设置正确的状态
  if (measurementMode.value) {
    if (controls) controls.enabled = false;
    if (thumbnailControls) thumbnailControls.enabled = false;
    console.log("🔒 已强制禁用控制器");
  } else {
    if (controls) controls.enabled = true;
    if (thumbnailControls) thumbnailControls.enabled = true;
    console.log("🔓 已强制启用控制器");
  }
  
  ElMessage.info("控制器状态已检查并修正，请查看控制台");
};

// 测试微调功能
const testAdjustView = () => {
  console.log("🧪 测试微调功能");
  console.log("当前状态:", {
    fineTuneMode: fineTuneMode.value,
    hasCamera: !!camera,
    hasControls: !!controls,
    cameraPosition: camera?.position,
    controlsTarget: controls?.target
  });
  
  // 测试向上调整
  adjustView('up');
  
  ElMessage.success("测试完成，请查看控制台");
};

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (modelCanvas.value) {
    modelCanvas.value.removeEventListener("click", onCanvasClick);
  }

  window.removeEventListener("resize", onWindowResize);

  if (controls) {
    controls.removeEventListener('change', onMainControlsChange);
    controls.dispose();
  }

  if (renderer) {
    renderer.dispose();
  }
};
</script>

<style scoped>
.model-3d-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

/* 顶部紧凑控制栏 */
.top-control-bar {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  min-height: 48px;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
}

.value-display {
  font-size: 11px;
  color: #909399;
  min-width: 35px;
  margin-left: 4px;
}

/* 主体布局 */
.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧工具面板 */
.left-sidebar {
  width: 220px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tool-panel {
  border-bottom: 1px solid #f0f0f0;
}

.panel-header {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.panel-content {
  padding: 12px;
}

.compact-settings {
  margin-bottom: 12px;
}

.direction-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.direction-row {
  display: flex;
  gap: 4px;
}

.measurement-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.debug-tools {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 500;
}

/* 双窗口布局 */
.viewer-layout {
  display: flex;
  gap: 12px;
  flex: 1;
  padding: 12px;
  overflow: hidden;
}

.main-viewer {
  flex: 2;
}

.thumbnail-viewer {
  flex: 1;
  max-width: 300px;
  min-width: 200px;
  min-height: 150px;
  position: relative;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.thumbnail-label {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

.model-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.model-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

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
}

.loading-overlay .is-loading {
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

/* 交互提示 */
.interaction-hints {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 10;
}

.interaction-hints p {
  margin: 0;
  line-height: 1.4;
}

/* 自动贴合实时预览光标 */
.snap-preview-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 15;
  transform: translate(-50%, -50%);
}

.cursor-ring {
  width: 24px;
  height: 24px;
  border: 2px solid #00ff88;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.cursor-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 测量点标记（新版本） */
.measurement-marker {
  position: absolute;
  pointer-events: none;
  z-index: 12;
  transform: translate(-50%, -50%);
}

.marker-ring {
  width: 20px;
  height: 20px;
  border: 2px solid #ff4444;
  border-radius: 50%;
  background: rgba(255, 68, 68, 0.2);
}

.marker-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #ff4444;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(255, 68, 68, 0.8);
}

.marker-label {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

/* 微调设置样式 */
.fine-tune-settings {
  margin-top: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.fine-tune-settings .setting-item {
  margin-bottom: 8px;
}

.fine-tune-settings .setting-item:last-child {
  margin-bottom: 0;
}

.fine-tune-settings .setting-label {
  font-size: 12px;
  color: #666;
  min-width: 60px;
  display: inline-block;
}

/* 测量工具列表样式 */
.measurement-tools-list {
  margin-bottom: 12px;
}

.measurement-tool-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.measurement-tool-item:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.measurement-tool-item.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

.tool-icon {
  font-size: 16px;
  margin-right: 8px;
  min-width: 20px;
}

.tool-info {
  flex: 1;
}

.tool-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
}

.tool-value {
  font-size: 11px;
  color: #666;
  font-weight: bold;
}

.measurement-tool-item.active .tool-value {
  color: #fff;
}

/* 轮廓测量控制面板 */
.contour-controls {
  margin-top: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.contour-info {
  margin-top: 8px;
}

.contour-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #666;
}

.contour-info p:last-child {
  color: #ffaa00;
  font-weight: bold;
}

/* 直径测量控制面板 */
.diameter-controls {
  margin-top: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.diameter-info {
  margin-top: 8px;
}

.diameter-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #666;
}

.diameter-info p:last-child {
  color: #ff4444;
  font-weight: bold;
}

/* 整体水平直径测量线样式 */
.diameter-measurement {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.diameter-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, #ffaa00, #ff8800);
  border-radius: 1px;
  pointer-events: auto;
  cursor: move;
  box-shadow: 0 2px 4px rgba(255, 170, 0, 0.3);
}

.diameter-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #ffaa00;
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: ew-resize;
  top: -5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.diameter-handle.left {
  left: -6px;
}

.diameter-handle.right {
  right: -6px;
}

.diameter-value {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 170, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.diameter-value.small {
  font-size: 10px;
  padding: 2px 6px;
  top: -20px;
}

/* 缩略图直径测量 */
.thumbnail-diameter .diameter-line {
  background: #ff6666;
  height: 1px;
  pointer-events: none;
  cursor: default;
}

/* 轮廓线叠加层增强 */
.contour-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 15;
  width: 100%;
  height: 100%;
}

/* 测量模式样式 */
.measurement-mode {
  position: relative;
}

.measurement-mode-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 170, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.measurement-mode-indicator .el-icon {
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .viewer-layout {
    flex-direction: column;
  }

  .thumbnail-viewer {
    max-width: none;
    max-height: 200px;
  }

  .left-sidebar {
    width: 200px;
  }
}
</style>
