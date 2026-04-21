# 系统架构说明

## 整体架构

本系统采用双机协作架构，实现从代码编译到自动化测试的完整流程。

```
┌─────────────────────────────────────────┐
│  Windows编译机（SVN加密环境）            │
│  ├── SVN工作目录                         │
│  ├── Maven + Node.js                    │
│  ├── Windows Build Agent (8081)         │
│  └── 编译产物 → Maven私服                │
└─────────────────────────────────────────┘
              ↓
         Maven私服
              ↓
┌─────────────────────────────────────────┐
│  ARM Linux虚拟机（测试环境）              │
│  ├── Web管理平台 (8080)                  │
│  │   ├── Node.js后端                    │
│  │   └── Vue3前端 (3000)                │
│  ├── Docker环境                          │
│  │   ├── 应用容器                        │
│  │   └── Playwright测试容器              │
│  ├── AI测试脚本生成器                     │
│  └── 测试报告系统                         │
└─────────────────────────────────────────┘
```

## 核心组件

### 1. Windows编译Agent

**部署位置**: Windows编译机
**端口**: 8081
**功能**:
- 监听Linux平台的构建请求
- 执行SVN代码更新
- Maven编译Java后端
- npm构建Vue前端
- 推送制品到Maven私服

**技术栈**:
- Spring Boot 2.7
- Apache Commons Exec
- OkHttp

### 2. Linux管理平台后端

**部署位置**: ARM Linux虚拟机
**端口**: 8080
**功能**:
- 任务管理和调度
- 调用Windows Agent触发编译
- Docker容器管理
- Playwright测试执行
- 测试报告生成

**技术栈**:
- Node.js 18+ + Express
- TypeScript
- Dockerode (Docker API)
- LowDB (数据存储)

### 3. Linux管理平台前端

**部署位置**: ARM Linux虚拟机
**端口**: 3000（开发）/ 80（生产）
**功能**:
- 测试任务管理界面
- 实时日志查看
- 测试报告展示

**技术栈**:
- Vue 3
- Element Plus
- Vite

### 4. AI测试脚本生成器

**部署位置**: ARM Linux虚拟机
**功能**:
- 分析Vue组件结构
- 分析Java API接口
- 使用Claude AI生成Playwright测试脚本

**技术栈**:
- Node.js
- Anthropic SDK
- Cheerio

### 5. Docker环境

**部署位置**: ARM Linux虚拟机
**组件**:
- 应用运行容器（动态创建）
- Playwright测试容器
- Docker网络（autotest-network）

## 工作流程

### 完整测试流程

1. **用户触发**
   - 用户在Web界面点击"创建任务"
   - 输入项目名称

2. **构建阶段**
   - Linux平台调用Windows Agent API
   - Windows Agent执行SVN更新
   - Maven编译Java后端
   - npm构建Vue前端
   - 推送jar到Maven私服

3. **部署阶段**
   - Linux平台从Maven私服拉取jar
   - Docker启动应用容器
   - 等待应用就绪

4. **测试阶段**
   - AI生成测试脚本（首次）
   - Playwright执行测试
   - 收集测试结果

5. **报告阶段**
   - 生成HTML可视化报告
   - 统计覆盖率和性能指标
   - 发送邮件通知

## 数据流

```
用户操作 → Web前端 → 后端API → Windows Agent
                              ↓
                         Maven私服
                              ↓
                         Docker部署
                              ↓
                      Playwright测试
                              ↓
                          测试报告
```

## 网络通信

### 端口列表

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| Windows Agent | 8081 | HTTP | 构建API |
| Linux后端 | 8080 | HTTP | 管理API |
| Linux前端 | 3000 | HTTP | 开发服务器 |
| 应用容器 | 8888 | HTTP | 测试应用 |
| Maven私服 | 8081 | HTTP | 制品仓库 |

### 防火墙配置

**Windows编译机**:
- 开放8081端口（入站）

**ARM Linux虚拟机**:
- 开放8080端口（Web管理平台）
- 开放3000端口（前端开发）
- 开放8888端口（测试应用）

## 存储结构

### Windows编译机

```
C:/
├── svn/                    # SVN工作目录
│   └── project/
├── build-workspace/        # 构建工作目录
└── windows-agent/          # Agent程序
```

### ARM Linux虚拟机

```
/opt/
├── test-platform/          # 管理平台
│   ├── backend/
│   └── frontend/
├── playwright-tests/       # 测试脚本
│   └── project-name/
└── reports/                # 测试报告
    └── task-id/
```

## 扩展性

### 支持多项目

系统支持管理多个项目的测试任务，每个项目独立配置：
- SVN路径
- Maven坐标
- 测试脚本

### 支持多环境

可配置多个测试环境：
- 开发环境
- 测试环境
- 预生产环境

### 支持并发

- Windows Agent支持并发构建（线程池）
- Docker支持多容器并行测试
- Playwright支持并行测试执行

## 安全考虑

1. **代码安全**: SVN代码加密，仅在Windows编译机解密
2. **网络隔离**: 内网环境，不暴露公网
3. **权限控制**: Web界面可集成企业认证系统
4. **日志审计**: 完整的操作日志记录

## 监控和维护

### 健康检查

- Windows Agent: `GET /api/build/health`
- Linux后端: `GET /api/task/health`

### 日志位置

- Windows Agent: `logs/agent.log`
- Linux后端: `logs/platform.log`
- Docker容器: `docker logs <container-name>`

### 常见问题

详见 [故障排查文档](./troubleshooting.md)
