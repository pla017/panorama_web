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

      <!-- 显示模式 -->
      <div class="control-section">
        <span class="section-label">模式:</span>
        <el-radio-group
          v-model="displayMode"
          @change="changeDisplayMode"
          size="small"
        >
          <el-radio-button value="stereo">立体</el-radio-button>
          <el-radio-button value="side">侧面</el-radio-button>
          <el-radio-button value="section">剖面</el-radio-button>
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
          <el-button
            @click="togglePoints"
            :type="showPoints ? 'primary' : 'default'"
          >
            点
          </el-button>
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
          </div>
        </div>

        <!-- 测量工具 -->
        <div class="tool-panel">
          <div class="panel-header">
            <h4>测量工具</h4>
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

            <el-tabs v-model="activeMeasureTool" size="small" type="card">
              <el-tab-pane label="距离" name="distance"></el-tab-pane>
              <el-tab-pane label="面积" name="area"></el-tab-pane>
              <el-tab-pane label="角度" name="angle"></el-tab-pane>
              <el-tab-pane label="直径" name="diameter"></el-tab-pane>
            </el-tabs>

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
                <p>拖动测量线调整位置</p>
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
        <div ref="modelContainer" class="model-container main-viewer">
          <canvas ref="modelCanvas" class="model-canvas"></canvas>

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

          <!-- 水平直径测量线 -->
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
              <div class="diameter-handle left"></div>
              <div class="diameter-handle right"></div>
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
const rotationSpeed = ref(1.0);
const panDistance = ref(1.0);

// 水平直径测量
const diameterMeasurement = reactive({
  enabled: false,
  yPosition: 200,
  startX: 100,
  endX: 300,
  diameter: 615.0, // 默认显示615mm，如图片所示
  isDragging: false,
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
});

const areaMeasurement = reactive({
  points: [] as THREE.Vector3[],
  area: 0,
});

const angleMeasurement = reactive({
  points: [] as THREE.Vector3[],
  angle: 0,
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
    // 自动检查文件
    setTimeout(() => {
      checkFiles();
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

    // 自动创建测试模型，确保首次加载有内容显示
    setTimeout(() => {
      if (!currentMesh && !currentPointCloud) {
        console.log("🔄 自动创建测试模型...");
        createTestModel();
      }
    }, 500);
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

  if (controls) {
    controls.update();
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

const onCanvasClick = (event: MouseEvent) => {
  if (!measurementMode.value || !modelCanvas.value) return;

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
        if (points.length > 2) {
          currentMeasurementPoints.value = currentMeasurementPoints.value.slice(
            0,
            2
          );
        }
      }
      break;

    case "area":
      if (points.length >= 3) {
        areaMeasurement.points = [...points];
        areaMeasurement.area = calculatePolygonArea(points);
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
          currentMeasurementPoints.value = currentMeasurementPoints.value.slice(
            0,
            3
          );
        }
      }
      break;
  }
};

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

// 创建测试模型（用于调试）
const createTestModel = () => {
  try {
    console.log("🧪 创建测试模型...");

    if (!scene) {
      console.error("❌ 场景未初始化");
      ElMessage.error("场景未初始化，请先切换到3D模型模式");
      return;
    }

    // 清除之前的模型
    if (currentMesh) {
      console.log("🗑️ 移除之前的网格模型");
      scene.remove(currentMesh);
    }
    if (currentPointCloud) {
      console.log("🗑️ 移除之前的点云模型");
      scene.remove(currentPointCloud);
    }

    console.log("🔨 创建立方体几何体和材质...");

    // 创建一个简单的立方体
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({
      color: 0x00aa00,
      side: THREE.DoubleSide,
    });

    console.log("🔗 创建网格对象并添加到场景...");
    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);

    // 更新模型信息
    currentModelType.value = "测试立方体";
    modelVertexCount.value = geometry.attributes.position.count;
    modelFaceCount.value = 12; // 立方体有12个面

    console.log("📊 测试模型统计:", {
      type: currentModelType.value,
      vertices: modelVertexCount.value,
      faces: modelFaceCount.value,
      sceneChildren: scene.children.length,
    });

    // 重置相机位置
    console.log("📷 重置相机位置...");
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();

    console.log("✅ 测试模型创建完成！");
    ElMessage.success("测试模型创建成功！应该能看到一个绿色立方体");
  } catch (error) {
    console.error("❌ 创建测试模型失败:", error);
    ElMessage.error(
      `创建测试模型失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
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

  // 根据模式调整主视图控制器限制
  if (controls) {
    switch (mode) {
      case "stereo":
        // 立体模式：无限制
        controls.enableRotate = true;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        break;
      case "side":
        // 侧面模式：主视图侧面，只能左右旋转
        controls.enableRotate = true;
        controls.minPolarAngle = Math.PI / 2 - 0.1;
        controls.maxPolarAngle = Math.PI / 2 + 0.1;
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        break;
      case "section":
        // 剖面模式：主视图端面，只能上下移动
        controls.enableRotate = false;
        controls.enablePan = true;
        controls.enableZoom = true;
        break;
    }
  }

  // 如果缩略图开启，更新缩略图视角和限制
  if (showThumbnail.value && thumbnailCamera) {
    setupThumbnailView();
    applyThumbnailViewRestrictions();
  }

  // 更新轮廓线
  if (showContour.value) {
    drawContour();
  }

  ElMessage.info(`已切换到${getDisplayModeName(mode)}`);
};

const getDisplayModeName = (mode: string): string => {
  const names: Record<string, string> = {
    stereo: "立体模式",
    side: "侧面模式",
    section: "剖面模式",
  };
  return names[mode] || "未知模式";
};

// 位置微调
const toggleFineTuneMode = () => {
  fineTuneMode.value = !fineTuneMode.value;
  ElMessage.info(
    fineTuneMode.value ? "已开启位置微调模式" : "已关闭位置微调模式"
  );
};

const adjustView = (direction: string) => {
  if (!camera || !controls) return;

  const speed = rotationSpeed.value * 0.1;
  const distance = panDistance.value * 0.5;

  switch (direction) {
    case "up":
      if (displayMode.value === "section") {
        camera.position.y += distance;
      } else {
        // 手动旋转相机
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.phi -= speed * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
      }
      break;
    case "down":
      if (displayMode.value === "section") {
        camera.position.y -= distance;
      } else {
        // 手动旋转相机
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.phi += speed * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
      }
      break;
    case "left":
      if (displayMode.value !== "section") {
        // 手动旋转相机
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.theta += speed * 0.01;
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
      }
      break;
    case "right":
      if (displayMode.value !== "section") {
        // 手动旋转相机
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        spherical.theta -= speed * 0.01;
        camera.position.copy(
          new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
        );
        camera.lookAt(controls.target);
      }
      break;
    case "center":
      // 重置到中心
      controls.target.set(0, 0, 0);
      break;
  }

  controls.update();
};

const toggleMeasurementMode = () => {
  measurementMode.value = !measurementMode.value;
  if (!measurementMode.value) {
    clearMeasurements();
  }
};

const clearMeasurements = () => {
  currentMeasurementPoints.value = [];
  distanceMeasurement.points = [];
  distanceMeasurement.distance = 0;
  areaMeasurement.points = [];
  areaMeasurement.area = 0;
  angleMeasurement.points = [];
  angleMeasurement.angle = 0;
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

  if (activeMeasureTool.value === "area" && areaMeasurement.area > 0) {
    savedMeasurements.value.push({
      type: "面积",
      value: `${areaMeasurement.area.toFixed(3)} 平方单位`,
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
    case "side":
      return "侧面模式：只能左右旋转，不能上下翻转";
    case "section":
      return "剖面模式：只能上下拉近拉远，不能左右旋转";
    default:
      return "";
  }
};

// 获取缩略图标签
const getThumbnailLabel = (): string => {
  switch (displayMode.value) {
    case "side":
      return "端面视图";
    case "section":
      return "侧面视图";
    default:
      return "同步视图";
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

    // 根据显示模式设置缩略图视角
    setupThumbnailView();

    // 复制主场景的模型到缩略图场景
    syncModelToThumbnail();

    // 创建缩略图控制器（根据模式可能被限制）
    thumbnailControls = new OrbitControls(
      thumbnailCamera,
      thumbnailCanvas.value
    );
    thumbnailControls.enableDamping = true;
    thumbnailControls.dampingFactor = 0.05;

    // 根据显示模式限制缩略图控制
    applyThumbnailViewRestrictions();

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
      // 立体模式：与主视图同步
      if (camera) {
        thumbnailCamera.position.copy(camera.position);
        thumbnailCamera.lookAt(0, 0, 0);
      }
      break;
    case "side":
      // 侧面模式：主视图侧面，缩略图端面
      thumbnailCamera.position.set(0, 0, 10); // 端面视图
      thumbnailCamera.lookAt(0, 0, 0);
      break;
    case "section":
      // 剖面模式：主视图端面，缩略图侧面
      thumbnailCamera.position.set(10, 0, 0); // 侧面视图
      thumbnailCamera.lookAt(0, 0, 0);
      break;
  }
};

const syncModelToThumbnail = () => {
  if (!thumbnailScene) return;

  // 清除缩略图场景中的模型
  const modelsToRemove = thumbnailScene.children.filter(
    (child) => child instanceof THREE.Mesh || child instanceof THREE.Points
  );
  modelsToRemove.forEach((model) => thumbnailScene.remove(model));

  // 复制当前模型到缩略图场景
  if (currentMesh) {
    const meshClone = currentMesh.clone();
    thumbnailScene.add(meshClone);
  }

  if (currentPointCloud) {
    const pointsClone = currentPointCloud.clone();
    thumbnailScene.add(pointsClone);
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

  switch (displayMode.value) {
    case "stereo":
      // 立体模式：无限制，可同步操作
      thumbnailControls.enableRotate = true;
      thumbnailControls.minPolarAngle = 0;
      thumbnailControls.maxPolarAngle = Math.PI;
      thumbnailControls.minAzimuthAngle = -Infinity;
      thumbnailControls.maxAzimuthAngle = Infinity;
      break;
    case "side":
      // 侧面模式：缩略图为端面视图，限制为只能前后移动
      thumbnailControls.enableRotate = false;
      thumbnailControls.enablePan = true;
      thumbnailControls.enableZoom = true;
      break;
    case "section":
      // 剖面模式：缩略图为侧面视图，限制为只能左右旋转
      thumbnailControls.enableRotate = true;
      thumbnailControls.minPolarAngle = Math.PI / 2 - 0.1;
      thumbnailControls.maxPolarAngle = Math.PI / 2 + 0.1;
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
};

// 水平直径测量功能
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
    ElMessage.success("水平直径测量已开启，拖动测量线调整位置");
  } else {
    ElMessage.info("水平直径测量已关闭");
  }
};

const startDragDiameter = () => {
  diameterMeasurement.isDragging = true;

  const handleMouseMove = (e: MouseEvent) => {
    if (diameterMeasurement.isDragging && modelContainer.value) {
      const rect = modelContainer.value.getBoundingClientRect();
      diameterMeasurement.yPosition = e.clientY - rect.top;
      calculateDiameter();

      // 实时更新轮廓线
      if (showContour.value) {
        drawContour();
      }
    }
  };

  const handleMouseUp = () => {
    diameterMeasurement.isDragging = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
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

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (modelCanvas.value) {
    modelCanvas.value.removeEventListener("click", onCanvasClick);
  }

  window.removeEventListener("resize", onWindowResize);

  if (controls) {
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

/* 水平直径测量线样式增强 */
.diameter-measurement .diameter-line {
  box-shadow: 0 0 4px rgba(255, 68, 68, 0.5);
}

.diameter-measurement .diameter-value {
  background: rgba(255, 68, 68, 0.9);
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
