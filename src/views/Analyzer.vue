<template>
  <div class="analyzer-layout">
    <!-- 使用新的Model3DViewer作为主界面 -->
    <Model3DViewer />
  </div>
</template>

<script setup lang="ts">
import Model3DViewer from '@/components/Model3DViewer.vue'
</script>

<style scoped>
.analyzer-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
