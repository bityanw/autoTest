# 部署准备检查清单

## 系统架构

```
Windows编译机 (SVN加密环境 + Windows Agent)
    ↓ 编译产物
Maven私服
    ↓ 拉取制品
ARM Linux虚拟机 (Node.js后端 + Vue前端 + Docker)
    ↓ Docker部署
自动化测试 + 报告生成
```

## 前置条件检查

### Windows编译机
- [ ] JDK 8+ 已安装
- [ ] Maven 3.6+ 已安装
- [ ] Node.js 18+ 已安装
- [ ] SVN客户端已安装并可访问加密代码
- [ ] 防火墙开放8081端口

### ARM Linux虚拟机
- [ ] Node.js 18+ 已安装
- [ ] Docker 20.10+ 已安装并运行
- [ ] Docker Compose已安装
- [ ] 可访问Windows机器的8081端口
- [ ] 可访问Maven私服

## 部署步骤

### 第一步：Windows Agent部署

```bash
# 1. 进入项目目录
cd autoTest

# 2. 安装依赖
cd windows-agent
mvn clean install

# 3. 启动Agent
..\scripts\windows\start-agent.bat
```

验证：访问 http://windows-ip:8081/api/build/health 返回OK

### 第二步：Linux平台部署

```bash
# 1. 进入项目目录
cd autoTest

# 2. 给脚本添加执行权限
chmod +x scripts/linux/*.sh
chmod +x linux-platform/backend-node/start.sh

# 3. 初始化Docker环境
./scripts/linux/init-docker.sh

# 4. 配置环境变量
cd linux-platform/backend-node
cp .env.example .env
# 编辑 .env 文件，修改以下配置：
# - WINDOWS_AGENT_URL=http://192.168.1.100:8081  (Windows机器IP)
# - MAVEN_REPO_URL=http://nexus.company.com/...   (Maven私服地址)

# 5. 启动平台
cd ../..
./scripts/linux/start-platform.sh
```

验证：
- 后端：http://linux-ip:8080/api/health 返回ok
- 前端：http://linux-ip:3000 可访问
- 健康检查：./scripts/linux/health-check.sh 全部通过

### 第三步：创建项目配置

1. 访问前端界面 http://linux-ip:3000
2. 点击"项目配置"菜单
3. 点击"新建项目"
4. 填写项目信息：
   - 项目名称：如"电商系统"
   - SVN路径：如"C:/svn/ecommerce"
   - SVN分支：如"trunk"
   - 构建类型：full或incremental
5. 点击"保存"
6. 点击"测试连接"验证SVN连接

### 第四步：运行测试任务

1. 点击"任务列表"菜单
2. 点击"创建任务"
3. 选择项目名称
4. 点击"创建"
5. 观察任务执行进度

## 验证功能

### 基础功能
- [ ] 可以正常访问前端界面
- [ ] 可以创建项目配置
- [ ] 可以创建测试任务
- [ ] 任务状态实时更新

### 构建流程
- [ ] Windows Agent接收构建请求
- [ ] SVN代码更新成功
- [ ] Maven编译成功
- [ ] 制品推送到Maven私服

### 部署流程
- [ ] 从Maven私服拉取制品
- [ ] Docker容器启动成功
- [ ] 应用健康检查通过

### 测试流程
- [ ] Playwright测试容器启动
- [ ] 测试脚本执行完成
- [ ] 测试结果解析正确
- [ ] 测试报告生成成功

## 故障排查

### Windows Agent问题

**端口被占用**：
```bash
netstat -ano | findstr 8081
taskkill /PID <进程ID> /F
```

**SVN更新失败**：
- 检查SVN客户端是否安装
- 检查是否有权限访问代码库

### Linux后端问题

**Node.js版本过低**：
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**依赖安装失败**：
```bash
cd linux-platform/backend-node
rm -rf node_modules package-lock.json
npm install
```

**环境变量未配置**：
```bash
cd linux-platform/backend-node
cp .env.example .env
# 编辑 .env 文件
```

### Docker问题

**Docker未启动**：
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**权限不足**：
```bash
sudo usermod -aG docker $USER
# 重新登录生效
```

### 网络问题

**无法连接Windows Agent**：
```bash
# 测试连通性
curl http://192.168.1.100:8081/api/build/health

# 检查防火墙
# Windows防火墙需要开放8081端口
```

## 生产部署建议

### 使用PM2管理Node.js后端

```bash
cd linux-platform/backend-node
npm install -g pm2
npm run build

# 启动
pm2 start dist/index.js --name autotest-backend

# 开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs autotest-backend
```

### 使用Nginx部署前端

```bash
cd linux-platform/frontend
npm run build

# 复制到nginx目录
sudo cp -r dist/* /var/www/html/

# nginx配置
sudo vim /etc/nginx/sites-available/autotest
```

Nginx配置示例：
```nginx
server {
    listen 80;
    server_name autotest.company.com;

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
}
```

### 启用日志轮转

```bash
# 安装logrotate
sudo apt-get install logrotate

# 配置日志轮转
sudo vim /etc/logrotate.d/autotest
```

配置内容：
```
/opt/autotest/linux-platform/backend-node/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
```

## 安全检查清单

- [ ] 修改默认端口（如有需要）
- [ ] 配置防火墙规则
- [ ] 启用HTTPS（生产环境）
- [ ] 配置访问控制（如有需要）
- [ ] 敏感信息不提交到代码库（.env文件）

## 完成部署确认

所有检查项通过后，系统即可投入使用！
