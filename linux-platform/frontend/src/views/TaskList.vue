<template>
  <div class="task-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">测试任务</h2>
        <p class="page-subtitle">管理和监控自动化测试任务</p>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务..."
          clearable
          class="search-input"
          :prefix-icon="Search"
        />
        <el-button type="primary" size="large" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <el-radio-group v-model="filterStatus" size="large">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="running">
          <el-icon><Loading /></el-icon> 运行中
        </el-radio-button>
        <el-radio-button label="success">
          <el-icon><CircleCheckFilled /></el-icon> 成功
        </el-radio-button>
        <el-radio-button label="failed">
          <el-icon><CircleCloseFilled /></el-icon> 失败
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 任务卡片列表 -->
    <div class="task-cards" v-loading="loading">
      <el-empty v-if="filteredTasks.length === 0" description="暂无任务" />

      <el-row :gutter="20" v-else>
        <el-col
          v-for="task in filteredTasks"
          :key="task.taskId"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="8"
          class="task-col"
        >
          <el-card class="task-card" :class="`status-${task.status}`" shadow="hover">
            <div class="task-header">
              <div class="task-id" @click="viewDetail(task)">
                <el-icon><Document /></el-icon>
                {{ task.taskId.substring(0, 8) }}...
              </div>
              <el-tag
                :type="getStatusType(task.status)"
                effect="dark"
                round
                size="small"
              >
                <el-icon v-if="isRunning(task.status)" class="rotating">
                  <Loading />
                </el-icon>
                {{ getStatusText(task.status) }}
              </el-tag>
            </div>

            <div class="task-body">
              <h3 class="project-name">{{ task.projectName }}</h3>
              <div class="task-meta">
                <span class="meta-item">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(task.createTime) }}
                </span>
              </div>

              <!-- 进度条 -->
              <div class="progress-section" v-if="isRunning(task.status)">
                <el-progress
                  :percentage="getProgress(task.status)"
                  :status="getProgressStatus(task.status)"
                  :stroke-width="6"
                  striped
                  striped-flow
                  :duration="10"
                />
                <span class="progress-text">{{ getProgressText(task.status) }}</span>
              </div>

              <!-- 结果统计 -->
              <div class="result-stats" v-else-if="task.totalTests">
                <div class="stat-item success">
                  <span class="stat-num">{{ task.passedTests }}</span>
                  <span class="stat-label">通过</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item failed">
                  <span class="stat-num">{{ task.failedTests }}</span>
                  <span class="stat-label">失败</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                  <span class="stat-num">{{ task.coverage }}%</span>
                  <span class="stat-label">覆盖率</span>
                </div>
              </div>

              <div class="no-result" v-else>
                <el-icon><InfoFilled /></el-icon>
                <span>暂无测试数据</span>
              </div>
            </div>

            <div class="task-footer">
              <el-button
                type="primary"
                link
                @click="viewDetail(task)"
              >
                查看详情
              </el-button>
              <el-button
                type="success"
                link
                @click="viewReport(task)"
                :disabled="!task.reportUrl"
              >
                测试报告
              </el-button>
              <el-dropdown trigger="click">
                <el-button type="default" link>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="reRunTask(task)">
                      <el-icon><RefreshRight /></el-icon> 重新执行
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteTask(task)">
                      <el-icon><DeleteFilled /></el-icon> 删除任务
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建测试任务"
      width="500px"
      destroy-on-close
      class="create-dialog"
    >
      <el-steps :active="activeStep" finish-status="success" simple>
        <el-step title="配置项目" />
        <el-step title="确认信息" />
      </el-steps>

      <div v-if="activeStep === 0" class="step-content">
        <el-form
          :model="createForm"
          label-width="100px"
          :rules="rules"
          ref="formRef"
        >
          <el-form-item label="项目名称" prop="projectName">
            <el-input
              v-model="createForm.projectName"
              placeholder="请输入项目名称"
              clearable
            />
          </el-form-item>
          <el-form-item label="构建类型">
            <el-radio-group v-model="createForm.buildType">
              <el-radio-button label="full">
                <el-icon><Box /></el-icon> 全量构建
              </el-radio-button>
              <el-radio-button label="backend">
                <el-icon><Cpu /></el-icon> 仅后端
              </el-radio-button>
              <el-radio-button label="frontend">
                <el-icon><Monitor /></el-icon> 仅前端
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="执行环境">
            <el-select v-model="createForm.environment" placeholder="选择环境">
              <el-option label="开发环境" value="dev" />
              <el-option label="测试环境" value="test" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="step-content confirm-step">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="项目名称">
            {{ createForm.projectName }}
          </el-descriptions-item>
          <el-descriptions-item label="构建类型">
            {{ getBuildTypeText(createForm.buildType) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行环境">
            {{ createForm.environment === 'dev' ? '开发环境' : '测试环境' }}
          </el-descriptions-item>
        </el-descriptions>
        <el-alert
          type="info"
          show-icon
          :closable="false"
          class="confirm-tip"
        >
          <template #title>
            确认后将触发以下流程：<br/>
            SVN更新 → Maven构建 → Docker部署 → Playwright测试
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button v-if="activeStep > 0" @click="activeStep--">上一步</el-button>
        <el-button v-if="activeStep < 1" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" @click="submitCreate" :loading="creating">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情抽屉 -->
    <el-drawer
      v-model="showDetailDrawer"
      title="任务详情"
      size="60%"
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header">
          <span>任务详情</span>
          <el-tag :type="getStatusType(currentTask?.status)" effect="dark" round>
            {{ getStatusText(currentTask?.status) }}
          </el-tag>
        </div>
      </template>

      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID" :span="2">
            {{ currentTask.taskId }}
          </el-descriptions-item>
          <el-descriptions-item label="项目名称">
            {{ currentTask.projectName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(currentTask.createTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 日志标签页 -->
        <el-tabs v-model="activeTab" class="log-tabs">
          <el-tab-pane label="构建日志" name="build">
            <div class="log-container">
              <pre class="log-content">{{ currentTask.buildLog || '暂无日志' }}</pre>
            </div>
          </el-tab-pane>
          <el-tab-pane label="测试日志" name="test">
            <div class="log-container">
              <pre class="log-content">{{ currentTask.testLog || '暂无日志' }}</pre>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 操作按钮 -->
        <div class="drawer-actions">
          <el-button
            type="primary"
            @click="viewReport(currentTask)"
            :disabled="!currentTask.reportUrl"
          >
            <el-icon><Document /></el-icon>
            查看测试报告
          </el-button>
          <el-button @click="reRunTask(currentTask)">
            <el-icon><RefreshRight /></el-icon>
            重新执行
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  Document,
  Clock,
  MoreFilled,
  RefreshRight,
  DeleteFilled,
  InfoFilled,
  Box,
  Cpu,
  Monitor
} from '@element-plus/icons-vue'
import taskApi from '../api/task'

const loading = ref(false)
const showCreateDialog = ref(false)
const showDetailDrawer = ref(false)
const creating = ref(false)
const activeStep = ref(0)
const activeTab = ref('build')
const formRef = ref(null)

const searchKeyword = ref('')
const filterStatus = ref('')

const tasks = ref([])
const currentTask = ref(null)

const createForm = ref({
  projectName: '',
  buildType: 'full',
  environment: 'test'
})

const rules = {
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 筛选后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value

  // 按状态筛选
  if (filterStatus.value) {
    if (filterStatus.value === 'running') {
      result = result.filter(t => ['building', 'deploying', 'testing'].includes(t.status))
    } else {
      result = result.filter(t => t.status === filterStatus.value)
    }
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(t =>
      t.projectName.toLowerCase().includes(keyword) ||
      t.taskId.toLowerCase().includes(keyword)
    )
  }

  return result
})

const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    building: 'warning',
    deploying: 'warning',
    testing: 'warning',
    success: 'success',
    failed: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    pending: '等待中',
    building: '构建中',
    deploying: '部署中',
    testing: '测试中',
    success: '成功',
    failed: '失败'
  }
  return textMap[status] || status
}

const isRunning = (status) => {
  return ['building', 'deploying', 'testing'].includes(status)
}

const getProgress = (status) => {
  const progressMap = {
    pending: 0,
    building: 25,
    deploying: 50,
    testing: 75,
    success: 100,
    failed: 100
  }
  return progressMap[status] || 0
}

const getProgressStatus = (status) => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'exception'
  return ''
}

const getProgressText = (status) => {
  const textMap = {
    building: '正在编译代码...',
    deploying: '正在部署应用...',
    testing: '正在执行测试...'
  }
  return textMap[status] || ''
}

const getBuildTypeText = (type) => {
  const textMap = {
    full: '全量构建',
    backend: '仅后端',
    frontend: '仅前端'
  }
  return textMap[type] || type
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await taskApi.getTaskList()
    if (res.data.success) {
      tasks.value = res.data.tasks
    }
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const nextStep = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  activeStep.value++
}

const submitCreate = async () => {
  creating.value = true
  try {
    const res = await taskApi.createTask(createForm.value.projectName)
    if (res.data.success) {
      ElMessage.success('任务创建成功')
      showCreateDialog.value = false
      activeStep.value = 0
      createForm.value = { projectName: '', buildType: 'full', environment: 'test' }
      loadTasks()
    }
  } catch (error) {
    ElMessage.error('创建任务失败')
  } finally {
    creating.value = false
  }
}

const viewDetail = async (task) => {
  try {
    const res = await taskApi.getTaskDetail(task.taskId)
    if (res.data.success) {
      currentTask.value = res.data.task
      showDetailDrawer.value = true
    }
  } catch (error) {
    ElMessage.error('加载任务详情失败')
  }
}

const viewReport = (task) => {
  if (task.reportUrl) {
    window.open(task.reportUrl, '_blank')
  }
}

const reRunTask = async (task) => {
  try {
    await ElMessageBox.confirm('确定要重新执行该任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await taskApi.reRunTask(task.taskId)
    ElMessage.success('任务已重新加入队列')
    await loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重新执行失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    loading.value = false
  }
}

const deleteTask = async (task) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？删除后不可恢复', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })

    loading.value = true
    await taskApi.deleteTask(task.taskId)
    ElMessage.success('任务已删除')
    await loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTasks()
  setInterval(loadTasks, 10000)
})
</script>

<style scoped>
.task-list-page {
  padding-bottom: 24px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
}

/* 筛选标签 */
.filter-tabs {
  margin-bottom: 20px;
}

/* 任务卡片 */
.task-cards {
  min-height: 400px;
}

.task-col {
  margin-bottom: 20px;
}

.task-card {
  border-radius: 12px;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.task-card.status-success {
  border-left-color: #52c41a;
}

.task-card.status-failed {
  border-left-color: #f5222d;
}

.task-card.status-building,
.task-card.status-deploying,
.task-card.status-testing {
  border-left-color: #faad14;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-id {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1890ff;
  font-size: 13px;
  cursor: pointer;
  font-family: monospace;
}

.task-id:hover {
  text-decoration: underline;
}

.task-body {
  margin-bottom: 16px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.task-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

/* 进度条 */
.progress-section {
  margin-bottom: 12px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  display: block;
}

/* 结果统计 */
.result-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-item.success .stat-num {
  color: #52c41a;
}

.stat-item.failed .stat-num {
  color: #f5222d;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  display: block;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #e5e7eb;
}

.no-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #9ca3af;
  background: #f9fafb;
  border-radius: 8px;
}

/* 任务底部 */
.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

/* 步骤内容 */
.step-content {
  margin-top: 24px;
}

.confirm-step {
  margin-top: 24px;
}

.confirm-tip {
  margin-top: 16px;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

/* 任务详情 */
.task-detail {
  padding: 20px 0;
}

.log-tabs {
  margin-top: 24px;
}

.log-container {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow: auto;
}

.log-content {
  margin: 0;
  color: #a5b4fc;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.drawer-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

/* 旋转动画 */
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .filter-tabs {
    overflow-x: auto;
  }
}
</style>
