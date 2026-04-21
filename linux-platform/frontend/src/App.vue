<template>
  <div id="app">
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="app-header" height="64px">
        <div class="header-left">
          <div class="logo">
            <el-icon size="32" color="#fff"><Monitor /></el-icon>
            <span class="logo-text">AutoTest</span>
          </div>
          <div class="header-divider"></div>
          <span class="subtitle">自动化测试平台</span>
        </div>
        <div class="header-right">
          <el-tooltip content="系统状态">
            <el-icon class="status-icon" :class="{ 'online': systemOnline }"><CircleCheckFilled /></el-icon>
          </el-tooltip>
          <span class="status-text">{{ systemOnline ? '系统正常' : '离线' }}</span>
          <el-divider direction="vertical" />
          <span class="user-info">管理员</span>
        </div>
      </el-header>

      <el-container class="content-container">
        <!-- 左侧菜单 -->
        <el-aside class="sidebar" width="220px">
          <el-menu
            :default-active="$route.path"
            router
            class="sidebar-menu"
            background-color="#001529"
            text-color="#b8c5d6"
            active-text-color="#fff"
          >
            <el-menu-item index="/">
              <el-icon size="18"><HomeFilled /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="/projects">
              <el-icon size="18"><FolderOpened /></el-icon>
              <span>项目配置</span>
            </el-menu-item>
            <el-menu-item index="/tasks">
              <el-icon size="18"><List /></el-icon>
              <span>测试任务</span>
            </el-menu-item>
            <el-menu-item index="/reports">
              <el-icon size="18"><TrendCharts /></el-icon>
              <span>测试报告</span>
            </el-menu-item>
            <el-menu-item index="/settings">
              <el-icon size="18"><Setting /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
          </el-menu>

          <div class="sidebar-footer">
            <div class="version">v1.0.0</div>
          </div>
        </el-aside>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Monitor,
  HomeFilled,
  FolderOpened,
  List,
  TrendCharts,
  Setting,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import axios from 'axios'

const systemOnline = ref(false)

const checkHealth = async () => {
  try {
    await axios.get('/api/task/health')
    systemOnline.value = true
  } catch {
    systemOnline.value = false
  }
}

onMounted(() => {
  checkHealth()
  setInterval(checkHealth, 30000)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --danger-color: #f5222d;
  --sidebar-bg: #001529;
  --header-bg: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  height: 100vh;
}

/* 顶部导航 */
.app-header {
  background: var(--header-bg);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.3);
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.status-icon {
  font-size: 10px;
  color: #ff4d4f;
  transition: color 0.3s;
}

.status-icon.online {
  color: #52c41a;
}

.status-text {
  font-size: 13px;
}

.user-info {
  font-weight: 500;
}

/* 侧边栏 */
.content-container {
  height: calc(100vh - 64px);
}

.sidebar {
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding-top: 16px;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255,255,255,0.05) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background: var(--primary-color) !important;
}

.sidebar-menu .el-icon {
  margin-right: 12px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.version {
  color: #8c9db5;
  font-size: 12px;
  text-align: center;
}

/* 主内容区 */
.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>