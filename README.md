# 全景展示平台

基于 Vue 3 + Pinia + Three.js 构建的现代化全景展示平台，支持 360° 全景浏览、动画效果和丰富的交互体验。

## ✨ 特性

- 🖖 **Vue 3** - 使用 Composition API 和 `<script setup>`
- 🍍 **Pinia** - 轻量级状态管理
- 🎮 **Three.js** - 强大的 3D 渲染引擎
- ⚡ **GSAP** - 高性能动画库
- 🎨 **Element Plus** - 丰富的 UI 组件库
- 🎭 **TailwindCSS** - 实用优先的 CSS 框架
- 📘 **TypeScript** - 类型安全
- ⚡ **Vite** - 快速的开发构建工具

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
panorama_web/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   ├── views/             # 页面组件
│   │   ├── Home.vue       # 首页
│   │   ├── Panorama.vue   # 全景浏览页
│   │   └── Demo.vue       # 技术演示页
│   ├── stores/            # Pinia 状态管理
│   │   ├── app.ts         # 应用全局状态
│   │   └── panorama.ts    # 全景相关状态
│   ├── router/            # 路由配置
│   ├── utils/             # 工具函数
│   │   ├── panorama.ts    # 全景查看器
│   │   └── threeDemo.ts   # Three.js 演示
│   ├── style/             # 样式文件
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
├── tailwind.config.js     # TailwindCSS 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目配置
```

## 🎯 功能模块

### 全景浏览器
- 360° 全景图片浏览
- 鼠标拖拽旋转视角
- 滚轮缩放
- 自动旋转模式
- 场景切换

### 技术演示
- Element Plus 组件展示
- GSAP 动画效果演示
- Three.js 基础 3D 渲染
- 响应式设计

### 状态管理
- 应用全局状态（主题、加载状态等）
- 全景场景管理
- Three.js 实例管理

## 🛠️ 技术栈详情

### 前端框架
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 提供类型安全
- **Vite**: 现代化的构建工具

### 状态管理
- **Pinia**: Vue 3 官方推荐的状态管理库

### UI 组件库
- **Element Plus**: 基于 Vue 3 的组件库
- **TailwindCSS**: 实用优先的 CSS 框架

### 3D 渲染与动画
- **Three.js**: 用于 WebGL 3D 渲染
- **GSAP**: 高性能动画库

## 🎨 样式系统

项目使用 TailwindCSS 作为主要的样式解决方案，结合 Element Plus 组件库：

- 响应式设计
- 暗色/亮色主题支持
- 现代化的 UI 设计
- 流畅的动画效果

## 📱 浏览器支持

- Chrome >= 88
- Firefox >= 85
- Safari >= 14
- Edge >= 88

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Three.js](https://threejs.org/) - JavaScript 3D 库
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [GSAP](https://greensock.com/gsap/) - 动画库
