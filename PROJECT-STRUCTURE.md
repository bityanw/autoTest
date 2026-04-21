# 项目目录结构

```
autoTest/
├── README.md                                    # 项目总览
├── docs/                                        # 文档目录
│   ├── architecture.md                          # 架构说明
│   ├── deployment.md                            # 部署文档
│   ├── user-guide.md                            # 使用手册
│   ├── quick-start.md                           # 快速开始
│   ├── configuration.md                         # 配置说明
│   └── project-summary.md                       # 项目总结
│
├── windows-agent/                               # Windows编译Agent
│   ├── README.md                                # Agent说明文档
│   ├── pom.xml                                  # Maven配置
│   └── src/
│       └── main/
│           ├── java/com/autotest/agent/
│           │   ├── BuildAgentApplication.java   # 启动类
│           │   ├── controller/
│           │   │   └── BuildController.java     # 构建API
│           │   ├── service/
│           │   │   └── BuildService.java        # 构建服务
│           │   └── model/
│           │       ├── BuildRequest.java        # 请求模型
│           │       └── BuildResponse.java       # 响应模型
│           └── resources/
│               └── application.yml              # 配置文件
│
├── linux-platform/                              # Linux测试平台
│   ├── README.md                                # 平台说明文档
│   │
│   ├── backend-node/                            # Node.js后端
│   │   ├── package.json                         # npm配置
│   │   ├── tsconfig.json                        # TypeScript配置
│   │   ├── .env.example                         # 环境变量模板
│   │   ├── start.sh                             # 启动脚本
│   │   ├── data/                                # 数据存储
│   │   │   └── projects.json                    # 项目配置数据
│   │   ├── logs/                                # 日志目录
│   │   └── src/
│   │       ├── index.ts                         # 入口文件
│   │       ├── controllers/
│   │       │   ├── taskController.ts            # 任务控制器
│   │       │   └── projectConfigController.ts   # 项目配置控制器
│   │       ├── services/
│   │       │   ├── taskService.ts               # 任务服务
│   │       │   └── projectConfigService.ts      # 项目配置服务
│   │       ├── routes/
│   │       │   ├── taskRoutes.ts                # 任务路由
│   │       │   ├── projectConfigRoutes.ts       # 项目配置路由
│   │       │   └── reportRoutes.ts              # 报告路由
│   │       ├── models/
│   │       │   └── types.ts                     # 数据类型定义
│   │       └── utils/
│   │           ├── logger.ts                    # 日志工具
│   │           └── errorHandler.ts              # 错误处理
│   │
│   ├── frontend/                                # Vue3前端
│   │   ├── package.json                         # npm配置
│   │   ├── vite.config.js                       # Vite配置
│   │   ├── index.html                           # 入口HTML
│   │   └── src/
│   │       ├── main.js                          # 入口JS
│   │       ├── App.vue                          # 根组件
│   │       ├── router/
│   │       │   └── index.js                     # 路由配置
│   │       ├── views/
│   │       │   ├── Dashboard.vue                # 仪表盘页
│   │       │   ├── TaskList.vue                 # 任务列表页
│   │       │   ├── Reports.vue                  # 报告页
│   │       │   ├── Settings.vue                 # 设置页
│   │       │   └── ProjectConfig.vue            # 项目配置页
│   │       └── api/
│   │           └── task.js                      # API封装
│   │
│   ├── ai-test-generator/                       # AI测试生成器
│   │   ├── README.md                            # 生成器说明
│   │   ├── package.json                         # npm配置
│   │   ├── src/
│   │   │   └── generator.js                     # 生成器核心
│   │   ├── templates/                           # 测试模板
│   │   └── generated-tests/                     # 生成的测试
│   │
│   ├── docker/                                  # Docker配置
│   │   ├── docker-compose.yml                   # Compose配置
│   │   └── app-runner/
│   │       ├── Dockerfile                       # 应用镜像
│   │       └── start.sh                         # 启动脚本
│   │
│   └── reports/                                 # 测试报告目录
│       ├── templates/                           # 报告模板
│       └── utils/                               # 报告工具
│
└── scripts/                                     # 实用脚本
    ├── windows/
    │   └── start-agent.bat                      # Windows启动脚本
    └── linux/
        ├── start-platform.sh                    # 启动平台
        ├── stop-platform.sh                     # 停止平台
        ├── init-docker.sh                       # 初始化Docker
        └── health-check.sh                      # 健康检查
```

## 文件说明

### 核心代码文件

**Windows Agent (Java)**:
- `BuildAgentApplication.java` - Spring Boot启动类
- `BuildController.java` - HTTP API接口
- `BuildService.java` - 构建逻辑（SVN、Maven、npm）
- `BuildRequest/Response.java` - 数据模型

**Linux后端 (Node.js)**:
- `index.ts` - Express应用入口
- `taskController.ts` - 任务管理API
- `projectConfigController.ts` - 项目配置API
- `taskService.ts` - 任务调度和执行（调用Windows Agent、Docker部署、测试执行）
- `projectConfigService.ts` - 项目配置管理（LowDB存储）
- `taskRoutes.ts` - 任务路由
- `projectConfigRoutes.ts` - 项目配置路由
- `reportRoutes.ts` - 报告路由
- `types.ts` - TypeScript类型定义
- `logger.ts` - Winston日志工具
- `errorHandler.ts` - 统一错误处理

**Linux前端 (Vue3)**:
- `App.vue` - 根组件，布局和导航
- `Dashboard.vue` - 仪表盘页面（统计卡片、图表）
- `TaskList.vue` - 任务管理界面
- `Reports.vue` - 报告展示页面
- `Settings.vue` - 系统设置页面
- `ProjectConfig.vue` - 项目配置页面
- `task.js` - API请求封装

**AI测试生成器 (Node.js)**:
- `generator.js` - 分析代码并生成测试脚本

### 配置文件

- `package.json` - npm项目配置
- `tsconfig.json` - TypeScript编译配置
- `.env.example` - 环境变量模板
- `vite.config.js` - Vite构建配置
- `docker-compose.yml` - Docker编排配置
- `Dockerfile` - Docker镜像定义

### 文档文件

- `README.md` - 各模块说明文档
- `architecture.md` - 系统架构设计
- `deployment.md` - 详细部署步骤
- `user-guide.md` - 功能使用说明
- `quick-start.md` - 快速开始指南
- `configuration.md` - 配置参数说明
- `project-summary.md` - 项目总结

### 脚本文件

- `start-agent.bat` - Windows Agent启动脚本
- `start-platform.sh` - Linux平台启动脚本
- `stop-platform.sh` - Linux平台停止脚本
- `init-docker.sh` - Docker环境初始化
- `health-check.sh` - 系统健康检查

## 统计信息

- 总文件数: 50+
- TypeScript源文件: 10个
- Vue组件: 6个
- JavaScript: 4个
- 配置文件: 10个
- 文档: 9个
- 脚本: 6个

## 代码行数估算

- TypeScript代码: ~800行
- Vue/JavaScript: ~1200行
- 配置文件: ~600行
- 文档: ~2500行
- 脚本: ~300行

**总计: 约5400+行**
