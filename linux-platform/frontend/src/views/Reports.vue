<template>
  <div class="reports-page">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">测试报告</h2>
        <p class="page-subtitle">查看和分析自动化测试报告</p>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索报告..."
          clearable
          class="search-input"
          :prefix-icon="Search"
        />
        <el-button type="primary">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon bg-blue"><el-icon><Document /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalReports }}</div>
            <div class="stat-label">总报告数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon bg-green"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.passRate }}%</div>
            <div class="stat-label">平均通过率</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon bg-orange"><el-icon><TrendCharts /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgCoverage }}%</div>
            <div class="stat-label">平均覆盖率</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon bg-purple"><el-icon><Timer /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgDuration }}m</div>
            <div class="stat-label">平均执行时长</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 报告列表 -->
    <el-card class="reports-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">历史报告</span>
          <el-radio-group v-model="timeRange" size="small">
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="reports-timeline">
        <el-empty v-if="reports.length === 0" description="暂无报告" />

        <div v-for="(group, date) in groupedReports" :key="date" class="timeline-group">
          <div class="timeline-date">
            <el-icon><Calendar /></el-icon>
            <span>{{ date }}</span>
          </div>

          <div class="timeline-items">
            <div
              v-for="report in group"
              :key="report.id"
              class="timeline-item"
              :class="`status-${report.status}`"
            >
              <div class="item-dot"></div>
              <div class="item-content">
                <div class="item-header">
                  <div class="item-title">
                    <span class="project-name">{{ report.projectName }}</span>
                    <el-tag
                      :type="getStatusType(report.status)"
                      effect="dark"
                      round
                      size="small"
                    >
                      {{ getStatusText(report.status) }}
                    </el-tag>
                  </div>
                  <div class="item-time">{{ report.time }}</div>
                </div>

                <div class="item-stats">
                  <div class="stat">
                    <span class="stat-label">用例数:</span>
                    <span class="stat-value">{{ report.totalTests }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">通过:</span>
                    <span class="stat-value success">{{ report.passedTests }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">失败:</span>
                    <span class="stat-value failed">{{ report.failedTests }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">覆盖率:</span>
                    <span class="stat-value">{{ report.coverage }}%</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">耗时:</span>
                    <span class="stat-value">{{ report.duration }}m</span>
                  </div>
                </div>

                <div class="item-actions">
                  <el-button
                    type="primary"
                    link
                    @click="viewReport(report)"
                  >
                    <el-icon><View /></el-icon>
                    查看详情
                  </el-button>
                  <el-button
                    type="success"
                    link
                    @click="downloadReport(report)"
                  >
                    <el-icon><Download /></el-icon>
                    下载报告
                  </el-button>
                  <el-button
                    type="info"
                    link
                    @click="compareReport(report)"
                  >
                    <el-icon><TrendCharts /></el-icon>
                    对比
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="100"
          :page-size="10"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Download,
  Document,
  CircleCheck,
  TrendCharts,
  Timer,
  Calendar,
  View
} from '@element-plus/icons-vue'

const searchKeyword = ref('')
const timeRange = ref('week')

const stats = ref({
  totalReports: 156,
  passRate: 87,
  avgCoverage: 78,
  avgDuration: 12
})

const reports = ref([
  {
    id: '1',
    projectName: '电商系统',
    status: 'success',
    time: '14:30',
    totalTests: 120,
    passedTests: 115,
    failedTests: 5,
    coverage: 82,
    duration: 15
  },
  {
    id: '2',
    projectName: '用户中心',
    status: 'failed',
    time: '11:20',
    totalTests: 80,
    passedTests: 60,
    failedTests: 20,
    coverage: 65,
    duration: 10
  },
  {
    id: '3',
    projectName: '订单系统',
    status: 'success',
    time: '09:45',
    totalTests: 150,
    passedTests: 148,
    failedTests: 2,
    coverage: 88,
    duration: 18
  }
])

const groupedReports = computed(() => {
  return {
    '今天': reports.value,
    '昨天': reports.value.slice().reverse()
  }
})

const getStatusType = (status) => {
  const typeMap = {
    success: 'success',
    failed: 'danger',
    partial: 'warning'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    success: '通过',
    failed: '失败',
    partial: '部分通过'
  }
  return textMap[status] || status
}

const viewReport = (report) => {
  ElMessage.info('查看报告: ' + report.projectName)
}

const downloadReport = (report) => {
  ElMessage.success('开始下载报告')
}

const compareReport = (report) => {
  ElMessage.info('对比报告功能开发中')
}
</script>

<style scoped>
.reports-page {
  padding-bottom: 24px;
}

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

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.bg-blue { background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); }
.bg-green { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); }
.bg-orange { background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%); }
.bg-purple { background: linear-gradient(135deg, #722ed1 0%, #531dab 100%); }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

/* 报告卡片 */
.reports-card {
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
}

/* 时间线 */
.reports-timeline {
  padding: 20px 0;
}

.timeline-group {
  margin-bottom: 32px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 16px;
  padding-left: 8px;
}

.timeline-items {
  position: relative;
  padding-left: 24px;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 10px;
  margin-left: 16px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s;
}

.timeline-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.timeline-item.status-success {
  border-left-color: #52c41a;
}

.timeline-item.status-failed {
  border-left-color: #f5222d;
}

.timeline-item.status-partial {
  border-left-color: #faad14;
}

.item-dot {
  position: absolute;
  left: -25px;
  top: 20px;
  width: 12px;
  height: 12px;
  background: white;
  border: 3px solid #d1d5db;
  border-radius: 50%;
  z-index: 1;
}

.timeline-item.status-success .item-dot {
  border-color: #52c41a;
}

.timeline-item.status-failed .item-dot {
  border-color: #f5222d;
}

.timeline-item.status-partial .item-dot {
  border-color: #faad14;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.item-time {
  font-size: 13px;
  color: #9ca3af;
}

.item-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.failed {
  color: #f5222d;
}

.item-actions {
  display: flex;
  gap: 8px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
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

  .item-stats {
    gap: 12px;
  }

  .item-actions {
    flex-wrap: wrap;
  }
}
</style>
