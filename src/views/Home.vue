<template>
  <div class="home-container min-h-screen">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">全景展示平台</h1>
          </div>
          <div class="flex items-center space-x-4">
            <el-button type="primary" @click="goToAnalyzer">
              <el-icon><DataAnalysis /></el-icon>
              AI 分析器
            </el-button>
            <el-button @click="goToPanorama">
              <el-icon><View /></el-icon>
              全景浏览
            </el-button>
            <el-button @click="goToDemo">
              <el-icon><Setting /></el-icon>
              演示页面
            </el-button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="flex-1">
      <!-- 英雄区域 -->
      <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl md:text-6xl font-bold mb-6">
            沉浸式全景体验
          </h2>
          <p class="text-xl md:text-2xl mb-8 opacity-90">
            基于Three.js构建的高性能全景浏览平台
          </p>
          <div class="space-x-4">
            <el-button size="large" type="primary" @click="goToAnalyzer">
              立即体验
            </el-button>
            <el-button size="large" @click="scrollToFeatures">
              了解更多
            </el-button>
          </div>
        </div>
      </section>

      <!-- 特性介绍 -->
      <section id="features" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h3 class="text-3xl font-bold text-gray-900 mb-4">核心特性</h3>
            <p class="text-lg text-gray-600">现代化的技术栈，流畅的用户体验</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="feature-card bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div class="text-blue-500 mb-4">
                <el-icon size="48"><View /></el-icon>
              </div>
              <h4 class="text-xl font-semibold mb-2">360°全景浏览</h4>
              <p class="text-gray-600">支持鼠标拖拽、滚轮缩放的流畅全景浏览体验</p>
            </div>
            
            <div class="feature-card bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div class="text-green-500 mb-4">
                <el-icon size="48"><Lightning /></el-icon>
              </div>
              <h4 class="text-xl font-semibold mb-2">高性能渲染</h4>
              <p class="text-gray-600">基于Three.js的WebGL渲染，保证流畅的视觉效果</p>
            </div>
            
            <div class="feature-card bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div class="text-purple-500 mb-4">
                <el-icon size="48"><Setting /></el-icon>
              </div>
              <h4 class="text-xl font-semibold mb-2">丰富的交互</h4>
              <p class="text-gray-600">支持场景切换、自动旋转、动画效果等多种交互方式</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-800 text-white py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p>&copy; 2024 全景展示平台. 基于 Vue3 + Three.js 构建</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { View, Setting, Lightning, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

const goToAnalyzer = () => {
  router.push('/analyzer')
}

const goToPanorama = () => {
  router.push('/panorama')
}

const goToDemo = () => {
  router.push('/demo')
}

const scrollToFeatures = () => {
  const element = document.getElementById('features')
  element?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.feature-card {
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}
</style>
