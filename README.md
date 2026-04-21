# 自动化测试系统

## 系统架构

本系统采用双机协作架构，实现从代码编译到自动化测试的完整流程。

### 架构组成

```
Windows编译机 (SVN加密环境)
    ↓
Maven私服 (制品仓库)
    ↓
ARM Linux虚拟机 (测试环境)
```

## 目录结构

```
autoTest/
├── windows-agent/          # Windows编译Agent服务
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── linux-platform/         # Linux管理平台
│   ├── backend/           # Spring Boot后端
│   ├── frontend/          # Vue3前端
│   ├── ai-test-generator/ # AI测试脚本生成
│   ├── docker/            # Docker配置
│   └── reports/           # 测试报告
├── docs/                  # 文档
│   ├── deployment.md      # 部署文档
│   ├── architecture.md    # 架构说明
│   └── user-guide.md      # 使用手册
└── README.md
```

## 核心功能

### 1. Windows编译Agent
- 监听Linux平台的构建请求
- 执行SVN代码更新
- Maven编译Java后端
- npm构建Vue前端
- 推送制品到Maven私服

### 2. Linux管理平台
- Web界面管理测试任务
- 项目配置管理（多项目支持）
- 调用Windows Agent触发编译
- 从Maven私服拉取制品
- Docker部署应用
- 执行Playwright自动化测试
- 生成可视化测试报告
- 实时任务状态跟踪

### 3. AI测试生成
- 扫描Vue组件结构
- 分析Java API接口
- 自动生成Playwright测试脚本
- 支持业务流程测试

### 4. 测试报告系统
- HTML可视化报告（带截图/视频）
- 代码覆盖率统计
- 性能指标分析
- 邮件通知推送

## 技术栈

### Windows编译机
- Java 8+
- Maven 3.6+
- Node.js 16+
- SVN客户端

### Linux平台
- ARM Linux
- Docker & Docker Compose
- Node.js 18+

### 开发框架
- 后端：Node.js + Express + TypeScript
- 前端：Vue 3 + Element Plus + ECharts
- 测试：Playwright
- 容器：Docker
- 数据存储：LowDB (JSON文件数据库)

## 快速开始

### 5分钟快速部署

**Windows编译机**:
```bash
cd autoTest
scripts\windows\start-agent.bat
```

**ARM Linux虚拟机**:
```bash
cd autoTest
./scripts/linux/init-docker.sh
./scripts/linux/start-platform.sh
```

**访问系统**: `http://linux-ip:3000`

详细步骤请查看：
- [快速开始指南](./docs/quick-start.md) ⭐ 推荐新手阅读
- [完整部署文档](./docs/deployment.md)
- [Windows Agent部署](./windows-agent/README.md)
- [Linux平台部署](./linux-platform/README.md)

## 工作流程

1. 用户在Web界面点击"开始测试"
2. Linux平台调用Windows Agent API
3. Windows Agent执行编译并推送到私服
4. Linux平台从私服拉取制品
5. Docker部署应用到测试环境
6. Playwright执行自动化测试
7. 生成测试报告并通知

## 实用脚本

### Windows脚本
- `scripts/windows/start-agent.bat` - 启动Windows Agent

### Linux脚本
- `scripts/linux/start-platform.sh` - 启动测试平台
- `scripts/linux/stop-platform.sh` - 停止测试平台
- `scripts/linux/init-docker.sh` - 初始化Docker环境
- `scripts/linux/health-check.sh` - 系统健康检查

## 文档目录

- [快速开始](./docs/quick-start.md) - 5分钟快速部署
- [架构说明](./docs/architecture.md) - 系统架构和设计
- [部署文档](./docs/deployment.md) - 详细部署步骤
- [使用手册](./docs/user-guide.md) - 功能使用说明

## 核心特性

✅ **双机协作架构** - Windows编译 + Linux测试，适配加密环境
✅ **多项目管理** - 支持多个项目配置和独立测试
✅ **AI自动生成测试** - 分析Vue组件和API，自动生成Playwright测试
✅ **Docker容器化** - 隔离测试环境，保证一致性
✅ **可视化报告** - HTML报告、覆盖率统计、性能指标
✅ **轻量级后端** - Node.js + TypeScript，启动快、内存占用低
✅ **Web管理界面** - Vue3 + Element Plus + ECharts，操作简单

## 系统截图

### 任务管理界面
- 创建测试任务
- 实时查看任务状态
- 查看构建和测试日志

### 测试报告
- 测试结果汇总
- 通过率和覆盖率
- 失败截图和视频

## 版本信息

- 版本：1.0.0
- 更新日期：2026-03-25
- 作者：AutoTest Team

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request！

## 联系方式

- 邮箱：support@company.com
- 文档：查看docs目录
