import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task } from '@/types'
import axios from 'axios'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const wsConnected = ref(false)

  // WebSocket连接
  let ws: WebSocket | null = null

  // 获取任务列表
  const fetchTasks = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/task/list')
      tasks.value = response.data.data || []
    } catch (error) {
      console.error('获取任务列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建任务
  const createTask = async (projectName: string) => {
    try {
      const response = await axios.post('/api/task/create', { projectName })
      await fetchTasks()
      return response.data
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  }

  // 删除任务
  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`/api/task/${taskId}`)
      tasks.value = tasks.value.filter(t => t.taskId !== taskId)
    } catch (error) {
      console.error('删除任务失败:', error)
      throw error
    }
  }

  // 批量删除任务
  const batchDeleteTasks = async (taskIds: string[]) => {
    try {
      await Promise.all(taskIds.map(id => deleteTask(id)))
    } catch (error) {
      console.error('批量删除失败:', error)
      throw error
    }
  }

  // 更新任务状态（通过WebSocket）
  const updateTaskStatus = (taskId: string, data: Partial<Task>) => {
    const index = tasks.value.findIndex(t => t.taskId === taskId)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...data }
    }
  }

  // 连接WebSocket
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      wsConnected.value = true
      console.log('WebSocket已连接')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'task_update' || message.type === 'task_progress') {
          updateTaskStatus(message.taskId, message.data)
        } else if (message.type === 'task_complete') {
          updateTaskStatus(message.taskId, message.data)
        }
      } catch (error) {
        console.error('WebSocket消息解析失败:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error)
      wsConnected.value = false
    }

    ws.onclose = () => {
      wsConnected.value = false
      console.log('WebSocket已断开，5秒后重连...')
      setTimeout(connectWebSocket, 5000)
    }
  }

  // 断开WebSocket
  const disconnectWebSocket = () => {
    if (ws) {
      ws.close()
      ws = null
    }
  }

  // 计算属性
  const runningTasks = computed(() =>
    tasks.value.filter(t => t.status === 'running')
  )

  const completedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'success' || t.status === 'failed')
  )

  return {
    tasks,
    loading,
    wsConnected,
    runningTasks,
    completedTasks,
    fetchTasks,
    createTask,
    deleteTask,
    batchDeleteTasks,
    updateTaskStatus,
    connectWebSocket,
    disconnectWebSocket
  }
})
