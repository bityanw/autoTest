import { Router } from 'express';
import { taskController } from '../controllers/taskController';

const router = Router();

// 构建回调
router.post('/callback', (req, res) => taskController.buildCallback(req, res));

// 创建任务
router.post('/create', (req, res) => taskController.createTask(req, res));

// 获取任务详情
router.get('/detail/:taskId', (req, res) => taskController.getTaskDetail(req, res));

// 获取任务列表
router.get('/list', (req, res) => taskController.getTaskList(req, res));

// 重新执行任务
router.post('/rerun/:taskId', (req, res) => taskController.reRunTask(req, res));

// 删除任务
router.delete('/delete/:taskId', (req, res) => taskController.deleteTask(req, res));

// 测试连接
router.post('/test-connection', (req, res) => taskController.testConnection(req, res));

// 健康检查
router.get('/health', (req, res) => taskController.health(req, res));

export default router;
