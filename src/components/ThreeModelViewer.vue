<template>
  <div class="model-viewer-container">
    <!-- 顶部工具栏 -->
    <div class="model-toolbar" @click.stop>
      <div class="toolbar-left">
        <button class="tool-btn" @click="resetView" title="重置视角">
          重置
        </button>
        <button
          class="tool-btn"
          @click="toggleGrid"
          :class="{ active: gridVisible }"
          title="网格"
        >
          网格
        </button>
        <button
          class="tool-btn"
          @click="toggleWireframe"
          :class="{ active: wireframeEnabled }"
          title="线框"
        >
          线框
        </button>
        <!-- <button class="tool-btn" @click="reloadModel" title="重新加载">
          重载
        </button> -->
      </div>
      <div class="toolbar-right">
        <div class="mode-group">
          <button class="tool-btn" :class="{active: viewMode==='stereo'}" @click="setMode('stereo')">立体</button>
          <button class="tool-btn" :class="{active: viewMode==='side'}" @click="setMode('side')">侧面</button>
          <button class="tool-btn" :class="{active: viewMode==='section'}" @click="setMode('section')">剖面</button>
        </div>
        <button class="tool-btn" @click="toggleMiniMap" title="缩略图">缩略图</button>
        <button class="tool-btn" @click="toggleSettings" title="更多设置">设置</button>
        <button class="tool-btn" :class="{active: showMeasure}" @click="toggleMeasure" title="测量">
          {{ showMeasure ? '隐藏测量' : '测量' }}
        </button>
        <button class="tool-btn" @click="toggleFullscreen" title="全屏">全屏</button>

        <!-- 悬浮设置面板 -->
        <div v-if="showSettings" class="settings-popover" @click.stop>
          <div class="settings-section">
            <div class="section-title">视角预设</div>
            <div class="preset-row">
              <button class="preset-btn" @click="setTopView">顶视图</button>
              <button class="preset-btn" @click="setInsideBottomView">
                底视图
              </button>
              <button class="preset-btn" @click="setSideView">侧视图</button>
            </div>
          </div>
          <div class="settings-section">
            <div class="section-title">透明度</div>
            <div class="slider-row">
              <input
                class="slider"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                v-model.number="opacity"
                @input="applyOpacity"
              />
              <span class="slider-value">{{ opacity.toFixed(2) }}</span>
            </div>
          </div>
          <div class="settings-section">
            <div class="section-title">亮度</div>
            <div class="slider-row">
              <input
                class="slider"
                type="range"
                min="0.2"
                max="2"
                step="0.05"
                v-model.number="brightness"
                @input="applyBrightness"
              />
              <span class="slider-value">{{ brightness.toFixed(2) }}</span>
            </div>
          </div>
          <div class="settings-section">
            <div class="section-title">微调（平移相机/目标）</div>
            <div class="nudge-grid">
              <div></div>
              <button class="nudge-btn" @click="nudge(0, 1)" title="上">
                ↑
              </button>
              <div></div>
              <button class="nudge-btn" @click="nudge(-1, 0)" title="左">
                ←
              </button>
              <button class="nudge-btn center" @click="resetView" title="重置">
                ●
              </button>
              <button class="nudge-btn" @click="nudge(1, 0)" title="右">
                →
              </button>
              <div></div>
              <button class="nudge-btn" @click="nudge(0, -1)" title="下">
                ↓
              </button>
              <div></div>
            </div>
            <div class="slider-row" style="margin-top: 8px">
              <label class="slider-label">步长</label>
              <input
                class="slider"
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                v-model.number="nudgeScale"
              />
              <span class="slider-value">{{ nudgeScale.toFixed(1) }}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="modelContainer" class="model-container">
      <canvas ref="modelCanvas" class="model-canvas"></canvas>
      <!-- 测量工具面板（左侧布局，可拖拽） -->
      <div v-if="showMeasure" class="measure-panel" @click.stop>
        <div class="panel-header" @mousedown="startDrag">
          <span class="panel-title">测量工具</span>
          <div class="panel-controls">
            <button class="control-btn" @click="toggleMeasurePanel" title="最小化">{{ measurePanelMinimized ? '+' : '−' }}</button>
            <button class="control-btn" @click="hideMeasure" title="隐藏">×</button>
          </div>
        </div>
        
        <div v-if="!measurePanelMinimized" class="panel-content">
          <div v-if="!measurePanelMinimized" class="preset-row">
            <button class="preset-btn" :class="{ active: measureMode==='slice_diameter' }" @click="setMeasureMode('slice_diameter')">剖面</button>
            <button class="preset-btn" :class="{ active: measureMode==='distance' }" @click="setMeasureMode('distance')">测距</button>
            <button class="preset-btn" :class="{ active: measureMode==='circle' }" @click="setMeasureMode('circle')">测圆</button>
            <button class="preset-btn" :class="{ active: measureMode==='area' }" @click="setMeasureMode('area')">测面</button>
          </div>
          
          <!-- 最小化状态下显示当前模式 -->
          <div v-else class="minimized-info">
            <span class="current-mode">{{ getCurrentModeName() }}</span>
          </div>
        </div>
        <div v-if="measureMode==='slice_diameter'" class="settings-section">
          <div class="section-title">水平剖面直径</div>
          <div class="slider-row">
            <label class="slider-label">Y</label>
            <input class="slider" type="range" :min="measureMinY" :max="measureMaxY" :step="measureStep" v-model.number="sliceY" @input="updateSlice" />
            <span class="slider-value">{{ sliceY.toFixed(3) }}</span>
          </div>
          <div class="hint-row">按住 Shift 并上下拖拽调整剖面</div>
          <div class="result-row" v-if="diameterValue > 0">直径：{{ diameterValue.toFixed(3) }}</div>
          <div class="result-row" v-else>无有效剖面</div>
        </div>
        <div v-if="measureMode==='distance'" class="settings-section">
          <div class="section-title">测距（点击选取起点与终点）</div>
          <div class="hint-row">单位自动切换：&lt;1000mm 显示 mm，≥1000mm 显示 m</div>
          <div class="result-row">
            直线距离：{{ distanceDisplay }}
          </div>
          <div class="result-row">
            垂直百分比：{{ verticalPercentText }}
          </div>
          <div class="result-row">
            浮标百分比（终点→浮标）：{{ markerPercentText }}
          </div>
          <div class="hint-row">可点击直线设置浮标，或按住拖动浮标</div>
        </div>
        <div v-if="measureMode==='circle'" class="settings-section">
          <div class="section-title">测圆（滚轮调直径，每次50mm）</div>
          <div class="result-row">直径：{{ circleDiameterText }}</div>
        </div>
        <div v-if="measureMode==='area'" class="settings-section">
          <div class="section-title">测面（圆/多边形，最多两个面，计算重叠）</div>
          <div class="preset-row">
            <button class="preset-btn" :class="{ active: areaSubMode==='circle' }" @click="setAreaSubMode('circle')">圆形</button>
            <button class="preset-btn" :class="{ active: areaSubMode==='polygon' }" @click="setAreaSubMode('polygon')">多边形</button>
          </div>
          <div class="hint-row" v-if="areaSubMode==='circle'">在模型上移动鼠标设置圆心，滚轮每次±50mm 调整直径</div>
          <div class="hint-row" v-else>单击添加顶点，双击闭合；右键撤销最近点</div>
          <div class="result-row">面1面积：{{ area1Text }}</div>
          <div class="result-row">面2面积：{{ area2Text }}</div>
          <div class="result-row">重叠面积：{{ overlapAreaText }}</div>
          <div class="result-row">重叠占比（相对面1）：{{ overlapPercentText }}</div>
          <div class="hint-row">提示：最多可绘制两个面，新增第三个时将清空并从头开始</div>
        </div>
                 <div class="settings-section">
           <div class="preset-row">
             <button class="preset-btn" @click="exportMeasurementsJSON">导出JSON</button>
             <button class="preset-btn" @click="exportMiniPNG" :disabled="!showMiniMap">导出缩略图</button>
             <button class="preset-btn" @click="exportMainViewPNG">导出主视图</button>
           </div>
         </div>
      </div>
      <!-- 缩略图（右上角） -->
      <div v-if="showMiniMap" class="mini-map">
        <canvas ref="miniCanvas" class="mini-canvas"></canvas>
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
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import config from '@/config/resource'

const props = withDefaults(
  defineProps<{
    modelUrl?: string;
    background?: number;
  }>(),
  {
    modelUrl: config.mesh,
    background: 0xf0f0f0,
  }
);

const modelContainer = ref<HTMLDivElement>();
const modelCanvas = ref<HTMLCanvasElement>();
const miniCanvas = ref<HTMLCanvasElement>();

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;
let currentMesh: THREE.Mesh | null = null;
let gridHelper: THREE.GridHelper | null = null;
let ambientLight: THREE.AmbientLight | null = null;
let dirLight: THREE.DirectionalLight | null = null;

// mini map 独立场景/渲染器/相机/对象
let miniScene: THREE.Scene | null = null;
let miniRenderer: THREE.WebGLRenderer | null = null;
let miniCamera: THREE.OrthographicCamera | null = null;
let miniPoints: THREE.Points | null = null;
let miniOverlays: Array<THREE.Object3D> = [];

const gridVisible = ref(true);
const wireframeEnabled = ref(false);
const opacity = ref(1);
const brightness = ref(1);
const showSettings = ref(false);
const nudgeScale = ref(1);
const showMiniMap = ref(false);
type ViewMode = 'stereo' | 'side' | 'section';
const viewMode = ref<ViewMode>('stereo');

// ===== 测量工具：状态 =====
const showMeasure = ref(false);
const measurePanelMinimized = ref(false);
type MeasureMode = 'slice_diameter' | 'distance' | 'circle' | 'area';
const measureMode = ref<MeasureMode>('slice_diameter');
const sliceY = ref(0);
const measureMinY = ref(-5);
const measureMaxY = ref(5);
const measureStep = ref(0.001);
let contourLine: any = null;
let diameterLine: any = null;
let diameterLabel: THREE.Sprite | null = null;
const diameterValue = ref(0);
let shiftDragging = false;
let lastMouseY = 0;
let contourMat: LineMaterial | null = null;
let diameterMat: LineMaterial | null = null;

// 测距
const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2();
let distStart: THREE.Vector3 | null = null;
let distEnd: THREE.Vector3 | null = null;
let distLine: any = null;
let distMarker: THREE.Mesh | null = null;
let draggingMarker = false;
const markerPercent = ref(0);
const distanceDisplay = ref('—');
const markerPercentText = ref('—');
const verticalPercentText = ref('—');
// 预留给“测圆”工具（UI 已显示），先以只读文本使用
const circleDiameterText = ref('300 mm');
// 文本值未在模板使用，移除避免未使用告警

// 测圆
const circleDiameterMm = ref(300); // 默认 300mm
let circleCenter: THREE.Vector3 | null = null;
let circleLine: any = null;
let circleLabel: THREE.Sprite | null = null;

// 测面
type AreaSubMode = 'circle' | 'polygon';
const areaSubMode = ref<AreaSubMode>('circle');
let areaShapes: Array<{ type: 'circle'|'polygon', y: number, center?: THREE.Vector3, radiusM?: number, points?: THREE.Vector3[], line?: any, fill?: THREE.Mesh, label?: THREE.Sprite, areaM2?: number }>=[];
const area1Text = ref('—');
const area2Text = ref('—');
const overlapAreaText = ref('—');
const overlapPercentText = ref('—');

// 点击外部关闭设置面板
const handleClickOutside = () => {
  showSettings.value = false;
  showMeasure.value = false;
};

// 缓存模型包围盒中心与尺寸（主视图）
const modelCenter = new THREE.Vector3();
const modelSize = new THREE.Vector3();

const initScene = () => {
  if (!modelContainer.value || !modelCanvas.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.background);

  const aspect =
    modelContainer.value.clientWidth / modelContainer.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 5000);
  camera.position.set(5, 5, 5);

  renderer = new THREE.WebGLRenderer({
    canvas: modelCanvas.value,
    antialias: true,
  });
  renderer.setSize(
    modelContainer.value.clientWidth,
    modelContainer.value.clientHeight
  );
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
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  modelCanvas.value.addEventListener("mousedown", onMouseDown);
  modelCanvas.value.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  modelCanvas.value.addEventListener('wheel', onWheel, { passive: true });
  modelCanvas.value.addEventListener('contextmenu', onContextMenu);
};

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const toggleMeasure = () => {
  showMeasure.value = !showMeasure.value;
  if (showMeasure.value) {
    updateBoundsForMeasure();
    updateSlice();
  } else {
    clearMeasureDrawings();
    clearDistance();
    clearCircle();
    clearAreas();
  }
};

const toggleMeasurePanel = () => {
  measurePanelMinimized.value = !measurePanelMinimized.value;
};

const getCurrentModeName = () => {
  const modeNames = {
    'slice_diameter': '剖面直径',
    'distance': '直线测距',
    'circle': '圆形测量',
    'area': '面积测量'
  };
  return modeNames[measureMode.value] || '测量工具';
};

// 面板拖拽功能
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
// 面板初始位置已固定，移除未使用的起始位置变量

const startDrag = (e: MouseEvent) => {
  if (e.target !== e.currentTarget) return; // 只允许拖拽标题栏
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging) return;
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  // 这里可以通过CSS transform来移动面板
  const panel = document.querySelector('.measure-panel') as HTMLElement;
  if (panel) {
    panel.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }
};

const stopDrag = () => {
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const hideMeasure = () => {
  showMeasure.value = false;
};

const setMeasureMode = (m: MeasureMode) => {
  measureMode.value = m;
  // 切换模式时清理无关绘制
  if (m !== 'slice_diameter') clearMeasureDrawings();
  if (m !== 'distance') clearDistance();
  if (m !== 'circle') clearCircle();
  if (m !== 'area') clearAreas();
};

const toggleMiniMap = () => {
  showMiniMap.value = !showMiniMap.value;
  if (showMiniMap.value) {
    nextTick(() => {
      initMiniRenderer();
    });
  } else {
    disposeMiniRenderer();
  }
};

const initMiniRenderer = async () => {
  console.log(miniCanvas.value);
  if (!miniCanvas.value) return;
  // 独立场景与渲染器
  miniScene = new THREE.Scene();
  miniScene.background = new THREE.Color(0xffffff);
  miniRenderer = new THREE.WebGLRenderer({
    canvas: miniCanvas.value,
    antialias: true,
    alpha: true,
  });
  miniRenderer.setSize(220, 220);
  miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  miniRenderer.setClearColor(0xffffff, 1);

  // 加一盏环境光，让点云更清晰
  const light = new THREE.AmbientLight(0xffffff, 1.0);
  miniScene.add(light);

  // 使用 BASE_URL 以适配非根路径部署
  const finalUrl = config.sparsePoint;
  const loader = new PLYLoader();
  (loader as any).setCrossOrigin?.('anonymous');
  let geo: THREE.BufferGeometry;
  try {
    geo = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
      loader.load(finalUrl, resolve, undefined, reject);
    });
  } catch (e) {
    ElMessage.error(`缩略图点云加载失败: ${e}`);
    return;
  }

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const diag = size.length();
  const psize = Math.max(diag * 0.02, 3);
  const material = new THREE.PointsMaterial({
    size: psize,
    sizeAttenuation: false,
    color: geo.attributes.color ? 0xffffff : 0x88aa88,
    vertexColors: !!geo.attributes.color,
  });
  miniPoints = new THREE.Points(geo, material);
  miniScene.add(miniPoints);

  // 调试辅助：坐标轴与包围盒（若需要可移除）
  const axes = new THREE.AxesHelper(Math.max(size.x, size.y, size.z));
  miniScene.add(axes);
  const bboxHelper = new THREE.Box3Helper(bbox, 0xffcc00);
  miniScene.add(bboxHelper);

  // 正交相机顶视图
  const half = Math.max(size.x, size.y, size.z) * 0.6 || 6;
  miniCamera = new THREE.OrthographicCamera(
    -half,
    half,
    half,
    -half,
    0.01,
    half * 20
  );
  miniCamera.position.set(center.x, center.y + half * 3, center.z);
  miniCamera.up.set(0, 0, -1);
  miniCamera.lookAt(center);
  miniCamera.updateProjectionMatrix();

  // 立即渲染一帧，确保首次可见
  miniRenderer.render(miniScene, miniCamera);
};

const syncMiniOverlays = () => {
  if (!miniScene || !miniCamera) return;
  // 清空旧覆盖
  for (const o of miniOverlays) miniScene.remove(o);
  miniOverlays = [];
  // 同步测距线
  if (distStart && distEnd) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(distStart.x, distStart.y, distStart.z),
      new THREE.Vector3(distEnd.x, distEnd.y, distEnd.z),
    ]);
    const m = new THREE.LineBasicMaterial({ color: 0x34c759 });
    const l = new THREE.Line(g, m);
    miniScene.add(l); miniOverlays.push(l);
  }
  if (distMarker) {
    const geo = new THREE.SphereGeometry(0.02, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff9500 });
    const s = new THREE.Mesh(geo, mat);
    s.position.copy(distMarker.position);
    miniScene.add(s); miniOverlays.push(s);
  }
  // 同步测圆
  if (circleCenter) {
    const seg = 64; const pos: number[] = [];
    const r = (circleDiameterMm.value / 1000) / 2;
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      pos.push(circleCenter.x + Math.cos(t) * r, circleCenter.y, circleCenter.z + Math.sin(t) * r);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color: 0xffcc00 });
    const l = new THREE.Line(g, m);
    miniScene.add(l); miniOverlays.push(l);
  }
  // 同步测面（最多两个）
  for (const s of areaShapes) {
    if (s.type === 'circle') {
      const seg = 64; const pos: number[] = [];
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * Math.PI * 2;
        pos.push(s.center!.x + Math.cos(t) * s.radiusM!, s.y, s.center!.z + Math.sin(t) * s.radiusM!);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({ color: 0x7c3aed });
      const l = new THREE.Line(g, m);
      miniScene.add(l); miniOverlays.push(l);
    } else if (s.type === 'polygon' && (s.points?.length || 0) >= 2) {
      const pos: number[] = [];
      for (let i = 0; i < s.points!.length; i++) {
        const p = s.points![i]; const q = s.points![(i + 1) % s.points!.length];
        pos.push(p.x, s.y, p.z, q.x, s.y, q.z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({ color: 0x0ea5e9 });
      const l = new THREE.LineSegments(g, m);
      miniScene.add(l); miniOverlays.push(l);
    }
  }
};

const disposeMiniRenderer = () => {
  if (miniPoints) {
    miniScene?.remove(miniPoints);
    (miniPoints.geometry as THREE.BufferGeometry).dispose();
    (miniPoints.material as THREE.Material).dispose?.();
    miniPoints = null;
  }
  for (const o of miniOverlays) {
    if ((o as any).geometry) (o as any).geometry.dispose?.();
    if ((o as any).material) (o as any).material.dispose?.();
    miniScene?.remove(o);
  }
  miniOverlays = [];
  if (miniRenderer) {
    miniRenderer.dispose();
    miniRenderer = null;
  }
  miniCamera = null;
  miniScene = null;
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (showMiniMap.value && miniRenderer && miniScene && miniCamera) {
    if (viewMode.value === 'stereo') syncMiniCameraToMain();
    syncMiniOverlays();
    miniRenderer.render(miniScene, miniCamera);
  }
};

const handleResize = () => {
  if (!modelContainer.value || !renderer || !camera) return;
  const width = modelContainer.value.clientWidth;
  const height = modelContainer.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  // 更新粗线材质分辨率，确保线宽正确
  const pxW = Math.floor(width * Math.min(window.devicePixelRatio, 2));
  const pxH = Math.floor(height * Math.min(window.devicePixelRatio, 2));
  contourMat?.resolution.set(pxW, pxH);
  diameterMat?.resolution.set(pxW, pxH);
};

const loadMeshModel = async () => {
  try {
    const loader = new PLYLoader();
    (loader as any).setCrossOrigin?.('anonymous');
    const geometry = await new Promise<THREE.BufferGeometry>(
      (resolve, reject) => {
        loader.load(props.modelUrl, resolve, undefined, reject);
      }
    );

    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      if (Array.isArray((currentMesh as any).material)) {
        (currentMesh as any).material.forEach((m: THREE.Material) =>
          m.dispose()
        );
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
  // 初始化测量范围
  measureMinY.value = box.min.y;
  measureMaxY.value = box.max.y;
  if (!Number.isFinite(sliceY.value) || sliceY.value < measureMinY.value || sliceY.value > measureMaxY.value) {
    sliceY.value = modelCenter.y;
  }
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

// 视角预设/微调/工具栏方法（保持）
const setTopView = () => {
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(modelCenter.x, modelCenter.y + maxDim * 2, modelCenter.z);
  camera.up.set(0, 0, -1);
  camera.lookAt(modelCenter);
  controls.target.copy(modelCenter);
  controls.update();
};

// ===== 测量工具：事件/计算/绘制 =====
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Shift') shiftDragging = true;
  // ESC键快速隐藏测量面板
  if (e.key === 'Escape' && showMeasure.value) {
    showMeasure.value = false;
  }
};
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift') shiftDragging = false;
};
const onMouseDown = (e: MouseEvent) => {
  if (!showMeasure.value) return;
  if (e.shiftKey && measureMode.value === 'slice_diameter') {
    shiftDragging = true;
    lastMouseY = e.clientY;
  }
  if (measureMode.value === 'distance') {
    handleDistanceMouseDown(e);
  }
  if (measureMode.value === 'area' && areaSubMode.value === 'polygon') {
    handleAreaPolygonMouseDown(e);
  }
};
const onMouseMove = (e: MouseEvent) => {
  if (!showMeasure.value) return;
  if (shiftDragging && measureMode.value === 'slice_diameter') {
    const deltaPx = e.clientY - lastMouseY;
    lastMouseY = e.clientY;
    const worldStep = (Math.max(modelSize.y, 1e-6)) / 400;
    sliceY.value = THREE.MathUtils.clamp(
      sliceY.value - deltaPx * worldStep,
      measureMinY.value,
      measureMaxY.value
    );
    updateSlice();
  }
  if (measureMode.value === 'distance') {
    handleDistanceMouseMove(e);
  }
  if (measureMode.value === 'circle') {
    handleCircleMouseMove(e);
  }
  if (measureMode.value === 'area' && areaSubMode.value === 'circle') {
    handleAreaCircleMouseMove(e);
  }
};
const onMouseUp = () => {
  shiftDragging = false;
  draggingMarker = false;
};

const onContextMenu = (e: MouseEvent) => {
  if (measureMode.value === 'area' && areaSubMode.value === 'polygon') {
    e.preventDefault();
    undoLastPolygonPoint();
  }
};

const updateBoundsForMeasure = () => {
  if (!currentMesh) return;
  const box = new THREE.Box3().setFromObject(currentMesh);
  measureMinY.value = box.min.y;
  measureMaxY.value = box.max.y;
  if (sliceY.value < measureMinY.value || sliceY.value > measureMaxY.value) sliceY.value = (box.min.y + box.max.y) / 2;
};

const clearMeasureDrawings = () => {
  if (contourLine) {
    scene.remove(contourLine);
    contourLine.geometry.dispose();
    (contourLine.material as THREE.Material).dispose?.();
    contourLine = null;
  }
  if (diameterLine) {
    scene.remove(diameterLine);
    diameterLine.geometry.dispose();
    (diameterLine.material as THREE.Material).dispose?.();
    diameterLine = null;
  }
  if (diameterLabel) {
    scene.remove(diameterLabel);
    diameterLabel.material.dispose();
    (diameterLabel.material as THREE.SpriteMaterial).map?.dispose?.();
    diameterLabel = null;
  }
  diameterValue.value = 0;
};

const updateSlice = () => {
  if (!currentMesh) { clearMeasureDrawings(); return; }
  const geometry = currentMesh.geometry as THREE.BufferGeometry;
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  if (!pos) { clearMeasureDrawings(); return; }

  const epsList = [0.0005, 0.001, 0.002, 0.005, 0.01];
  let points: Array<THREE.Vector2> = [];
  for (const eps of epsList) {
    points = collectSlicePointsXZ(pos, sliceY.value, eps);
    if (points.length >= 20) break;
  }
  if (points.length < 3) {
    clearMeasureDrawings();
    return;
  }
  const hull = convexHull(points);
  if (hull.length < 3) {
    clearMeasureDrawings();
    return;
  }
  const { maxDist, a, b } = diameterOfHull(hull);
  diameterValue.value = Math.sqrt(maxDist);
  drawContourAndDiameter(hull, a, b, sliceY.value);
};

const collectSlicePointsXZ = (pos: THREE.BufferAttribute, y: number, eps: number): Array<THREE.Vector2> => {
  const list: Array<THREE.Vector2> = [];
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i); const py = pos.getY(i); const pz = pos.getZ(i);
    if (Math.abs(py - y) <= eps) list.push(new THREE.Vector2(px, pz));
  }
  return list;
};

const convexHull = (pts: Array<THREE.Vector2>): Array<THREE.Vector2> => {
  const points = pts.slice().sort((p1, p2) => (p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x));
  if (points.length <= 1) return points;
  const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Array<THREE.Vector2> = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Array<THREE.Vector2> = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper);
};

const diameterOfHull = (hull: Array<THREE.Vector2>) => {
  const n = hull.length;
  if (n === 1) return { maxDist: 0, a: hull[0], b: hull[0] };
  if (n === 2) return { maxDist: hull[0].distanceToSquared(hull[1]), a: hull[0], b: hull[1] };
  let k = 1;
  let maxDist = 0; let ai = 0; let bi = 0;
  const area2 = (i: number, j: number, k: number) => Math.abs((hull[j].x - hull[i].x) * (hull[k].y - hull[i].y) - (hull[j].y - hull[i].y) * (hull[k].x - hull[i].x));
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    while (area2(i, next, (k + 1) % n) > area2(i, next, k)) k = (k + 1) % n;
    const dist1 = hull[i].distanceToSquared(hull[k]);
    const dist2 = hull[next].distanceToSquared(hull[k]);
    if (dist1 > maxDist) { maxDist = dist1; ai = i; bi = k; }
    if (dist2 > maxDist) { maxDist = dist2; ai = next; bi = k; }
  }
  return { maxDist, a: hull[ai], b: hull[bi] };
};

const drawContourAndDiameter = (hull: Array<THREE.Vector2>, a: THREE.Vector2, b: THREE.Vector2, y: number) => {
  if (contourLine) {
    scene.remove(contourLine);
    contourLine.geometry.dispose();
    contourMat?.dispose();
    contourLine = null;
  }
  const contourVerts: number[] = [];
  for (let i = 0; i < hull.length; i++) {
    const p = hull[i];
    const q = hull[(i + 1) % hull.length];
    contourVerts.push(p.x, y, p.y, q.x, y, q.y);
  }
  // 使用 Line2 实现加粗线
  const lg = new LineGeometry();
  // LineGeometry 采用平铺 xyz 序列
  lg.setPositions(contourVerts);
  contourMat = new LineMaterial({ color: 0xff3b30, linewidth: 3, dashed: false, transparent: true, depthTest: false, depthWrite: false, opacity: 1 });
  // 初始化分辨率
  const size = renderer.getSize(new THREE.Vector2());
  const pxW = Math.floor(size.x * Math.min(window.devicePixelRatio, 2));
  const pxH = Math.floor(size.y * Math.min(window.devicePixelRatio, 2));
  contourMat.resolution.set(pxW, pxH);
  contourLine = new Line2(lg, contourMat);
  contourLine.renderOrder = 998;
  scene.add(contourLine);

  if (diameterLine) {
    scene.remove(diameterLine);
    diameterLine.geometry.dispose();
    diameterMat?.dispose();
    diameterLine = null;
  }
  const dVerts = [a.x, y, a.y, b.x, y, b.y];
  const dgeo = new LineGeometry();
  dgeo.setPositions(dVerts);
  diameterMat = new LineMaterial({ color: 0x00e5ff, linewidth: 4, transparent: true, depthTest: false, depthWrite: false, opacity: 1 });
  diameterMat.resolution.set(pxW, pxH);
  diameterLine = new Line2(dgeo, diameterMat);
  diameterLine.renderOrder = 999;
  scene.add(diameterLine);

  if (diameterLabel) {
    scene.remove(diameterLabel);
    diameterLabel.material.dispose();
    (diameterLabel.material as THREE.SpriteMaterial).map?.dispose?.();
    diameterLabel = null;
  }
  const mid = new THREE.Vector3((a.x + b.x) / 2, y, (a.y + b.y) / 2);
  diameterLabel = createTextSprite(`${diameterValue.value.toFixed(3)}`);
  diameterLabel.position.copy(mid);
  diameterLabel.scale.setScalar(Math.max(modelSize.length() * 0.05, 0.25));
  scene.add(diameterLabel);
};

const createTextSprite = (text: string): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const padding = 10; const fontSize = 40; const font = `${fontSize}px sans-serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + padding * 2);
  const h = Math.ceil(fontSize + padding * 2);
  canvas.width = w; canvas.height = h;
  // 背景采用高可见度的黄色，带深色描边
  ctx.fillStyle = 'rgba(255, 223, 0, 0.95)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);
  ctx.font = font;
  ctx.fillStyle = '#111';
  ctx.textBaseline = 'middle';
  // 文字外描边增强对比
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeText(text, padding, h / 2);
  ctx.fillText(text, padding, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  return sprite;
};

// ===== 导出功能 =====
const exportMeasurementsJSON = () => {
  const data = {
    distance: distStart && distEnd ? {
      start: distStart, end: distEnd, percent: markerPercent.value,
      distance_mm: parseFloat((distStart.distanceTo(distEnd) * 1000).toFixed(3))
    } : null,
    circle: circleCenter ? {
      center: circleCenter, diameter_mm: circleDiameterMm.value
    } : null,
    areas: areaShapes.map(s => s.type === 'circle' ? ({ type: 'circle', y: s.y, center: s.center, radius_m: s.radiusM, area_m2: s.areaM2 }) : ({ type: 'polygon', y: s.y, points: s.points, area_m2: s.areaM2 })),
    overlap_m2: overlapAreaText.value
  } as any;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'measurements.json'; a.click();
  URL.revokeObjectURL(url);
};

const exportMiniPNG = () => {
  if (!miniRenderer) return;
  const dataURL = miniRenderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL; a.download = 'mini.png'; a.click();
};

const exportMainViewPNG = () => {
  if (!renderer) return;
  // 临时调整渲染器尺寸为高分辨率
  const originalSize = renderer.getSize(new THREE.Vector2());
  const scale = 2; // 2倍分辨率
  const width = originalSize.x * scale;
  const height = originalSize.y * scale;
  renderer.setSize(width, height);
  
  // 渲染一帧
  if (scene && camera) {
    renderer.render(scene, camera);
  }
  
  // 导出
  const dataURL = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL; a.download = 'main_view.png'; a.click();
  
  // 恢复原始尺寸
  renderer.setSize(originalSize.x, originalSize.y);
  if (camera) {
    camera.aspect = originalSize.x / originalSize.y;
    camera.updateProjectionMatrix();
  }
};
const clearAreas = () => {
  for (let i = 0; i < areaShapes.length; i++) removeAreaShape(i);
  areaShapes = [];
  area1Text.value = '—';
  area2Text.value = '—';
  overlapAreaText.value = '—';
  overlapPercentText.value = '—';
};

const removeAreaShape = (idx: number) => {
  const s = areaShapes[idx];
  if (!s) return;
  if (s.line) {
    scene.remove(s.line);
    s.line.geometry.dispose();
    (s.line.material as THREE.Material)?.dispose?.();
    s.line = undefined as any;
  }
  if (s.fill) {
    scene.remove(s.fill);
    (s.fill.geometry as THREE.BufferGeometry).dispose();
    (s.fill.material as THREE.Material).dispose();
    s.fill = undefined as any;
  }
  if (s.label) {
    scene.remove(s.label);
    s.label.material.dispose();
    (s.label.material as THREE.SpriteMaterial).map?.dispose?.();
    s.label = undefined as any;
  }
};

const setAreaSubMode = (m: AreaSubMode) => {
  areaSubMode.value = m;
};

const drawAreaShape = (idx: number) => {
  const s = areaShapes[idx];
  if (!s) return;
  if (s.type === 'circle') {
    // 线
    const seg = 128;
    const pos: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      pos.push(
        s.center!.x + Math.cos(t) * s.radiusM!, s.y, s.center!.z + Math.sin(t) * s.radiusM!
      );
    }
    const lg = new LineGeometry();
    lg.setPositions(pos);
    const lm = new LineMaterial({ color: 0x7c3aed, linewidth: 3, transparent: true, depthTest: false, depthWrite: false });
    const size = renderer.getSize(new THREE.Vector2());
    const pxW = Math.floor(size.x * Math.min(window.devicePixelRatio, 2));
    const pxH = Math.floor(size.y * Math.min(window.devicePixelRatio, 2));
    lm.resolution.set(pxW, pxH);
    const line = new Line2(lg, lm);
    line.renderOrder = 994;
    s.line = line;
    scene.add(line);
    // 填充
    const shape = new THREE.Shape();
    shape.absarc(s.center!.x, s.center!.z, s.radiusM!, 0, Math.PI * 2, false);
    const geo = new THREE.ShapeGeometry(shape, 64);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, s.y, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.2, depthTest: false, depthWrite: false });
    const fill = new THREE.Mesh(geo, mat);
    fill.renderOrder = 993;
    s.fill = fill;
    scene.add(fill);
    // 标签
    const label = createTextSprite(`${(Math.PI * s.radiusM! * s.radiusM!).toFixed(3)} ㎡`);
    label.position.set(s.center!.x + s.radiusM! * 0.7, s.y, s.center!.z);
    label.scale.setScalar(Math.max(modelSize.length() * 0.05, 0.25));
    s.label = label;
    scene.add(label);
  } else if (s.type === 'polygon') {
    // 线
    const pos: number[] = [];
    for (let i = 0; i < (s.points?.length || 0); i++) {
      const p = s.points![i];
      const q = s.points![(i + 1) % s.points!.length];
      pos.push(p.x, s.y, p.z, q.x, s.y, q.z);
    }
    if (pos.length >= 6) {
      const lg = new LineGeometry();
      lg.setPositions(pos);
      const lm = new LineMaterial({ color: 0x0ea5e9, linewidth: 3, transparent: true, depthTest: false, depthWrite: false });
      const size = renderer.getSize(new THREE.Vector2());
      const pxW = Math.floor(size.x * Math.min(window.devicePixelRatio, 2));
      const pxH = Math.floor(size.y * Math.min(window.devicePixelRatio, 2));
      lm.resolution.set(pxW, pxH);
      const line = new Line2(lg, lm);
      line.renderOrder = 994;
      s.line = line;
      scene.add(line);
    }
    // 填充
    if ((s.points?.length || 0) >= 3) {
      const shape = new THREE.Shape(s.points!.map((v) => new THREE.Vector2(v.x, v.z)));
      const geo = new THREE.ShapeGeometry(shape, 1);
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, s.y, 0);
      const mat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.2, depthTest: false, depthWrite: false });
      const fill = new THREE.Mesh(geo, mat);
      fill.renderOrder = 993;
      s.fill = fill;
      scene.add(fill);
      // 面积
      const area = polygonAreaXZ(s.points!);
      s.areaM2 = Math.abs(area);
      const label = createTextSprite(`${s.areaM2.toFixed(3)} ㎡`);
      const c = centroidXZ(s.points!);
      label.position.set(c.x, s.y, c.z);
      label.scale.setScalar(Math.max(modelSize.length() * 0.05, 0.25));
      s.label = label;
      scene.add(label);
    }
  }
};

const polygonAreaXZ = (pts: THREE.Vector3[]) => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].z - pts[j].x * pts[i].z;
  }
  return 0.5 * area;
};

const centroidXZ = (pts: THREE.Vector3[]) => {
  let cx = 0, cz = 0;
  for (const p of pts) { cx += p.x; cz += p.z; }
  const n = pts.length || 1;
  return new THREE.Vector3(cx / n, pts[0]?.y || 0, cz / n);
};

const handleAreaPolygonMouseDown = (e: MouseEvent) => {
  const hit = pickOnModel(e);
  if (!hit) return;
  if (areaShapes.length >= 2) clearAreas();
  // 若还没有多边形或上一个是圆，则新建一个多边形
  if (!areaShapes.length || areaShapes[areaShapes.length - 1].type !== 'polygon') {
    areaShapes.push({ type: 'polygon', y: hit.point.y, points: [hit.point.clone()], line: null as any, fill: null as any, label: null as any, areaM2: 0 });
  } else {
    areaShapes[areaShapes.length - 1].points!.push(hit.point.clone());
  }
  drawAreaShape(areaShapes.length - 1);
  updateAreaPanel();
};

const undoLastPolygonPoint = () => {
  if (!areaShapes.length) return;
  const s = areaShapes[areaShapes.length - 1];
  if (s.type !== 'polygon' || !(s.points?.length)) return;
  s.points!.pop();
  if (!s.points!.length) {
    removeAreaShape(areaShapes.length - 1);
    areaShapes.pop();
  } else {
    removeAreaShape(areaShapes.length - 1);
    drawAreaShape(areaShapes.length - 1);
  }
  updateAreaPanel();
};

const updateAreaPanel = () => {
  const a1 = areaShapes[0]?.areaM2 || 0;
  const a2 = areaShapes[1]?.areaM2 || 0;
  area1Text.value = a1 ? `${a1.toFixed(3)} ㎡` : '—';
  area2Text.value = a2 ? `${a2.toFixed(3)} ㎡` : '—';
  if (areaShapes.length >= 2 && a1 && a2) {
    const ov = computeOverlap(areaShapes[0], areaShapes[1]);
    overlapAreaText.value = `${ov.toFixed(3)} ㎡`;
    overlapPercentText.value = `${((ov / a1) * 100).toFixed(1)}%`;
  } else {
    overlapAreaText.value = '—';
    overlapPercentText.value = '—';
  }
};

const computeOverlap = (s1: any, s2: any): number => {
  // 简化：将圆离散为多边形，将两多边形做 Sutherland–Hodgman 裁剪求交并计算面积
  const toPoly = (s: any): THREE.Vector3[] => {
    if (s.type === 'circle') {
      const seg = 128; const pts: THREE.Vector3[] = [];
      for (let i = 0; i < seg; i++) {
        const t = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(s.center.x + Math.cos(t) * s.radiusM, s.y, s.center.z + Math.sin(t) * s.radiusM));
      }
      return pts;
    }
    return s.points || [];
  };
  const polyClip = (subject: THREE.Vector3[], clip: THREE.Vector3[]) => {
    // 在 XZ 平面进行裁剪
    const inside = (p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) => ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) >= 0;
    const intersect = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) => {
      const A1 = b.z - a.z; const B1 = a.x - b.x; const C1 = A1 * a.x + B1 * a.z;
      const A2 = d.z - c.z; const B2 = c.x - d.x; const C2 = A2 * c.x + B2 * c.z;
      const det = A1 * B2 - A2 * B1;
      if (Math.abs(det) < 1e-8) return a.clone();
      const x = (B2 * C1 - B1 * C2) / det; const z = (A1 * C2 - A2 * C1) / det;
      return new THREE.Vector3(x, a.y, z);
    };
    let output = subject.slice();
    for (let i = 0; i < clip.length; i++) {
      const input = output.slice();
      output = [] as THREE.Vector3[];
      const A = clip[i]; const B = clip[(i + 1) % clip.length];
      for (let j = 0; j < input.length; j++) {
        const P = input[j]; const Q = input[(j + 1) % input.length];
        const Pin = inside(P, A, B);
        const Qin = inside(Q, A, B);
        if (Pin && Qin) { output.push(Q); }
        else if (Pin && !Qin) { output.push(intersect(P, Q, A, B)); }
        else if (!Pin && Qin) { output.push(intersect(P, Q, A, B), Q); }
      }
      if (!output.length) break;
    }
    return output;
  };
  const p1 = toPoly(s1);
  const p2 = toPoly(s2);
  if (p1.length < 3 || p2.length < 3) return 0;
  const inter = polyClip(p1, p2);
  if (inter.length < 3) return 0;
  return Math.abs(polygonAreaXZ(inter));
};

// ===== 测距工具实现 =====
const clearDistance = () => {
  if (distLine) {
    scene.remove(distLine);
    distLine.geometry.dispose();
    (distLine.material as THREE.Material)?.dispose?.();
    distLine = null;
  }
  if (distMarker) {
    scene.remove(distMarker);
    (distMarker.geometry as THREE.BufferGeometry).dispose();
    (distMarker.material as THREE.Material).dispose();
    distMarker = null;
  }
  distStart = null;
  distEnd = null;
  markerPercent.value = 0;
  distanceDisplay.value = '—';
  markerPercentText.value = '—';
  verticalPercentText.value = '—';
};

// ===== 测圆工具实现 =====
const clearCircle = () => {
  if (circleLine) {
    scene.remove(circleLine);
    circleLine.geometry.dispose();
    (circleLine.material as THREE.Material)?.dispose?.();
    circleLine = null;
  }
  if (circleLabel) {
    scene.remove(circleLabel);
    circleLabel.material.dispose();
    (circleLabel.material as THREE.SpriteMaterial).map?.dispose?.();
    circleLabel = null;
  }
  circleCenter = null;
};

const handleCircleMouseMove = (e: MouseEvent) => {
  const hit = pickOnModel(e);
  if (!hit) return;
  circleCenter = hit.point.clone();
  drawCircle();
};

const onWheel = (e: WheelEvent) => {
  if (!showMeasure.value || measureMode.value !== 'circle') return;
  const delta = Math.sign(e.deltaY);
  const step = 50; // mm
  circleDiameterMm.value = Math.max(50, circleDiameterMm.value - delta * step);
  drawCircle();
};

const handleAreaCircleMouseMove = (e: MouseEvent) => {
  const hit = pickOnModel(e);
  if (!hit) return;
  // 如果已有两个面，重置
  if (areaShapes.length >= 2) clearAreas();
  const center = hit.point.clone();
  const radiusM = (circleDiameterMm.value / 1000) / 2;
  const y = center.y;
  const shape = { type: 'circle' as const, y, center, radiusM, line: null as any, fill: null as any, label: null as any, areaM2: Math.PI * radiusM * radiusM };
  // 先清除最后一个临时圆
  if (areaShapes.length && areaShapes[areaShapes.length - 1].type === 'circle') removeAreaShape(areaShapes.length - 1);
  areaShapes.push(shape);
  drawAreaShape(areaShapes.length - 1);
  updateAreaPanel();
};

const drawCircle = () => {
  if (!circleCenter) return;
  const radiusM = (circleDiameterMm.value / 1000) / 2; // mm -> m，直径转半径
  const segments = 128;
  const pos: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = circleCenter.x + Math.cos(t) * radiusM;
    const z = circleCenter.z + Math.sin(t) * radiusM;
    pos.push(x, circleCenter.y, z);
  }
  if (circleLine) {
    scene.remove(circleLine);
    circleLine.geometry.dispose();
    (circleLine.material as THREE.Material)?.dispose?.();
    circleLine = null;
  }
  const lg = new LineGeometry();
  lg.setPositions(pos);
  const lmat = new LineMaterial({ color: 0xffcc00, linewidth: 3, transparent: true, depthTest: false, depthWrite: false });
  const size = renderer.getSize(new THREE.Vector2());
  const pxW = Math.floor(size.x * Math.min(window.devicePixelRatio, 2));
  const pxH = Math.floor(size.y * Math.min(window.devicePixelRatio, 2));
  lmat.resolution.set(pxW, pxH);
  circleLine = new Line2(lg, lmat);
  circleLine.renderOrder = 995;
  scene.add(circleLine);
  // 标签
  if (circleLabel) {
    scene.remove(circleLabel);
    circleLabel.material.dispose();
    (circleLabel.material as THREE.SpriteMaterial).map?.dispose?.();
    circleLabel = null;
  }
  const label = createTextSprite(`${circleDiameterMm.value.toFixed(0)} mm`);
  label.position.copy(circleCenter.clone().add(new THREE.Vector3(radiusM, 0, 0)));
  label.scale.setScalar(Math.max(modelSize.length() * 0.05, 0.25));
  circleLabel = label;
  scene.add(circleLabel);
  // 面板文本
  circleDiameterText.value = `${circleDiameterMm.value.toFixed(0)} mm`;
};

const handleDistanceMouseDown = (e: MouseEvent) => {
  const hit = pickOnModel(e);
  if (!hit) return;
  // 若已有线，检查是否点在直线附近以拖动浮标
  if (distStart && distEnd && isNearLine(hit.point, distStart, distEnd, 0.02)) {
    draggingMarker = true;
    updateMarkerByPoint(hit.point);
    return;
  }
  if (!distStart) {
    distStart = hit.point.clone();
  } else if (!distEnd) {
    distEnd = hit.point.clone();
    drawDistanceLine();
    updateDistanceReadouts();
  } else {
    // 重置为新测量
    clearDistance();
    distStart = hit.point.clone();
  }
};

const handleDistanceMouseMove = (e: MouseEvent) => {
  if (draggingMarker && distStart && distEnd) {
    const hit = pickOnModel(e);
    if (hit) updateMarkerByPoint(hit.point);
    return;
  }
  if (distStart && !distEnd) {
    const hit = pickOnModel(e);
    if (hit) {
      distEnd = hit.point.clone();
      drawDistanceLine();
      updateDistanceReadouts();
      distEnd = null; // 仅用于预览，不锁定终点
    }
  }
};

const pickOnModel = (e: MouseEvent) => {
  if (!modelCanvas.value || !currentMesh) return null;
  const rect = modelCanvas.value.getBoundingClientRect();
  mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseNdc, camera);
  const intersects = raycaster.intersectObject(currentMesh, true);
  if (!intersects.length) return null;
  return intersects[0];
};

const isNearLine = (p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, tol: number) => {
  const ab = b.clone().sub(a);
  const ap = p.clone().sub(a);
  const len2 = ab.lengthSq();
  if (len2 === 0) return false;
  const t = THREE.MathUtils.clamp(ap.dot(ab) / len2, 0, 1);
  const proj = a.clone().add(ab.multiplyScalar(t));
  return proj.distanceTo(p) <= tol;
};

const updateMarkerByPoint = (p: THREE.Vector3) => {
  if (!distStart || !distEnd) return;
  const ab = distEnd.clone().sub(distStart);
  const len = ab.length();
  if (len === 0) return;
  const t = THREE.MathUtils.clamp(p.clone().sub(distStart).dot(ab) / (len * len), 0, 1);
  markerPercent.value = t * 100;
  markerPercentText.value = `${markerPercent.value.toFixed(1)}%`;
  placeMarkerAt(distStart.clone().add(ab.multiplyScalar(t)));
};

const placeMarkerAt = (pos: THREE.Vector3) => {
  if (!distMarker) {
    const geom = new THREE.SphereGeometry(0.02, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff9500, depthTest: false, depthWrite: false });
    distMarker = new THREE.Mesh(geom, mat);
    distMarker.renderOrder = 997;
    scene.add(distMarker);
  }
  distMarker.position.copy(pos);
};

const drawDistanceLine = () => {
  if (!distStart || !distEnd) return;
  if (distLine) {
    scene.remove(distLine);
    distLine.geometry.dispose();
    (distLine.material as THREE.Material)?.dispose?.();
    distLine = null;
  }
  const dgeo = new LineGeometry();
  dgeo.setPositions([distStart.x, distStart.y, distStart.z, distEnd.x, distEnd.y, distEnd.z]);
  const lmat = new LineMaterial({ color: 0x34c759, linewidth: 3, transparent: true, depthTest: false, depthWrite: false });
  const size = renderer.getSize(new THREE.Vector2());
  const pxW = Math.floor(size.x * Math.min(window.devicePixelRatio, 2));
  const pxH = Math.floor(size.y * Math.min(window.devicePixelRatio, 2));
  lmat.resolution.set(pxW, pxH);
  distLine = new Line2(dgeo, lmat);
  distLine.renderOrder = 996;
  scene.add(distLine);
  // 初始将浮标放在终点（0% 表示终点方向？需求中终点处显示0%）
  placeMarkerAt(distEnd.clone());
  markerPercent.value = 0;
  markerPercentText.value = '0%';
};

const updateDistanceReadouts = () => {
  if (!distStart || !distEnd) { distanceDisplay.value = '—'; verticalPercentText.value = '—'; return; }
  const d = distStart.distanceTo(distEnd);
  const mm = d * 1000; // 假设世界坐标单位为米
  distanceDisplay.value = mm < 1000 ? `${mm.toFixed(1)} mm` : `${(mm/1000).toFixed(3)} m`;
  // 垂直方向百分比：y 分量占整体长度的比例
  const dy = Math.abs(distEnd.y - distStart.y);
  const verticalPercent = (dy / (d || 1)) * 100;
  verticalPercentText.value = `${verticalPercent.toFixed(1)}%`;
};
const setInsideBottomView = () => {
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(
    modelCenter.x,
    modelCenter.y - maxDim * 0.2,
    modelCenter.z
  );
  camera.near = 0.001;
  camera.updateProjectionMatrix();
  camera.up.set(0, 0, 1);
  const upPoint = new THREE.Vector3(
    modelCenter.x,
    modelCenter.y + maxDim * 0.5,
    modelCenter.z
  );
  camera.lookAt(upPoint);
  controls.target.copy(upPoint);
  controls.update();
};
const setSideView = () => {
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  camera.position.set(
    modelCenter.x + maxDim * 2,
    modelCenter.y + maxDim * 0.3,
    modelCenter.z
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(modelCenter);
  controls.target.copy(modelCenter);
  controls.update();
};
const nudge = (dx: number, dy: number) => {
  const base = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  const step = base * 0.02 * nudgeScale.value;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward).normalize();
  const right = new THREE.Vector3()
    .crossVectors(forward, camera.up)
    .normalize();
  const up = camera.up.clone().normalize();
  const delta = new THREE.Vector3()
    .addScaledVector(right, dx * step)
    .addScaledVector(up, dy * step);
  camera.position.add(delta);
  controls.target.add(delta);
  controls.update();
};
const resetView = () => {
  updateModelBounds();
  fitCameraToObject(currentMesh!);
  ElMessage.success("视角已重置");
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
  const mm = currentMesh.material as THREE.MeshLambertMaterial;
  mm.transparent = true;
  mm.opacity = opacity.value;
  mm.needsUpdate = true;
};
const applyBrightness = () => {
  if (ambientLight) ambientLight.intensity = 0.6 * brightness.value;
  if (dirLight) dirLight.intensity = 0.8 * brightness.value;
};
const toggleFullscreen = async () => {
  if (!modelContainer.value) return;
  const el = modelContainer.value as HTMLElement;
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
};
// 重新加载函数未在模板中使用，移除避免未使用告警

// 模式切换
const setMode = (mode: ViewMode) => {
  viewMode.value = mode;
  applyModeConstraints();
};

const applyModeConstraints = () => {
  if (!controls) return;

  // 默认自由
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.minPolarAngle = 0; // 0 - Math.PI
  controls.maxPolarAngle = Math.PI;

  if (viewMode.value === 'side') {
    // 侧面：限制成水平环绕（polar 约等于 90°），允许左右，禁上下
    const mid = Math.PI / 2;
    controls.minPolarAngle = mid * 0.98;
    controls.maxPolarAngle = mid * 1.02;
    controls.enablePan = false;
    // 缩略图固定端面（顶视）
    setMiniTopView();
  } else if (viewMode.value === 'section') {
    // 剖面：固定端视，只允许上下“推拉”缩放，不允许左右旋转
    setTopView();
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    // 缩略图为侧视
    setMiniSideView();
  } else {
    // 立体：双方自由且同步
    if (showMiniMap.value) syncMiniCameraToMain();
  }
};

const syncMiniCameraToMain = () => {
  if (!miniCamera) return;
  // 将 miniCamera 复制主相机方位但用正交距离
  const dist = camera.position.clone().sub(controls.target).length();
  const dir = camera.position.clone().sub(controls.target).normalize();
  const size = Math.max(modelSize.x, modelSize.y, modelSize.z) || 10;
  const half = size * 0.6;
  miniCamera.left = -half; miniCamera.right = half; miniCamera.top = half; miniCamera.bottom = -half;
  const newPos = controls.target.clone().add(dir.multiplyScalar(dist));
  miniCamera.position.copy(newPos);
  miniCamera.lookAt(controls.target);
  miniCamera.updateProjectionMatrix();
};

const setMiniTopView = () => {
  if (!miniCamera || !miniScene) return;
  const half = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.6 || 6;
  miniCamera.left = -half; miniCamera.right = half; miniCamera.top = half; miniCamera.bottom = -half;
  miniCamera.position.set(modelCenter.x, modelCenter.y + half * 3, modelCenter.z);
  miniCamera.up.set(0, 0, -1);
  miniCamera.lookAt(modelCenter);
  miniCamera.updateProjectionMatrix();
};

const setMiniSideView = () => {
  if (!miniCamera || !miniScene) return;
  const half = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.6 || 6;
  miniCamera.left = -half; miniCamera.right = half; miniCamera.top = half; miniCamera.bottom = -half;
  miniCamera.position.set(modelCenter.x + half * 3, modelCenter.y + half * 0.3, modelCenter.z);
  miniCamera.up.set(0, 1, 0);
  miniCamera.lookAt(modelCenter);
  miniCamera.updateProjectionMatrix();
};

const cleanup = () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (controls) controls.dispose();
  if (renderer) renderer.dispose();
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
  modelCanvas.value?.removeEventListener("mousedown", onMouseDown);
  modelCanvas.value?.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  modelCanvas.value?.removeEventListener('wheel', onWheel as any);
  modelCanvas.value?.removeEventListener('contextmenu', onContextMenu as any);
  disposeMiniRenderer();
  clearMeasureDrawings();
  clearDistance();
  clearCircle();
  clearAreas();
};

onMounted(() => {
  nextTick(() => {
    initScene();
    setTimeout(() => {
      loadMeshModel();
      applyModeConstraints();
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
.toolbar-left,
.toolbar-right {
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
.tool-btn:hover {
  background: #f3f4f6;
}
.tool-btn.active {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #4338ca;
}
.settings-popover {
  position: absolute;
  top: 46px;
  right: 64px;
  width: 320px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 15;
}
.settings-section {
  margin-bottom: 10px;
}
.settings-section:last-child {
  margin-bottom: 0;
}
.section-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.preset-row {
  display: flex;
  gap: 8px;
}
.preset-btn {
  flex: 1;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
}
.preset-btn:hover {
  background: #f3f4f6;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider {
  flex: 1;
}
.slider-value {
  font-size: 12px;
  color: #374151;
  min-width: 34px;
  text-align: right;
}
.nudge-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 30px);
  gap: 6px;
  justify-items: center;
  align-items: center;
}
.nudge-btn {
  width: 36px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}
.nudge-btn.center {
  width: 36px;
}
.nudge-btn:hover {
  background: #f3f4f6;
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
.mini-map {
  position: absolute;
  top: 68px;
  right: 12px;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8;
}
.mini-canvas {
  width: 200px;
  height: 200px;
}

/* 测量面板样式 - 左侧布局，可拖拽 */
.measure-panel {
  position: absolute;
  top: 46px;
  left: 12px;
  width: 260px;
  max-height: 75vh;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  z-index: 15;
  user-select: none;
  transition: transform 0.1s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
  border-radius: 10px 10px 0 0;
  cursor: move;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.panel-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.control-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.panel-content {
  padding: 12px;
  overflow-y: auto;
  max-height: calc(75vh - 60px);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .measure-panel {
    width: 240px;
    left: 8px;
    top: 40px;
  }
  
  .panel-content {
    padding: 8px;
  }
  
  .preset-row {
    flex-direction: column;
    gap: 4px;
  }
  
  .preset-btn {
    height: 28px;
    font-size: 11px;
  }
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 最小化按钮样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.minimize-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.minimize-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 最小化状态样式 */
.minimized-info {
  padding: 8px 0;
  text-align: center;
}

.current-mode {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}
.hint-row, .result-row {
  margin-top: 8px;
  font-size: 12px;
  color: #374151;
}
</style>
