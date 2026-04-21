import { Request, Response } from 'express';
import { projectConfigService } from '../services/projectConfigService';
import { logger } from '../utils/logger';

export class ProjectConfigController {
  // 获取所有项目
  async getAllProjects(req: Request, res: Response) {
    try {
      const projects = await projectConfigService.getAllProjects();
      res.json({
        success: true,
        data: projects
      });
    } catch (error: any) {
      logger.error('获取项目列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取单个项目
  async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await projectConfigService.getProject(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        data: project
      });
    } catch (error: any) {
      logger.error('获取项目失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 创建项目
  async createProject(req: Request, res: Response) {
    try {
      const config = req.body;

      // 检查项目名是否已存在
      const existing = await projectConfigService.getProjectByName(config.name);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: '项目名称已存在'
        });
      }

      const newProject = await projectConfigService.createProject(config);

      res.json({
        success: true,
        data: newProject,
        message: '项目创建成功'
      });
    } catch (error: any) {
      logger.error('创建项目失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 更新项目
  async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedProject = await projectConfigService.updateProject(id, updates);

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        data: updatedProject,
        message: '项目更新成功'
      });
    } catch (error: any) {
      logger.error('更新项目失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除项目
  async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await projectConfigService.deleteProject(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        message: '项目删除成功'
      });
    } catch (error: any) {
      logger.error('删除项目失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 测试SVN连接
  async testSvnConnection(req: Request, res: Response) {
    try {
      const { svnPath } = req.body;
      const result = await projectConfigService.testSvnConnection(svnPath);

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error: any) {
      logger.error('测试SVN连接失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const projectConfigController = new ProjectConfigController();
