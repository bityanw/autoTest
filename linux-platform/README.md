# Linux平台部署说明

## 目录结构

```
linux-platform/
├── backend-node/          # Node.js后端
├── frontend/              # Vue3前端
├── ai-test-generator/     # AI测试脚本生成器
├── docker/                # Docker配置
└── reports/               # 测试报告输出
```

## 快速启动

### 方式一：使用脚本（推荐）

```bash
# 初始化Docker环境
./scripts/linux/init-docker.sh

# 启动平台
./scripts/linux/start-platform.sh

# 停止平台
./scripts/linux/stop-platform.sh

# 健康检查
./scripts/linux/health-check.sh
```

### 方式二：手动启动

**后端（Node.js）**:
```bash
cd backend-node
npm install
cp .env.example .env
# 编辑 .env 配置文件
npm run dev  # 开发模式
# 或
npm run build && npm start  # 生产模式
```

**前端**:
```bash
cd frontend
npm install
npm run dev
```

## 配置说明

### Node.js后端配置

编辑 `backend-node/.env`:

```env
# 服务端口
PORT=8080

# Windows Agent地址
WINDOWS_AGENT_URL=http://192.168.1.100:8081

# Maven私服地址
MAVEN_REPO_URL=http://nexus.company.com/repository/maven-releases/

# 环境
NODE_ENV=production
```

详细配置请查看 [配置文档](../docs/configuration.md)

## 访问地址

- 后端API: http://localhost:8080
- 前端界面: http://localhost:3000
- 测试报告: http://localhost:8080/reports/

## 生产部署

### 使用systemd管理Node.js后端

创建 `/etc/systemd/system/test-platform.service`:

```ini
[Unit]
Description=Test Platform Service (Node.js)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/test-platform/backend-node
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl start test-platform
sudo systemctl enable test-platform
```

### 使用PM2管理Node.js后端（推荐）

```bash
cd backend-node
npm install -g pm2
npm run build

# 启动
pm2 start dist/index.js --name test-platform

# 开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs test-platform

# 重启
pm2 restart test-platform
```

### 使用nginx部署前端

```bash
cd frontend
npm run build

sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

Nginx配置:
```nginx
server {
    listen 80;
    server_name test-platform.company.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /reports {
        alias /opt/reports;
        autoindex on;
    }
}
```

## 故障排查

查看日志:
```bash
# Node.js后端日志
tail -f backend-node/logs/combined.log
tail -f backend-node/logs/error.log

# PM2日志
pm2 logs test-platform

# 前端日志
tail -f frontend/logs/frontend.log

# Docker日志
docker logs playwright-runner
```

## 更多信息

- [快速开始](../docs/quick-start.md)
- [架构说明](../docs/architecture.md)
- [用户手册](../docs/user-guide.md)
