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
        <button class="tool-btn" @click="reloadModel" title="重新加载">
          重载
        </button>
      </div>
      <div class="toolbar-right">
        <div class="mode-group">
          <button class="tool-btn" :class="{active: viewMode==='stereo'}" @click="setMode('stereo')">立体</button>
          <button class="tool-btn" :class="{active: viewMode==='side'}" @click="setMode('side')">侧面</button>
          <button class="tool-btn" :class="{active: viewMode==='section'}" @click="setMode('section')">剖面</button>
        </div>
        <button class="tool-btn" @click="toggleMiniMap" title="缩略图">缩略图</button>
        <button class="tool-btn" @click="toggleSettings" title="更多设置">设置</button>
        <button class="tool-btn" :class="{active: showMeasure}" @click="toggleMeasure" title="测量">测量</button>
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
      <!-- 测量工具面板（与设置一致的浮层样式） -->
      <div v-if="showMeasure" class="measure-popover" @click.stop>
        <div class="settings-section">
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

const props = withDefaults(
  defineProps<{
    modelUrl?: string;
    background?: number;
  }>(),
  {
    modelUrl: "/Out/mesh.ply",
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
  }
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
  const finalUrl = "/Out/sparse_point.ply";
  const loader = new PLYLoader();
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

const disposeMiniRenderer = () => {
  if (miniPoints) {
    miniScene?.remove(miniPoints);
    (miniPoints.geometry as THREE.BufferGeometry).dispose();
    (miniPoints.material as THREE.Material).dispose?.();
    miniPoints = null;
  }
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
};
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift') shiftDragging = false;
};
const onMouseDown = (e: MouseEvent) => {
  if (!showMeasure.value) return;
  if (e.shiftKey) {
    shiftDragging = true;
    lastMouseY = e.clientY;
  }
};
const onMouseMove = (e: MouseEvent) => {
  if (!showMeasure.value || !shiftDragging) return;
  const deltaPx = e.clientY - lastMouseY;
  lastMouseY = e.clientY;
  const worldStep = (Math.max(modelSize.y, 1e-6)) / 400; // 像素到世界Y的估算
  sliceY.value = THREE.MathUtils.clamp(
    sliceY.value - deltaPx * worldStep,
    measureMinY.value,
    measureMaxY.value
  );
  updateSlice();
};
const onMouseUp = () => {
  shiftDragging = false;
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
const reloadModel = async () => {
  await loadMeshModel();
};

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
  disposeMiniRenderer();
  clearMeasureDrawings();
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

/* 测量面板样式与设置面板一致，位置靠近右上角 */
.measure-popover {
  position: absolute;
  top: 46px;
  right: 12px;
  width: 320px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 15;
}
.hint-row, .result-row {
  margin-top: 8px;
  font-size: 12px;
  color: #374151;
}
</style>
