import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
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
const PORT = process.env.PORT || 18681;

// 创建HTTP服务器
const server = createServer(app);

// 创建WebSocket服务器
const wss = new WebSocketServer({ server, path: '/ws' });

// WebSocket连接管理
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  logger.info('WebSocket客户端已连接');
  clients.add(ws);

  ws.on('close', () => {
    logger.info('WebSocket客户端已断开');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    logger.error('WebSocket错误:', error);
    clients.delete(ws);
  });

  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'connected', message: '连接成功' }));
});

// 广播消息给所有客户端
export const broadcast = (message: any) => {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

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
