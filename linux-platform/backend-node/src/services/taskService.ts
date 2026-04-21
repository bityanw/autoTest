import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import * as fs from 'fs';
import * as path from 'path';
import { TestTask, BuildRequest, BuildResponse } from '../models/types';
import { logger } from '../utils/logger';
import { projectConfigService } from './projectConfigService';

class TaskService {
  private tasks: Map<string, TestTask> = new Map();
  private windowsAgentUrl = process.env.WINDOWS_AGENT_URL || 'http://192.168.1.100:8081';
  private docker = new Docker({ socketPath: '/var/run/docker.sock' });

  // 创建测试任务
  async createTask(projectName: string): Promise<TestTask> {
    const taskId = uuidv4();

    const task: TestTask = {
      taskId,
      projectName,
      status: 'pending',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    this.tasks.set(taskId, task);
    logger.info(`创建测试任务: ${taskId}`);

    // 异步执行任务
    this.executeTask(task);

    return task;
  }

  // 执行测试任务
  private async executeTask(task: TestTask) {
    try {
      // 1. 获取项目配置
      const project = await projectConfigService.getProjectByName(task.projectName);
      if (!project) {
        throw new Error(`项目配置不存在: ${task.projectName}`);
      }

      // 2. 触发Windows编译
      logger.info(`步骤1: 触发Windows编译`);
      task.status = 'building';
      this.updateTask(task);

      const buildRequest: BuildRequest = {
        svnPath: project.svn.path,
        svnBranch: project.svn.branch,
        mavenRepoUrl: process.env.MAVEN_REPO_URL!,
        projectName: task.projectName,
        buildType: project.build.type,
        callbackUrl: `http://localhost:${process.env.PORT}/api/task/callback`
      };

      const buildResponse = await this.triggerBuild(buildRequest);
      task.buildId = buildResponse.buildId;
      this.updateTask(task);

      // 3. 等待构建完成
      logger.info(`步骤2: 等待构建完成`);
      const finalBuildResponse = await this.waitForBuild(buildResponse.buildId);

      if (finalBuildResponse.status !== 'success') {
        task.status = 'failed';
        task.buildLog = finalBuildResponse.buildLog;
        this.updateTask(task);
        return;
      }

      task.buildLog = finalBuildResponse.buildLog;

      // 4. Docker部署
      logger.info(`步骤3: Docker部署应用`);
      task.status = 'deploying';
      this.updateTask(task);

      await this.deployApplication(task.projectName, finalBuildResponse);

      // 5. 执行测试
      logger.info(`步骤4: 执行Playwright测试`);
      task.status = 'testing';
      this.updateTask(task);

      const testLog = await this.runTests(task.projectName);
      task.testLog = testLog;

      // 6. 解析测试结果
      logger.info(`步骤5: 解析测试结果`);
      const testResults = await this.parseTestResults(task.taskId, task.projectName);
      task.totalTests = testResults.total;
      task.passedTests = testResults.passed;
      task.failedTests = testResults.failed;
      task.coverage = testResults.coverage;

      // 7. 生成报告
      task.reportUrl = `/reports/${task.taskId}/index.html`;

      task.status = 'success';
      task.updateTime = new Date().toISOString();
      this.updateTask(task);

      logger.info(`测试任务完成: ${task.taskId}`);

    } catch (error: any) {
      logger.error(`测试任务执行失败: ${error.message}`);
      task.status = 'failed';
      task.testLog = error.message;
      this.updateTask(task);
    }
  }

  // 调用Windows Agent触发编译
  private async triggerBuild(request: BuildRequest): Promise<BuildResponse> {
    try {
      const response = await axios.post(
        `${this.windowsAgentUrl}/api/build/start`,
        request,
        { timeout: 30000 }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`调用Windows Agent失败: ${error.message}`);
    }
  }

  // 等待构建完成
  private async waitForBuild(buildId: string): Promise<BuildResponse> {
    const maxRetries = 60;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await axios.get(
          `${this.windowsAgentUrl}/api/build/status/${buildId}`
        );
        const buildResponse: BuildResponse = response.data;

        if (buildResponse.status === 'success' || buildResponse.status === 'failed') {
          return buildResponse;
        }

        await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
        retryCount++;
      } catch (error: any) {
        logger.error(`查询构建状态失败: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        retryCount++;
      }
    }

    throw new Error('构建超时');
  }

  // Docker部署应用
  private async deployApplication(projectName: string, buildResponse: BuildResponse): Promise<void> {
    try {
      const containerName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-app`;
      const imageName = 'app-runner:latest';
      const mavenRepoUrl = process.env.MAVEN_REPO_URL || '';

      logger.info(`开始部署应用: ${containerName}`);

      // 1. 停止并删除旧容器
      try {
        const oldContainer = this.docker.getContainer(containerName);
        await oldContainer.stop();
        await oldContainer.remove();
        logger.info(`已删除旧容器: ${containerName}`);
      } catch (error) {
        // 容器不存在，忽略错误
      }

      // 2. 创建新容器
      const container = await this.docker.createContainer({
        name: containerName,
        Image: imageName,
        Env: [
          `PROJECT_NAME=${projectName}`,
          `MAVEN_REPO_URL=${mavenRepoUrl}`,
          `ARTIFACT_URL=${buildResponse.artifactUrl || ''}`
        ],
        HostConfig: {
          PortBindings: {
            '8080/tcp': [{ HostPort: '0' }] // 随机端口
          },
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        },
        ExposedPorts: {
          '8080/tcp': {}
        }
      });

      // 3. 启动容器
      await container.start();
      logger.info(`容器启动成功: ${containerName}`);

      // 4. 获取容器信息
      const containerInfo = await container.inspect();
      const hostPort = containerInfo.NetworkSettings.Ports['8080/tcp']?.[0]?.HostPort;

      logger.info(`应用访问地址: http://localhost:${hostPort}`);

      // 5. 等待应用启动
      await this.waitForAppReady(`http://localhost:${hostPort}`, 60);

    } catch (error: any) {
      logger.error(`Docker部署失败: ${error.message}`);
      throw new Error(`Docker部署失败: ${error.message}`);
    }
  }

  // 等待应用就绪
  private async waitForAppReady(url: string, maxRetries: number): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(`${url}/actuator/health`, { timeout: 2000 });
        logger.info('应用已就绪');
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('应用启动超时');
  }

  // 执行Playwright测试
  private async runTests(projectName: string): Promise<string> {
    try {
      const containerName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-playwright`;
      const imageName = 'mcr.microsoft.com/playwright:v1.40.0-focal';
      const testsPath = `/opt/tests/${projectName}`;

      logger.info(`开始执行Playwright测试: ${containerName}`);

      // 1. 停止并删除旧测试容器
      try {
        const oldContainer = this.docker.getContainer(containerName);
        await oldContainer.stop();
        await oldContainer.remove();
      } catch (error) {
        // 容器不存在，忽略错误
      }

      // 2. 创建测试容器
      const container = await this.docker.createContainer({
        name: containerName,
        Image: imageName,
        Cmd: ['npx', 'playwright', 'test', '--reporter=html'],
        WorkingDir: testsPath,
        HostConfig: {
          Binds: [
            `${testsPath}:${testsPath}:ro`,
            `/opt/reports/${projectName}:/opt/reports:rw`
          ],
          NetworkMode: 'bridge',
          AutoRemove: true
        },
        Env: [
          'CI=true',
          `BASE_URL=http://host.docker.internal:8080`
        ]
      });

      // 3. 启动容器并等待完成
      await container.start();
      logger.info(`测试容器启动: ${containerName}`);

      // 4. 等待测试完成
      const result = await container.wait();
      logger.info(`测试完成，退出码: ${result.StatusCode}`);

      // 5. 获取测试日志
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false
      });

      const testLog = logs.toString('utf-8');
      logger.info('测试日志已收集');

      return testLog;

    } catch (error: any) {
      logger.error(`Playwright测试执行失败: ${error.message}`);
      throw new Error(`测试执行失败: ${error.message}`);
    }
  }

  // 解析测试结果
  private async parseTestResults(taskId: string, projectName: string): Promise<{
    total: number;
    passed: number;
    failed: number;
    coverage: number;
  }> {
    try {
      const reportPath = `/opt/reports/${projectName}/results.json`;

      // 检查报告文件是否存在
      if (!fs.existsSync(reportPath)) {
        logger.warn(`测试报告不存在: ${reportPath}，使用默认值`);
        return { total: 0, passed: 0, failed: 0, coverage: 0 };
      }

      // 读取Playwright JSON报告
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

      let total = 0;
      let passed = 0;
      let failed = 0;

      // 解析测试套件
      if (reportData.suites && Array.isArray(reportData.suites)) {
        reportData.suites.forEach((suite: any) => {
          if (suite.specs && Array.isArray(suite.specs)) {
            suite.specs.forEach((spec: any) => {
              total++;
              if (spec.ok) {
                passed++;
              } else {
                failed++;
              }
            });
          }
        });
      }

      // 尝试读取覆盖率报告
      let coverage = 0;
      const coveragePath = `/opt/reports/${projectName}/coverage/coverage-summary.json`;
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
        if (coverageData.total && coverageData.total.lines) {
          coverage = coverageData.total.lines.pct || 0;
        }
      }

      logger.info(`测试结果: 总计${total}, 通过${passed}, 失败${failed}, 覆盖率${coverage}%`);

      return { total, passed, failed, coverage };

    } catch (error: any) {
      logger.error(`解析测试结果失败: ${error.message}`);
      // 返回默认值而不是抛出错误
      return { total: 0, passed: 0, failed: 0, coverage: 0 };
    }
  }

  // 更新任务
  private updateTask(task: TestTask) {
    task.updateTime = new Date().toISOString();
    this.tasks.set(task.taskId, task);
  }

  // 获取任务
  getTask(taskId: string): TestTask | undefined {
    return this.tasks.get(taskId);
  }

  // 获取所有任务
  getAllTasks(): TestTask[] {
    return Array.from(this.tasks.values());
  }

  // 删除任务
  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }
}

export const taskService = new TaskService();
