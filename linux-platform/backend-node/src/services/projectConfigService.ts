import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ProjectConfig } from '../models/types';

interface Database {
  projects: ProjectConfig[];
}

class ProjectConfigService {
  private db: Low<Database>;

  constructor() {
    const file = join(__dirname, '../../data/projects.json');
    const adapter = new JSONFile<Database>(file);
    this.db = new Low(adapter, { projects: [] });
  }

  async init() {
    await this.db.read();
    this.db.data ||= { projects: [] };
  }

  // 获取所有项目
  async getAllProjects(): Promise<ProjectConfig[]> {
    await this.db.read();
    return this.db.data.projects;
  }

  // 获取单个项目
  async getProject(id: string): Promise<ProjectConfig | undefined> {
    await this.db.read();
    return this.db.data.projects.find(p => p.id === id);
  }

  // 根据名称获取项目
  async getProjectByName(name: string): Promise<ProjectConfig | undefined> {
    await this.db.read();
    return this.db.data.projects.find(p => p.name === name);
  }

  // 创建项目
  async createProject(config: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectConfig> {
    await this.db.read();

    const newProject: ProjectConfig = {
      ...config,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.db.data.projects.push(newProject);
    await this.db.write();

    return newProject;
  }

  // 更新项目
  async updateProject(id: string, updates: Partial<ProjectConfig>): Promise<ProjectConfig | null> {
    await this.db.read();

    const index = this.db.data.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.db.data.projects[index] = {
      ...this.db.data.projects[index],
      ...updates,
      id, // 保持ID不变
      updatedAt: new Date().toISOString()
    };

    await this.db.write();
    return this.db.data.projects[index];
  }

  // 删除项目
  async deleteProject(id: string): Promise<boolean> {
    await this.db.read();

    const index = this.db.data.projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.db.data.projects.splice(index, 1);
    await this.db.write();

    return true;
  }

  // 测试SVN连接
  async testSvnConnection(svnPath: string): Promise<{ success: boolean; message: string }> {
    try {
      // 调用Windows Agent的SVN测试接口
      const windowsAgentUrl = process.env.WINDOWS_AGENT_URL || 'http://192.168.1.100:8081';
      const response = await axios.post(
        `${windowsAgentUrl}/api/build/test-svn`,
        { svnPath },
        { timeout: 10000 }
      );

      return {
        success: response.data.success,
        message: response.data.message || 'SVN连接测试成功'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SVN连接测试失败: ${error.message}`
      };
    }
  }
}

export const projectConfigService = new ProjectConfigService();
