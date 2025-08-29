<template>
  <div class="analyzer-layout">
    <!-- 侧边栏 -->
    <Sidebar 
      v-model="sidebarCollapsed" 
      @menu-select="handleMenuSelect"
    />

    <!-- 主内容区域 -->
    <div :class="['main-content', { 'sidebar-collapsed': sidebarCollapsed }]">
      <!-- 顶部标题栏 -->
      <div class="header-bar">
        <div class="header-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>Line AI Analyzer</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button-group size="small">
            <el-button @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
              全屏
            </el-button>
            <el-button @click="exportData">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button @click="showSettings">
              <el-icon><Setting /></el-icon>
              设置
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- Home 页面 -->
        <div v-if="currentMenu === 'home'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>欢迎使用 Line AI Analyzer</span>
                <el-tag type="success">v1.0.0</el-tag>
              </div>
            </template>
            <div class="welcome-content">
              <h3>功能概览</h3>
              <div class="feature-grid">
                <div class="feature-item">
                  <el-icon size="32" color="#409EFF"><View /></el-icon>
                  <h4>全景视频分析</h4>
                  <p>360°视频浏览与分析</p>
                </div>
                <div class="feature-item">
                  <el-icon size="32" color="#67C23A"><DataAnalysis /></el-icon>
                  <h4>智能检测</h4>
                  <p>AI驱动的缺陷检测</p>
                </div>
                <div class="feature-item">
                  <el-icon size="32" color="#E6A23C"><Document /></el-icon>
                  <h4>报告生成</h4>
                  <p>自动生成分析报告</p>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Project 页面 -->
        <div v-if="currentMenu === 'project'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>项目管理</span>
            </template>
            <div class="project-content">
              <el-empty description="项目管理功能开发中..." />
            </div>
          </el-card>
        </div>

        <!-- Upload 页面 -->
        <div v-if="currentMenu === 'upload'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>文件上传</span>
            </template>
            <div class="upload-content">
              <el-upload
                class="upload-demo"
                drag
                :auto-upload="false"
                multiple
                accept="video/*,image/*,.ply"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持视频文件、图片文件和3D模型文件
                  </div>
                </template>
              </el-upload>
            </div>
          </el-card>
        </div>

        <!-- Review 页面 - 全景视频查看器 -->
        <div v-if="currentMenu === 'review'" class="content-panel full-height">
          <SimplePanoramaViewer />
        </div>

        <!-- Analysis 页面 -->
        <div v-if="currentMenu === 'analysis'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>智能分析</span>
            </template>
            <div class="analysis-content">
              <el-empty description="分析功能开发中..." />
            </div>
          </el-card>
        </div>

        <!-- Download 页面 -->
        <div v-if="currentMenu === 'download'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>下载中心</span>
            </template>
            <div class="download-content">
              <el-table :data="downloadFiles" style="width: 100%">
                <el-table-column prop="name" label="文件名" />
                <el-table-column prop="type" label="类型" width="100" />
                <el-table-column prop="size" label="大小" width="100" />
                <el-table-column prop="date" label="日期" width="150" />
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button size="small" @click="downloadFile(scope.row)">
                      下载
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </div>

        <!-- Share 页面 -->
        <div v-if="currentMenu === 'share'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>分享</span>
            </template>
            <div class="share-content">
              <el-empty description="分享功能开发中..." />
            </div>
          </el-card>
        </div>

        <!-- Account 页面 -->
        <div v-if="currentMenu === 'account'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>账户设置</span>
            </template>
            <div class="account-content">
              <el-empty description="账户功能开发中..." />
            </div>
          </el-card>
        </div>

        <!-- Help 页面 -->
        <div v-if="currentMenu === 'help'" class="content-panel">
          <el-card shadow="hover">
            <template #header>
              <span>帮助中心</span>
            </template>
            <div class="help-content">
              <el-empty description="帮助文档开发中..." />
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  FullScreen, 
  Download, 
  Setting, 
  View, 
  DataAnalysis, 
  Document,
  UploadFilled
} from '@element-plus/icons-vue'
import Sidebar from '@/components/Sidebar.vue'
import PanoramaVideoViewer from '@/components/PanoramaVideoViewer.vue'
import SimpleVideoTest from '@/components/SimpleVideoTest.vue'
import SimplePanoramaViewer from '@/components/SimplePanoramaViewer.vue'

// 响应式数据
const sidebarCollapsed = ref(false)
const currentMenu = ref('review') // 默认显示Review页面
const reviewTab = ref('simple') // 默认显示简化版全景查看器

// 菜单标题映射
const menuTitles = {
  home: 'Home',
  project: 'Project',
  upload: 'Upload',
  review: 'Review',
  analysis: 'Analysis',
  download: 'Download',
  share: 'Share',
  account: 'Account',
  help: 'Help'
}

// 下载文件列表
const downloadFiles = ref([
  {
    name: 'stitched_output.mp4',
    type: '视频',
    size: '125MB',
    date: '2024-01-15'
  },
  {
    name: 'mesh.ply',
    type: '3D模型',
    size: '45MB',
    date: '2024-01-15'
  },
  {
    name: 'sparse_point.ply',
    type: '点云',
    size: '12MB',
    date: '2024-01-15'
  },
  {
    name: 'analysis_report.pdf',
    type: '报告',
    size: '2MB',
    date: '2024-01-15'
  }
])

// 计算属性
const currentPageTitle = computed(() => {
  return menuTitles[currentMenu.value as keyof typeof menuTitles] || 'Unknown'
})

// 方法
const handleMenuSelect = (menuKey: string) => {
  currentMenu.value = menuKey
}

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

const showSettings = () => {
  ElMessage.info('设置功能开发中...')
}

const downloadFile = (file: any) => {
  ElMessage.success(`开始下载: ${file.name}`)
  // 这里可以实现实际的下载逻辑
}
</script>

<style scoped>
.analyzer-layout {
  height: 100vh;
  display: flex;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  margin-left: 200px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
}

.header-bar {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow: auto;
}

.content-panel {
  height: 100%;
}

.content-panel.full-height {
  height: calc(100vh - 120px); /* 减去header和padding的高度 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content h3 {
  margin-bottom: 20px;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-item h4 {
  margin: 12px 0 8px;
  color: #333;
}

.feature-item p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.upload-content {
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .main-content.sidebar-collapsed {
    margin-left: 0;
  }
  
  .header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .content-area {
    padding: 16px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
