# Windows编译Agent

## 功能说明

Windows编译Agent是部署在Windows编译机上的Java服务，负责：
- 监听Linux平台的构建请求
- 执行SVN代码更新
- Maven编译Java后端
- npm构建Vue前端
- 推送制品到Maven私服

## 环境要求

- Windows 10/Server 2016+
- JDK 8+
- Maven 3.6+
- Node.js 16+
- SVN客户端

## 配置说明

编辑 `src/main/resources/application.yml`：

```yaml
server:
  port: 8081  # Agent监听端口

build:
  workspace: C:/build-workspace  # 构建工作目录
  timeout: 1800  # 构建超时时间（秒）
```

## 启动方式

### 1. 开发模式

```bash
mvn spring-boot:run
```

### 2. 生产模式

```bash
# 编译
mvn clean package

# 启动
java -jar target/windows-build-agent-1.0.0.jar
```

### 3. Windows服务方式

使用 `winsw` 将Agent注册为Windows服务，实现开机自启。

## API接口

### 触发构建

```http
POST http://localhost:8081/api/build/start
Content-Type: application/json

{
  "svnPath": "C:/svn/project",
  "svnBranch": "trunk",
  "mavenRepoUrl": "http://nexus.company.com/repository/maven-releases/",
  "projectName": "my-project",
  "buildType": "full",
  "callbackUrl": "http://linux-platform:8080/api/callback/build"
}
```

响应：
```json
{
  "buildId": "uuid",
  "status": "building",
  "message": "构建中..."
}
```

### 查询构建状态

```http
GET http://localhost:8081/api/build/status/{buildId}
```

响应：
```json
{
  "buildId": "uuid",
  "status": "success",
  "message": "构建成功",
  "backendArtifact": {
    "groupId": "com.example",
    "artifactId": "my-project",
    "version": "1.0.0-SNAPSHOT"
  },
  "frontendArtifact": {
    "artifactId": "my-project-frontend",
    "version": "1.0.0"
  },
  "buildLog": "构建日志..."
}
```

### 健康检查

```http
GET http://localhost:8081/api/build/health
```

## 构建流程

1. 接收Linux平台的构建请求
2. SVN更新代码（如果配置了svnPath）
3. 执行Maven构建：`mvn clean package -DskipTests`
4. 执行npm构建：`npm install && npm run build`
5. 推送制品到Maven私服
6. 回调通知Linux平台

## 注意事项

1. 确保SVN客户端已安装并配置好认证
2. Maven settings.xml需配置私服地址和认证信息
3. 防火墙需开放8081端口
4. 建议使用Windows服务方式运行，确保稳定性
