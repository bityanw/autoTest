export interface Task {
  taskId: string
  projectName: string
  status: 'pending' | 'running' | 'success' | 'failed'
  createTime: string
  updateTime?: string
  totalTests?: number
  passedTests?: number
  failedTests?: number
  progress?: number
  currentStep?: string
}

export interface ProjectConfig {
  id: string
  name: string
  svnPath: string
  svnBranch: string
  buildType: 'full' | 'incremental'
  enabled: boolean
}

export interface WebSocketMessage {
  type: 'task_update' | 'task_progress' | 'task_complete'
  taskId: string
  data: any
}
