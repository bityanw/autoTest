import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { ProjectConfig } from '../models/types';

interface Database {
  projects: ProjectConfig[];
}

class ProjectConfigService {
  private readonly dbFile = join(__dirname, '../../data/projects.json');
  private readonly windowsAgentUrl = process.env.WINDOWS_AGENT_URL || 'http://localhost:18082';
  private readonly svnTestTimeoutMs = this.parseSvnTestTimeoutMs(process.env.SVN_TEST_TIMEOUT_MS);
  private mutationQueue: Promise<void> = Promise.resolve();

  private parseSvnTestTimeoutMs(rawValue?: string): number {
    const defaultTimeoutMs = 60000;
    const parsed = Number.parseInt(rawValue ?? '', 10);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return defaultTimeoutMs;
  }

  private async ensureDataFile() {
    await mkdir(dirname(this.dbFile), { recursive: true });

    try {
      await readFile(this.dbFile, 'utf8');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await writeFile(
        this.dbFile,
        JSON.stringify({ projects: [] } satisfies Database, null, 2),
        'utf8'
      );
    }
  }

  private async readDatabase(): Promise<Database> {
    await this.ensureDataFile();
    const raw = await readFile(this.dbFile, 'utf8');

    if (!raw.trim()) {
      return { projects: [] };
    }

    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      projects: Array.isArray(parsed.projects) ? parsed.projects : []
    };
  }

  private async writeDatabase(database: Database) {
    await this.ensureDataFile();
    await writeFile(this.dbFile, JSON.stringify(database, null, 2), 'utf8');
  }

  private async mutate<T>(mutator: (database: Database) => Promise<T> | T): Promise<T> {
    const run = this.mutationQueue.then(async () => {
      const database = await this.readDatabase();
      const result = await mutator(database);
      await this.writeDatabase(database);
      return result;
    });

    this.mutationQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  async init() {
    await this.ensureDataFile();
  }

  async getAllProjects(): Promise<ProjectConfig[]> {
    const database = await this.readDatabase();
    return database.projects;
  }

  async getProject(id: string): Promise<ProjectConfig | undefined> {
    const database = await this.readDatabase();
    return database.projects.find(project => project.id === id);
  }

  async getProjectByName(name: string): Promise<ProjectConfig | undefined> {
    const database = await this.readDatabase();
    return database.projects.find(project => project.name === name);
  }

  async createProject(config: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectConfig> {
    return this.mutate(async database => {
      const newProject: ProjectConfig = {
        ...config,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      database.projects.push(newProject);
      return newProject;
    });
  }

  async updateProject(id: string, updates: Partial<ProjectConfig>): Promise<ProjectConfig | null> {
    return this.mutate(async database => {
      const index = database.projects.findIndex(project => project.id === id);
      if (index === -1) {
        return null;
      }

      database.projects[index] = {
        ...database.projects[index],
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };

      return database.projects[index];
    });
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.mutate(async database => {
      const index = database.projects.findIndex(project => project.id === id);
      if (index === -1) {
        return false;
      }

      database.projects.splice(index, 1);
      return true;
    });
  }

  async testSvnConnection(svnPath: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${this.windowsAgentUrl}/api/build/test-svn`,
        { svnPath },
        { timeout: 10000 }
      );

      return {
        success: response.data.success,
        message: response.data.message || 'SVN连接测试成功'
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const remoteMessage = error.response?.data?.message;
        if (typeof remoteMessage === 'string' && remoteMessage.trim()) {
          return {
            success: false,
            message: `SVN connection test failed: ${remoteMessage}`
          };
        }

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          return {
            success: false,
            message: `SVN connection test failed: timeout after ${this.svnTestTimeoutMs}ms (WINDOWS_AGENT_URL=${this.windowsAgentUrl})`
          };
        }
      }

      return {
        success: false,
        message: `SVN连接测试失败: ${error.message}`
      };
    }
  }
}

export const projectConfigService = new ProjectConfigService();
