# 部署文档

## 环境要求

### Windows编译机

- 操作系统: Windows 10/Server 2016+
- JDK: 1.8+
- Maven: 3.6+
- Node.js: 16+
- SVN客户端
- 内存: 4GB+
- 磁盘: 50GB+

### ARM Linux虚拟机

- 操作系统: Ubuntu 20.04+ / CentOS 8+ (ARM64)
- JDK: 1.8+
- Node.js: 16+
- Docker: 20.10+
- Docker Compose: 2.0+
- 内存: 8GB+
- 磁盘: 100GB+

## 部署步骤

### 一、Windows编译Agent部署

#### 1. 安装依赖

```bash
# 确认JDK版本
java -version

# 确认Maven版本
mvn -version

# 确认Node.js版本
node -version

# 确认SVN客户端
svn --version
```

#### 2. 配置Maven私服

编辑 `~/.m2/settings.xml`:

```xml
<settings>
    <servers>
        <server>
            <id>nexus</id>
            <username>your-username</username>
            <password>your-password</password>
        </server>
    </servers>

    <mirrors>
        <mirror>
            <id>nexus</id>
            <mirrorOf>*</mirrorOf>
            <url>http://nexus.company.com/repository/maven-public/</url>
        </mirror>
    </mirrors>
</settings>
```

#### 3. 编译Agent

```bash
cd windows-agent
mvn clean package
```

#### 4. 配置Agent

编辑 `src/main/resources/application.yml`:

```yaml
server:
  port: 8081

build:
  workspace: C:/build-workspace
  timeout: 1800
```

#### 5. 启动Agent

**开发模式**:
```bash
mvn spring-boot:run
```

**生产模式**:
```bash
java -jar target/windows-build-agent-1.0.0.jar
```

**Windows服务方式**（推荐）:

1. 下载 [WinSW](https://github.com/winsw/winsw/releases)
2. 创建 `build-agent.xml`:

```xml
<service>
    <id>build-agent</id>
    <name>Build Agent Service</name>
    <description>Windows编译Agent服务</description>
    <executable>java</executable>
    <arguments>-jar windows-build-agent-1.0.0.jar</arguments>
    <logpath>logs</logpath>
    <log mode="roll-by-size">
        <sizeThreshold>10240</sizeThreshold>
        <keepFiles>8</keepFiles>
    </log>
</service>
```

3. 安装服务:
```bash
winsw install build-agent.xml
winsw start build-agent
```

#### 6. 验证

```bash
curl http://localhost:8081/api/build/health
```

### 二、ARM Linux平台部署

#### 1. 安装Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证
docker --version
docker-compose --version
```

#### 2. 构建Docker镜像

```bash
cd linux-platform/docker
docker-compose build
```

#### 3. 创建Docker网络

```bash
docker network create autotest-network
```

#### 4. 部署后端

```bash
cd linux-platform/backend

# 编译
mvn clean package

# 配置
vim src/main/resources/application.yml
# 修改以下配置:
# - windows.agent.url: Windows Agent地址
# - maven.repo.url: Maven私服地址
# - svn.project.path: SVN项目路径

# 启动
java -jar target/test-platform-1.0.0.jar
```

**使用systemd管理**（推荐）:

创建 `/etc/systemd/system/test-platform.service`:

```ini
[Unit]
Description=Test Platform Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/test-platform/backend
ExecStart=/usr/bin/java -jar test-platform-1.0.0.jar
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

#### 5. 部署前端

```bash
cd linux-platform/frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 使用nginx部署
sudo apt install nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

Nginx配置示例 `/etc/nginx/sites-available/test-platform`:

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
}
```

#### 6. 部署AI测试生成器

```bash
cd linux-platform/ai-test-generator

# 安装依赖
npm install

# 配置API Key
export ANTHROPIC_API_KEY=your-api-key

# 测试运行
node src/generator.js /path/to/vue/project ./generated-tests
```

#### 7. 启动Playwright容器

```bash
cd linux-platform/docker
docker-compose up -d playwright-runner
```

### 三、配置验证

#### 1. 检查Windows Agent

```bash
curl http://192.168.1.100:8081/api/build/health
```

#### 2. 检查Linux后端

```bash
curl http://localhost:8080/api/task/health
```

#### 3. 访问Web界面

浏览器打开: `http://linux-ip:80`

#### 4. 创建测试任务

在Web界面点击"创建任务"，输入项目名称，观察任务执行流程。

## 配置说明

### Windows Agent配置

`windows-agent/src/main/resources/application.yml`:

```yaml
server:
  port: 8081                          # Agent监听端口

build:
  workspace: C:/build-workspace       # 构建工作目录
  timeout: 1800                       # 构建超时（秒）
```

### Linux平台配置

`linux-platform/backend/src/main/resources/application.yml`:

```yaml
windows:
  agent:
    url: http://192.168.1.100:8081    # Windows Agent地址

maven:
  repo:
    url: http://nexus.company.com/repository/maven-releases/

svn:
  project:
    path: C:/svn/project              # SVN项目路径

docker:
  network: autotest-network           # Docker网络名称

app:
  port: 8888                          # 测试应用端口
  url: http://localhost:8888

playwright:
  workspace: /opt/playwright-tests    # 测试脚本目录
```

## 故障排查

### Windows Agent无法启动

1. 检查端口占用: `netstat -ano | findstr 8081`
2. 检查Java版本: `java -version`
3. 查看日志: `logs/agent.log`

### Linux平台无法连接Windows Agent

1. 检查网络连通性: `ping 192.168.1.100`
2. 检查防火墙: Windows防火墙是否开放8081端口
3. 测试连接: `curl http://192.168.1.100:8081/api/build/health`

### Docker容器启动失败

1. 检查Docker服务: `sudo systemctl status docker`
2. 检查镜像: `docker images`
3. 查看日志: `docker logs <container-name>`

### 测试执行失败

1. 检查应用是否启动: `curl http://localhost:8888`
2. 检查Playwright容器: `docker ps | grep playwright`
3. 查看测试日志: 在Web界面查看任务详情

## 维护建议

1. **定期备份**: 备份测试报告和配置文件
2. **日志清理**: 定期清理旧日志文件
3. **监控告警**: 配置服务监控和告警
4. **版本更新**: 定期更新依赖和框架版本

## 安全建议

1. 修改默认端口
2. 配置访问控制（IP白名单）
3. 启用HTTPS
4. 定期更新密码
5. 审计操作日志
