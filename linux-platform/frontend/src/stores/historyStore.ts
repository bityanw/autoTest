import { defineStore } from 'pinia'
import { ref } from 'vue'

interface HistoryAction {
  type: 'create' | 'delete' | 'update'
  target: 'task' | 'project'
  data: any
  timestamp: number
}

export const useHistoryStore = defineStore('history', () => {
  const history = ref<HistoryAction[]>([])
  const currentIndex = ref(-1)
  const maxHistorySize = 50

  // 添加历史记录
  const addHistory = (action: Omit<HistoryAction, 'timestamp'>) => {
    // 如果当前不在历史记录末尾，删除后面的记录
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // 添加新记录
    history.value.push({
      ...action,
      timestamp: Date.now()
    })

    // 限制历史记录大小
    if (history.value.length > maxHistorySize) {
      history.value.shift()
    } else {
      currentIndex.value++
    }
  }

  // 撤销
  const undo = () => {
    if (currentIndex.value >= 0) {
      const action = history.value[currentIndex.value]
      currentIndex.value--
      return action
    }
    return null
  }

  // 重做
  const redo = () => {
    if (currentIndex.value < history.value.length - 1) {
      currentIndex.value++
      const action = history.value[currentIndex.value]
      return action
    }
    return null
  }

  // 是否可以撤销
  const canUndo = () => currentIndex.value >= 0

  // 是否可以重做
  const canRedo = () => currentIndex.value < history.value.length - 1

  // 清空历史
  const clearHistory = () => {
    history.value = []
    currentIndex.value = -1
  }

  return {
    history,
    currentIndex,
    addHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  }
})
