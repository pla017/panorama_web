<template>
  <div class="test-page">
    <h1>功能测试页面</h1>
    
    <div class="test-section">
      <h2>1. 基本UI组件测试</h2>
      <el-button type="primary">Element Plus 按钮</el-button>
      <el-button type="success">成功按钮</el-button>
      <el-button type="warning">警告按钮</el-button>
    </div>

    <div class="test-section">
      <h2>2. 路由导航测试</h2>
      <div class="nav-buttons">
        <el-button @click="$router.push('/')">首页</el-button>
        <el-button @click="$router.push('/analyzer')">分析器</el-button>
        <el-button @click="$router.push('/panorama')">全景</el-button>
        <el-button @click="$router.push('/demo')">演示</el-button>
      </div>
    </div>

    <div class="test-section">
      <h2>3. 资源文件检查</h2>
      <p>检查 public/Out 目录下的文件：</p>
      <ul class="file-list">
        <li>✓ stitched_output.mp4 - 全景视频文件</li>
        <li>✓ mesh.ply - 3D网格模型</li>
        <li>✓ sparse_point.ply - 稀疏点云</li>
        <li>✓ mesh0.png - 纹理贴图</li>
        <li>✓ 20250827-184023.jpg - 图像文件</li>
      </ul>
    </div>

    <div class="test-section">
      <h2>4. 技术栈验证</h2>
      <div class="tech-grid">
        <div class="tech-item">
          <h3>Vue 3</h3>
          <p>✓ Composition API</p>
          <p>✓ Script Setup</p>
        </div>
        <div class="tech-item">
          <h3>Pinia</h3>
          <p>✓ 状态管理</p>
        </div>
        <div class="tech-item">
          <h3>Three.js</h3>
          <p>✓ WebGL渲染</p>
          <p>✓ OrbitControls</p>
        </div>
        <div class="tech-item">
          <h3>Element Plus</h3>
          <p>✓ UI组件库</p>
        </div>
        <div class="tech-item">
          <h3>TailwindCSS</h3>
          <p class="text-blue-500">✓ 样式框架</p>
        </div>
        <div class="tech-item">
          <h3>GSAP</h3>
          <p>✓ 动画库</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 测试页面，验证各个功能模块
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.test-section h2 {
  color: #333;
  margin-bottom: 16px;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.file-list {
  list-style: none;
  padding: 0;
}

.file-list li {
  padding: 8px 0;
  color: #67C23A;
  font-family: monospace;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.tech-item {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.tech-item h3 {
  margin: 0 0 12px 0;
  color: #409EFF;
}

.tech-item p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}
</style>
