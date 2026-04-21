# 快速开始指南

## 5分钟快速部署

### 前置条件

**Windows编译机**:
- JDK 8+
- Maven 3.6+
- Node.js 18+
- SVN客户端

**ARM Linux虚拟机**:
- Node.js 18+
- Docker 20.10+

### 第一步：部署Windows Agent

```bash
# 1. 进入项目目录
cd autoTest

# 2. 运行启动脚本
scripts\windows\start-agent.bat
```

等待看到 "Windows Build Agent 启动成功！" 提示。

### 第二步：部署Linux平台

```bash
# 1. 初始化Docker环境
cd autoTest
chmod +x scripts/linux/*.sh
./scripts/linux/init-docker.sh

# 2. 启动测试平台
./scripts/linux/start-platform.sh
```

等待看到 "测试平台启动完成！" 提示。

### 第三步：配置连接

编辑 `linux-platform/backend-node/.env`:

```env
# Windows Agent配置（修改为Windows机器IP）
WINDOWS_AGENT_URL=http://192.168.1.100:8081

# Maven私服配置
MAVEN_REPO_URL=http://nexus.company.com/repository/maven-releases/

# 环境
development=production
```

重启后端服务：

```bash
./scripts/linux/stop-platform.sh
./scripts/linux/start-platform.sh
```

### 第四步：访问系统

浏览器打开: `http://linux-ip:3000`

### 第五步：创建测试任务

1. 点击"创建任务"
2. 输入项目名称
3. 点击"创建"
4. 观察任务执行进度

## 验证部署

运行健康检查脚本：

```bash
./scripts/linux/health-check.sh
```

所有检查项应该显示 ✓ 正常。

## 常见问题

### Windows Agent无法启动

**问题**: 端口8081被占用

**解决**:
```bash
# 查看占用端口的进程
netstat -ano | findstr 8081

# 结束进程
taskkill /PID <进程ID> /F
```

### Linux平台无法连接Windows Agent

**问题**: 网络不通

**解决**:
1. 检查防火墙设置
2. 测试连通性: `curl http://192.168.1.100:8081/api/build/health`
3. 确认Windows防火墙开放8081端口

### Docker容器启动失败

**问题**: Docker服务未启动

**解决**:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 前端无法访问

**问题**: npm依赖安装失败

**解决**:
```bash
cd linux-platform/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 下一步

- 查看 [用户手册](./user-guide.md) 了解详细功能
- 查看 [架构说明](./architecture.md) 了解系统设计
- 查看 [部署文档](./deployment.md) 了解高级配置

## 技术支持

遇到问题？

1. 查看日志文件
2. 运行健康检查脚本
3. 查看文档目录下的故障排查指南
