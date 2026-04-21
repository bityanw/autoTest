import { defineStore } from 'pinia'
import { ref } from 'vue'

interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export const useShortcutStore = defineStore('shortcut', () => {
  const shortcuts = ref<KeyBinding[]>([])
  const enabled = ref(true)

  // 注册快捷键
  const register = (binding: KeyBinding) => {
    shortcuts.value.push(binding)
  }

  // 注销快捷键
  const unregister = (key: string) => {
    shortcuts.value = shortcuts.value.filter(s => s.key !== key)
  }

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return

    // 忽略输入框中的快捷键
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    const shortcut = shortcuts.value.find(s => {
      return (
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrl === event.ctrlKey &&
        !!s.shift === event.shiftKey &&
        !!s.alt === event.altKey
      )
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }

  // 启用/禁用快捷键
  const toggle = (value: boolean) => {
    enabled.value = value
  }

  // 获取所有快捷键列表
  const getShortcuts = () => shortcuts.value

  return {
    shortcuts,
    enabled,
    register,
    unregister,
    handleKeyDown,
    toggle,
    getShortcuts
  }
})
