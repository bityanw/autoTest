# 配置示例

## Windows Agent配置

文件位置: `windows-agent/src/main/resources/application.yml`

```yaml
server:
  port: 8081                          # Agent监听端口

spring:
  application:
    name: windows-build-agent

# 构建配置
build:
  workspace: C:/build-workspace       # 构建工作目录
  timeout: 1800                       # 构建超时时间（秒）

# 日志配置
logging:
  level:
    com.autotest.agent: INFO
  file:
    name: logs/agent.log
```

## Linux平台配置

文件位置: `linux-platform/backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080

spring:
  application:
    name: test-platform

# Windows Agent配置
windows:
  agent:
    url: http://192.168.1.100:8081    # Windows Agent地址

# Maven私服配置
maven:
  repo:
    url: http://nexus.company.com/repository/maven-releases/

# SVN配置
svn:
  project:
    path: C:/svn/project              # Windows机器上的SVN路径

# Docker配置
docker:
  network: autotest-network           # Docker网络名称

# 应用配置
app:
  port: 8888                          # 测试应用端口
  url: http://localhost:8888
  base:
    url: http://test-platform.company.com  # 平台访问地址（用于邮件链接）

# Playwright配置
playwright:
  workspace: /opt/playwright-tests    # 测试脚本目录

# 报告配置
report:
  output:
    dir: /opt/reports                 # 报告输出目录

# 邮件通知配置（可选）
notification:
  email:
    enabled: true                     # 是否启用邮件通知
    from: test-platform@company.com   # 发件人
    to: team@company.com,manager@company.com  # 收件人（逗号分隔）

spring:
  mail:
    host: smtp.company.com            # SMTP服务器
    port: 587                         # SMTP端口
    username: test-platform@company.com
    password: your-password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

# 日志配置
logging:
  level:
    com.autotest.platform: INFO
  file:
    name: logs/platform.log
```

## AI测试生成器配置

环境变量:

```bash
# Claude API Key（用于AI生成测试脚本）
export ANTHROPIC_API_KEY=your-api-key
```

## Docker Compose配置

文件位置: `linux-platform/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  # Playwright测试容器
  playwright-runner:
    image: mcr.microsoft.com/playwright:v1.40.0-focal
    container_name: playwright-runner
    networks:
      - autotest-network
    volumes:
      - ../ai-test-generator/generated-tests:/tests
      - ../reports:/reports
    working_dir: /tests
    command: tail -f /dev/null
    environment:
      - BASE_URL=http://app:8080

networks:
  autotest-network:
    driver: bridge
```

## Maven私服配置

文件位置: `~/.m2/settings.xml` (Windows编译机)

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

    <profiles>
        <profile>
            <id>nexus</id>
            <repositories>
                <repository>
                    <id>central</id>
                    <url>http://nexus.company.com/repository/maven-public/</url>
                    <releases><enabled>true</enabled></releases>
                    <snapshots><enabled>true</enabled></snapshots>
                </repository>
            </repositories>
        </profile>
    </profiles>

    <activeProfiles>
        <activeProfile>nexus</activeProfile>
    </activeProfiles>
</settings>
```

## 配置检查清单

部署前请确认以下配置：

### Windows Agent
- [ ] 端口8081未被占用
- [ ] SVN客户端已安装并配置认证
- [ ] Maven settings.xml配置正确
- [ ] Node.js已安装
- [ ] 构建工作目录有足够空间

### Linux平台
- [ ] Windows Agent地址配置正确
- [ ] Maven私服地址配置正确
- [ ] SVN项目路径配置正确
- [ ] Docker网络已创建
- [ ] 报告目录有写入权限
- [ ] 邮件配置正确（如果启用）

### 网络
- [ ] Windows机器防火墙开放8081端口
- [ ] Linux可以访问Windows Agent
- [ ] Linux可以访问Maven私服
- [ ] 测试应用端口8888未被占用

## 环境变量

可以通过环境变量覆盖配置：

```bash
# Windows Agent
export SERVER_PORT=8081
export BUILD_WORKSPACE=C:/build-workspace

# Linux平台
export WINDOWS_AGENT_URL=http://192.168.1.100:8081
export MAVEN_REPO_URL=http://nexus.company.com/repository/maven-releases/
export ANTHROPIC_API_KEY=your-api-key
```

## 配置优先级

1. 环境变量（最高优先级）
2. application.yml
3. 默认值（最低优先级）
