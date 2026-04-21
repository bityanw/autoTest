import { Router } from 'express';
import { projectConfigController } from '../controllers/projectConfigController';

const router = Router();

// 获取所有项目
router.get('/list', (req, res) => projectConfigController.getAllProjects(req, res));

// 获取单个项目
router.get('/:id', (req, res) => projectConfigController.getProject(req, res));

// 创建项目
router.post('/create', (req, res) => projectConfigController.createProject(req, res));

// 更新项目
router.put('/update/:id', (req, res) => projectConfigController.updateProject(req, res));

// 删除项目
router.delete('/delete/:id', (req, res) => projectConfigController.deleteProject(req, res));

// 测试SVN连接
router.post('/test-svn', (req, res) => projectConfigController.testSvnConnection(req, res));

export default router;
