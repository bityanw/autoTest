import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import TaskList from '../views/TaskList.vue'
import Reports from '../views/Reports.vue'
import Settings from '../views/Settings.vue'
import ProjectConfig from '../views/ProjectConfig.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard
    },
    {
        path: '/tasks',
        name: 'TaskList',
        component: TaskList
    },
    {
        path: '/projects',
        name: 'ProjectConfig',
        component: ProjectConfig
    },
    {
        path: '/reports',
        name: 'Reports',
        component: Reports
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
