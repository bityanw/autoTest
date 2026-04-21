import { Request, Response } from 'express';
import axios from 'axios';
import Docker from 'dockerode';
import nodemailer from 'nodemailer';
import { taskService } from '../services/taskService';
import { logger } from '../utils/logger';

export class TaskController {
  // 创建任务
  async createTask(req: Request, res: Response) {
    try {
      const { projectName } = req.body;

      if (!projectName) {
        return res.status(400).json({
          success: false,
          message: '项目名称不能为空'
        });
      }

      const task = await taskService.createTask(projectName);

      res.json({
        success: true,
        taskId: task.taskId,
        message: '任务创建成功'
      });
    } catch (error: any) {
      logger.error('创建任务失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取任务详情
  async getTaskDetail(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const task = taskService.getTask(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        task
      });
    } catch (error: any) {
      logger.error('获取任务详情失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 获取任务列表
  async getTaskList(req: Request, res: Response) {
    try {
      const tasks = taskService.getAllTasks();

      res.json({
        success: true,
        tasks,
        total: tasks.length
      });
    } catch (error: any) {
      logger.error('获取任务列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 健康检查
  async health(req: Request, res: Response) {
    res.send('OK');
  }

  // 重新执行任务
  async reRunTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const oldTask = taskService.getTask(taskId);

      if (!oldTask) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      // 创建新任务
      const newTask = await taskService.createTask(oldTask.projectName);

      res.json({
        success: true,
        taskId: newTask.taskId,
        message: '任务已重新加入队列'
      });
    } catch (error: any) {
      logger.error('重新执行任务失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 删除任务
  async deleteTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const deleted = taskService.deleteTask(taskId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        message: '任务已删除'
      });
    } catch (error: any) {
      logger.error('删除任务失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 测试连接
  async testConnection(req: Request, res: Response) {
    try {
      const { type, config } = req.body;

      let result = { success: false, message: '' };

      switch (type) {
        case 'agent':
          result = await this.testAgentConnection(config.url);
          break;
        case 'docker':
          result = await this.testDockerConnection();
          break;
        case 'maven':
          result = await this.testMavenConnection(config.url);
          break;
        case 'email':
          result = await this.testEmailConnection(config);
          break;
        default:
          result = { success: false, message: '未知的连接类型' };
      }

      res.json(result);
    } catch (error: any) {
      logger.error('测试连接失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 测试Windows Agent连接
  private async testAgentConnection(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(`${url}/api/health`, { timeout: 5000 });
      return {
        success: response.status === 200,
        message: '连接成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `连接失败: ${error.message}`
      };
    }
  }

  // 测试Docker连接
  private async testDockerConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const docker = new Docker({ socketPath: '/var/run/docker.sock' });
      await docker.ping();
      return {
        success: true,
        message: 'Docker连接成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Docker连接失败: ${error.message}`
      };
    }
  }

  // 测试Maven私服连接
  private async testMavenConnection(url: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      return {
        success: response.status === 200,
        message: 'Maven私服连接成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Maven私服连接失败: ${error.message}`
      };
    }
  }

  // 测试邮件连接
  private async testEmailConnection(config: any): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.password
        }
      });

      await transporter.sendMail({
        from: config.user,
        to: config.to,
        subject: '测试邮件 - AutoTest平台',
        text: '这是一封测试邮件，如果您收到此邮件，说明邮件配置正确。',
        html: '<p>这是一封测试邮件，如果您收到此邮件，说明邮件配置正确。</p>'
      });

      return {
        success: true,
        message: '测试邮件已发送'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `邮件发送失败: ${error.message}`
      };
    }
  }
}

export const taskController = new TaskController();
