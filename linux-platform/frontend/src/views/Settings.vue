<template>
  <div class="settings-page">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">系统设置</h2>
        <p class="page-subtitle">配置平台参数和连接信息</p>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧配置菜单 -->
      <el-col :xs="24" :md="6">
        <el-card class="settings-menu">
          <div
            v-for="item in menuItems"
            :key="item.key"
            class="menu-item"
            :class="{ active: activeMenu === item.key }"
            @click="activeMenu = item.key"
          >
            <el-icon size="18"> <component :is="item.icon" /> </el-icon>
            <span>{{ item.label }}</span>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧配置内容 -->
      <el-col :xs="24" :md="18">
        <!-- Windows Agent配置 -->
        <el-card v-if="activeMenu === 'agent'" class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Monitor /></el-icon>
                Windows编译Agent配置
              </span>
              <el-button type="primary" @click="testConnection('agent')">
                <el-icon><Connection /></el-icon>
                测试连接
              </el-button>
            </div>
          </template>

          <el-form :model="config.agent" label-width="140px">
            <el-form-item label="Agent地址">
              <el-input v-model="config.agent.url" placeholder="http://192.168.1.100:8081" />
            </el-form-item>
            <el-form-item label="连接超时">
              <el-input-number v-model="config.agent.timeout" :min="5" :max="60" />
              <span class="unit">秒</span>
            </el-form-item>
            <el-form-item label="状态">
              <el-tag :type="connectionStatus.agent ? 'success' : 'danger'">
                {{ connectionStatus.agent ? '已连接' : '未连接' }}
              </el-tag>
            </el-form-item>
          </el-form>

          <div class="card-actions">
            <el-button type="primary" @click="saveConfig('agent')">保存配置</el-button>
          </div>
        </el-card>

        <!-- Maven私服配置 -->
        <el-card v-if="activeMenu === 'maven'" class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Box /></el-icon>
                Maven私服配置
              </span>
            </div>
          </template>

          <el-form :model="config.maven" label-width="140px">
            <el-form-item label="私服地址">
              <el-input v-model="config.maven.url" placeholder="http://nexus.company.com/repository/maven-releases/" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="config.maven.username" placeholder="选填" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="config.maven.password" type="password" placeholder="选填" show-password />
            </el-form-item>
          </el-form>

          <div class="card-actions">
            <el-button type="primary" @click="saveConfig('maven')">保存配置</el-button>
          </div>
        </el-card>

        <!-- 邮件通知配置 -->
        <el-card v-if="activeMenu === 'email'" class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Message /></el-icon>
                邮件通知配置
              </span>
              <el-button type="primary" @click="testEmail">
                <el-icon><Promotion /></el-icon>
                发送测试邮件
              </el-button>
            </div>
          </template>

          <el-form :model="config.email" label-width="140px">
            <el-form-item label="启用邮件通知">
              <el-switch v-model="config.email.enabled" />
            </el-form-item>
            <template v-if="config.email.enabled">
              <el-form-item label="SMTP服务器">
                <el-input v-model="config.email.host" placeholder="smtp.company.com" />
              </el-form-item>
              <el-form-item label="SMTP端口">
                <el-input-number v-model="config.email.port" :min="1" :max="65535" />
              </el-form-item>
              <el-form-item label="发件人邮箱">
                <el-input v-model="config.email.from" placeholder="test-platform@company.com" />
              </el-form-item>
              <el-form-item label="收件人邮箱">
                <el-input
                  v-model="config.email.to"
                  type="textarea"
                  :rows="3"
                  placeholder="多个邮箱用逗号分隔"
                />
              </el-form-item>
              <el-form-item label="使用SSL/TLS">
                <el-switch v-model="config.email.ssl" />
              </el-form-item>
            </template>
          </el-form>

          <div class="card-actions">
            <el-button type="primary" @click="saveConfig('email')">保存配置</el-button>
          </div>
        </el-card>

        <!-- 系统信息 -->
        <el-card v-if="activeMenu === 'system'" class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><InfoFilled /></el-icon>
                系统信息
              </span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="构建时间">2026-03-25</el-descriptions-item>
            <el-descriptions-item label="后端版本">Spring Boot 2.7</el-descriptions-item>
            <el-descriptions-item label="前端版本">Vue 3.3</el-descriptions-item>
            <el-descriptions-item label="测试框架">Playwright 1.40</el-descriptions-item>
            <el-descriptions-item label="JDK版本">1.8+</el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <h4 class="section-title">组件状态</h4>
          <div class="component-status">
            <div class="status-item">
              <span class="status-label">Windows Agent</span>
              <el-tag :type="connectionStatus.agent ? 'success' : 'danger'" round>
                {{ connectionStatus.agent ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">Docker服务</span>
              <el-tag :type="connectionStatus.docker ? 'success' : 'danger'" round>
                {{ connectionStatus.docker ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">Maven私服</span>
              <el-tag :type="connectionStatus.maven ? 'success' : 'danger'" round>
                {{ connectionStatus.maven ? '在线' : '离线' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Box,
  Message,
  InfoFilled,
  Connection,
  Promotion
} from '@element-plus/icons-vue'

const activeMenu = ref('agent')

const menuItems = [
  { key: 'agent', label: 'Windows Agent', icon: 'Monitor' },
  { key: 'maven', label: 'Maven私服', icon: 'Box' },
  { key: 'email', label: '邮件通知', icon: 'Message' },
  { key: 'system', label: '系统信息', icon: 'InfoFilled' }
]

const config = reactive({
  agent: {
    url: 'http://192.168.1.100:8081',
    timeout: 30
  },
  maven: {
    url: 'http://nexus.company.com/repository/maven-releases/',
    username: '',
    password: ''
  },
  email: {
    enabled: false,
    host: 'smtp.company.com',
    port: 587,
    from: 'test-platform@company.com',
    to: '',
    ssl: true
  }
})

const connectionStatus = reactive({
  agent: false,
  docker: true,
  maven: true
})

const testConnection = async (type) => {
  try {
    ElMessage.info('正在测试连接...')

    let config = {}
    if (type === 'agent') {
      config = { url: agentConfig.url }
    } else if (type === 'docker') {
      config = { socketPath: '/var/run/docker.sock' }
    } else if (type === 'maven') {
      config = { url: mavenConfig.url }
    }

    const response = await taskApi.testConnection(type, config)

    if (response.data.success) {
      connectionStatus[type] = true
      ElMessage.success('连接成功')
    } else {
      connectionStatus[type] = false
      ElMessage.error('连接失败: ' + response.data.message)
    }
  } catch (error) {
    connectionStatus[type] = false
    ElMessage.error('连接测试失败: ' + (error.response?.data?.message || error.message))
  }
}

const testEmail = async () => {
  try {
    ElMessage.info('正在发送测试邮件...')

    const response = await taskApi.testConnection('email', {
      host: emailConfig.host,
      port: emailConfig.port,
      user: emailConfig.user,
      password: emailConfig.password,
      to: emailConfig.to
    })

    if (response.data.success) {
      ElMessage.success('测试邮件已发送，请检查收件箱')
    } else {
      ElMessage.error('发送失败: ' + response.data.message)
    }
  } catch (error) {
    ElMessage.error('发送测试邮件失败: ' + (error.response?.data?.message || error.message))
  }
}

const saveConfig = async (type) => {
  ElMessage.success('配置已保存')
}
</script>

<style scoped>
.settings-page {
  padding-bottom: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

/* 设置菜单 */
.settings-menu {
  margin-bottom: 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s;
  color: #4b5563;
}

.menu-item:hover {
  background: #f3f4f6;
  color: #1890ff;
}

.menu-item.active {
  background: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
}

/* 设置卡片 */
.settings-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.unit {
  margin-left: 8px;
  color: #6b7280;
}

/* 系统信息 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 16px;
  color: #1f2937;
}

.component-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.status-label {
  font-size: 14px;
  color: #4b5563;
}
</style>
