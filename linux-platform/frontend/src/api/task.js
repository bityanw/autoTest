import axios from 'axios'

const request = axios.create({
    baseURL: '/api',
    timeout: 30000
})

export default {
    // 创建测试任务
    createTask(projectName) {
        return request.post('/task/create', { projectName })
    },

    // 获取任务列表
    getTaskList() {
        return request.get('/task/list')
    },

    // 获取任务详情
    getTaskDetail(taskId) {
        return request.get(`/task/detail/${taskId}`)
    },

    // 重新执行任务
    reRunTask(taskId) {
        return request.post(`/task/rerun/${taskId}`)
    },

    // 删除任务
    deleteTask(taskId) {
        return request.delete(`/task/delete/${taskId}`)
    },

    // 测试连接
    testConnection(type, config) {
        return request.post('/task/test-connection', { type, config })
    }
}
