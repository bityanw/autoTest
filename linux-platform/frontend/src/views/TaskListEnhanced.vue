<template>
  <div class="task-list-enhanced">
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

    <!-- 批量操作工具栏 -->
    <div class="batch-toolbar" v-if="selectedTasks.length > 0">
      <div class="batch-info">
        已选择 <strong>{{ selectedTasks.length }}</strong> 个任务
      </div>
      <div class="batch-actions">
        <el-button @click="clearSelection">取消选择</el-button>
        <el-button type="danger" @click="batchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
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
    <div class="task-cards" v-loading="taskStore.loading">
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
          <el-card
            class="task-card"
            :class="[`status-${task.status}`, { 'selected': isSelected(task.taskId) }]"
            shadow="hover"
            @click="toggleSelection(task.taskId)"
          >
            <!-- 选择框 -->
            <div class="task-checkbox">
              <el-checkbox
                :model-value="isSelected(task.taskId)"
                @change="toggleSelection(task.taskId)"
                @click.stop
              />
            </div>

            <div class="task-header">
              <div class="task-id" @click.stop="viewDetail(task)">
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

              <!-- 实时进度条 -->
              <div class="progress-section" v-if="isRunning(task.status)">
                <el-progress
                  :percentage="task.progress || 0"
                  :status="getProgressStatus(task.status)"
                  :stroke-width="8"
                  striped
                  striped-flow
                  :duration="5"
                />
                <span class="progress-text">{{ task.currentStep || '处理中...' }}</span>
              </div>

              <!-- 结果统计 -->
              <div class="result-stats" v-else-if="task.totalTests">
                <div class="stat-item success">
                  <span class="stat-num">{{ task.passedTests }}</span>
                  <span class="stat-label">通过</span>
                </div>
                <div class="stat-item failed">
                  <span class="stat-num">{{ task.failedTests }}</span>
                  <span class="stat-label">失败</span>
                </div>
                <div class="stat-item total">
                  <span class="stat-num">{{ task.totalTests }}</span>
                  <span class="stat-label">总计</span>
                </div>
              </div>
            </div>

            <div class="task-footer">
              <el-button-group>
                <el-button size="small" @click.stop="viewDetail(task)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteTask(task.taskId)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </el-button-group>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建测试任务" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="createForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="任务详情" size="60%">
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ currentTask.projectName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentTask.status)">
              {{ getStatusText(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createTime }}</el-descriptions-item>
        </el-descriptions>

        <div class="log-section" v-if="currentTask.buildLog">
          <h3>构建日志</h3>
          <pre class="log-content">{{ currentTask.buildLog }}</pre>
        </div>

        <div class="log-section" v-if="currentTask.testLog">
          <h3>测试日志</h3>
          <pre class="log-content">{{ currentTask.testLog }}</pre>
        </div>
      </div>
    </el-drawer>

    <!-- 快捷键提示 -->
    <div class="shortcut-hint" v-if="showShortcutHint">
      <div class="hint-item">Ctrl+N: 创建任务</div>
      <div class="hint-item">Ctrl+R: 刷新列表</div>
      <div class="hint-item">Ctrl+Z: 撤销</div>
      <div class="hint-item">Ctrl+Y: 重做</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useShortcutStore } from '@/stores/shortcutStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Loading, CircleCheckFilled, CircleCloseFilled,
  Document, Clock, View, Delete
} from '@element-plus/icons-vue'

const taskStore = useTaskStore()
const historyStore = useHistoryStore()
const shortcutStore = useShortcutStore()

const searchKeyword = ref('')
const filterStatus = ref('')
const showCreateDialog = ref(false)
const showDetailDrawer = ref(false)
const currentTask = ref(null)
const selectedTasks = ref([])
const showShortcutHint = ref(false)
const createForm = ref({
  projectName: ''
})

// 过滤任务
const filteredTasks = computed(() => {
  let tasks = taskStore.tasks

  if (filterStatus.value) {
    tasks = tasks.filter(t => t.status === filterStatus.value)
  }

  if (searchKeyword.value) {
    tasks = tasks.filter(t =>
      t.projectName.includes(searchKeyword.value) ||
      t.taskId.includes(searchKeyword.value)
    )
  }

  return tasks
})

// 选择相关
const isSelected = (taskId) => selectedTasks.value.includes(taskId)

const toggleSelection = (taskId) => {
  const index = selectedTasks.value.indexOf(taskId)
  if (index > -1) {
    selectedTasks.value.splice(index, 1)
  } else {
    selectedTasks.value.push(taskId)
  }
}

const clearSelection = () => {
  selectedTasks.value = []
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTasks.value.length} 个任务吗？`,
      '批量删除',
      { type: 'warning' }
    )

    await taskStore.batchDeleteTasks(selectedTasks.value)

    historyStore.addHistory({
      type: 'delete',
      target: 'task',
      data: { taskIds: [...selectedTasks.value] }
    })

    ElMessage.success('批量删除成功')
    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 创建任务
const handleCreate = async () => {
  try {
    await taskStore.createTask(createForm.value.projectName)

    historyStore.addHistory({
      type: 'create',
      target: 'task',
      data: { projectName: createForm.value.projectName }
    })

    ElMessage.success('任务创建成功')
    showCreateDialog.value = false
    createForm.value.projectName = ''
  } catch (error) {
    ElMessage.error('任务创建失败')
  }
}

// 删除任务
const deleteTask = async (taskId) => {
  try {
    await ElMessageBox.confirm('确定要删除此任务吗？', '删除任务', { type: 'warning' })

    const task = taskStore.tasks.find(t => t.taskId === taskId)
    await taskStore.deleteTask(taskId)

    historyStore.addHistory({
      type: 'delete',
      target: 'task',
      data: { task }
    })

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 查看详情
const viewDetail = (task) => {
  currentTask.value = task
  showDetailDrawer.value = true
}

// 工具函数
const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    running: 'warning',
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
    running: '运行中',
    building: '编译中',
    deploying: '部署中',
    testing: '测试中',
    success: '成功',
    failed: '失败'
  }
  return textMap[status] || status
}

const getProgressStatus = (status) => {
  return status === 'failed' ? 'exception' : undefined
}

const isRunning = (status) => {
  return ['running', 'building', 'deploying', 'testing'].includes(status)
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 撤销/重做
const handleUndo = async () => {
  if (!historyStore.canUndo()) {
    ElMessage.info('没有可撤销的操作')
    return
  }

  const action = historyStore.undo()
  if (action && action.type === 'delete' && action.target === 'task') {
    ElMessage.success('已撤销删除操作')
  }
}

const handleRedo = async () => {
  if (!historyStore.canRedo()) {
    ElMessage.info('没有可重做的操作')
    return
  }

  const action = historyStore.redo()
  if (action) {
    ElMessage.success('已重做操作')
  }
}

// 注册快捷键
onMounted(() => {
  taskStore.fetchTasks()
  taskStore.connectWebSocket()

  shortcutStore.register({
    key: 'n',
    ctrl: true,
    description: '创建新任务',
    action: () => { showCreateDialog.value = true }
  })

  shortcutStore.register({
    key: 'r',
    ctrl: true,
    description: '刷新任务列表',
    action: () => { taskStore.fetchTasks() }
  })

  shortcutStore.register({
    key: 'z',
    ctrl: true,
    description: '撤销操作',
    action: handleUndo
  })

  shortcutStore.register({
    key: 'y',
    ctrl: true,
    description: '重做操作',
    action: handleRedo
  })

  shortcutStore.register({
    key: '?',
    shift: true,
    description: '显示快捷键',
    action: () => { showShortcutHint.value = !showShortcutHint.value }
  })
})

onUnmounted(() => {
  taskStore.disconnectWebSocket()
  shortcutStore.unregister('n')
  shortcutStore.unregister('r')
  shortcutStore.unregister('z')
  shortcutStore.unregister('y')
  shortcutStore.unregister('?')
})
</script>

<style scoped>
.task-list-enhanced {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-info {
  color: #409eff;
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.filter-tabs {
  margin-bottom: 20px;
}

.task-cards {
  min-height: 400px;
}

.task-card {
  position: relative;
  margin-bottom: 20px;
  transition: all 0.3s;
  cursor: pointer;
}

.task-card.selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.task-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  margin-top: 8px;
}

.task-id {
  font-family: monospace;
  color: #606266;
  cursor: pointer;
}

.task-id:hover {
  color: #409eff;
}

.progress-section {
  margin: 16px 0;
}

.progress-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  margin: 16px 0;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.stat-item.success .stat-num {
  color: #67c23a;
}

.stat-item.failed .stat-num {
  color: #f56c6c;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.task-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.log-section {
  margin-top: 20px;
}

.log-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.6;
}

.shortcut-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 1000;
}

.hint-item {
  margin: 4px 0;
}
</style>
