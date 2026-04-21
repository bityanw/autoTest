<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card blue">
          <div class="stat-icon"><el-icon><Collection /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalTasks }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card green">
          <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.successRate }}%</div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card orange">
          <div class="stat-icon"><el-icon><Timer /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgDuration }}m</div>
            <div class="stat-label">平均耗时</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card purple">
          <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.coverage }}%</div>
            <div class="stat-label">平均覆盖率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataLine /></el-icon>
                测试趋势
              </span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="7">近7天</el-radio-button>
                <el-radio-button label="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="trendChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><PieChartIcon /></el-icon>
                测试结果分布
              </span>
            </div>
          </template>
          <v-chart class="chart" :option="pieChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近任务 -->
    <el-row class="recent-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Clock /></el-icon>
                最近任务
              </span>
              <el-button type="primary" link @click="$router.push('/tasks')">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="recentTasks" style="width: 100%" v-loading="loading">
            <el-table-column prop="taskId" label="任务ID" width="220">
              <template #default="{ row }">
                <el-link type="primary" @click="viewTask(row)">{{ row.taskId }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="projectName" label="项目名称" width="180" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" effect="dark" round>
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="200">
              <template #default="{ row }">
                <el-progress
                  :percentage="getProgress(row)"
                  :status="getProgressStatus(row)"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="viewTask(row)">详情</el-button>
                <el-button
                  size="small"
                  type="success"
                  @click="viewReport(row)"
                  :disabled="!row.reportUrl"
                >报告</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-row :gutter="20" class="quick-actions-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Lightning /></el-icon>
                快速操作
              </span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="createTask">
              <el-icon><Plus /></el-icon>
              创建测试任务
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/reports')">
              <el-icon><Document /></el-icon>
              查看测试报告
            </el-button>
            <el-button type="warning" size="large" @click="checkHealth">
              <el-icon><FirstAidKit /></el-icon>
              系统健康检查
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建测试任务" width="500px" destroy-on-close>
      <el-form :model="createForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="项目名称" prop="projectName">
          <el-input
            v-model="createForm.projectName"
            placeholder="请输入项目名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="构建类型">
          <el-radio-group v-model="createForm.buildType">
            <el-radio-button label="full">全量构建</el-radio-button>
            <el-radio-button label="backend">仅后端</el-radio-button>
            <el-radio-button label="frontend">仅前端</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart as EChartsPieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import taskApi from '../api/task'
import {
  Collection,
  CircleCheck,
  Timer,
  TrendCharts,
  DataLine,
  PieChart as PieChartIcon,
  Clock,
  ArrowRight,
  Lightning,
  Plus,
  Document,
  FirstAidKit
} from '@element-plus/icons-vue'

use([
  CanvasRenderer,
  LineChart,
  EChartsPieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()
const loading = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const trendPeriod = ref('7')
const formRef = ref(null)

const stats = ref({
  totalTasks: 156,
  successRate: 87,
  avgDuration: 12,
  coverage: 78
})

const recentTasks = ref([])

const createForm = ref({
  projectName: '',
  buildType: 'full'
})

const rules = {
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 测试趋势图表配置
const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: {
    data: ['通过', '失败', '总计']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '通过',
      type: 'line',
      smooth: true,
      data: [120, 132, 101, 134, 90, 230, 210],
      itemStyle: { color: '#52c41a' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
          ]
        }
      }
    },
    {
      name: '失败',
      type: 'line',
      smooth: true,
      data: [20, 12, 11, 24, 20, 30, 25],
      itemStyle: { color: '#f5222d' }
    },
    {
      name: '总计',
      type: 'line',
      smooth: true,
      data: [140, 144, 112, 158, 110, 260, 235],
      itemStyle: { color: '#1890ff' }
    }
  ]
}))

// 饼图配置
const pieChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center'
  },
  series: [
    {
      name: '测试结果',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1048, name: '通过', itemStyle: { color: '#52c41a' } },
        { value: 135, name: '失败', itemStyle: { color: '#f5222d' } },
        { value: 58, name: '跳过', itemStyle: { color: '#faad14' } },
        { value: 32, name: '错误', itemStyle: { color: '#722ed1' } }
      ]
    }
  ]
}))

// 获取任务进度
const getProgress = (row) => {
  const statusMap = {
    pending: 0,
    building: 25,
    deploying: 50,
    testing: 75,
    success: 100,
    failed: 100
  }
  return statusMap[row.status] || 0
}

const getProgressStatus = (row) => {
  if (row.status === 'success') return 'success'
  if (row.status === 'failed') return 'exception'
  return ''
}

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

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await taskApi.getTaskList()
    if (res.data.success) {
      recentTasks.value = res.data.tasks.slice(0, 5)
    }
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

const createTask = () => {
  showCreateDialog.value = true
  createForm.value = { projectName: '', buildType: 'full' }
}

const submitCreate = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    const res = await taskApi.createTask(createForm.value.projectName)
    if (res.data.success) {
      ElMessage.success('任务创建成功')
      showCreateDialog.value = false
      loadTasks()
    }
  } catch (error) {
    ElMessage.error('创建任务失败')
  } finally {
    creating.value = false
  }
}

const viewTask = (row) => {
  router.push(`/tasks?taskId=${row.taskId}`)
}

const viewReport = (row) => {
  if (row.reportUrl) {
    window.open(row.reportUrl, '_blank')
  }
}

const checkHealth = async () => {
  try {
    await taskApi.getTaskList()
    ElMessage.success('系统运行正常')
  } catch {
    ElMessage.error('系统异常，请检查服务状态')
  }
}

onMounted(() => {
  loadTasks()
  setInterval(loadTasks, 10000)
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 24px;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  color: white;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.stat-card.blue {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.stat-card.green {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.stat-card.orange {
  background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
}

.stat-card.purple {
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  margin-right: 20px;
  font-size: 32px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* 图表区域 */
.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
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

.chart {
  height: 300px;
}

/* 最近任务 */
.recent-row {
  margin-bottom: 20px;
}

/* 快速操作 */
.quick-actions-row {
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  padding: 12px 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .stat-card {
    margin-bottom: 16px;
  }

  .quick-actions {
    flex-direction: column;
  }

  .quick-actions .el-button {
    width: 100%;
  }
}
</style>
