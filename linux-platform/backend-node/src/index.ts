import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errorHandler';

// 路由
import taskRoutes from './routes/taskRoutes';
import projectConfigRoutes from './routes/projectConfigRoutes';
import reportRoutes from './routes/reportRoutes';

// 服务
import { projectConfigService } from './services/projectConfigService';

// 加载环境变量
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/task', taskRoutes);
app.use('/api/project-config', projectConfigRoutes);
app.use('/api/report', reportRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 初始化服务
async function init() {
  try {
    await projectConfigService.init();
    logger.info('✅ 项目配置服务初始化成功');
  } catch (error) {
    logger.error('❌ 项目配置服务初始化失败:', error);
  }

  // 启动服务
  app.listen(PORT, () => {
    logger.info('🚀 服务启动成功！');
    logger.info(`📍 地址: http://localhost:${PORT}`);
    logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

init();

export default app;
