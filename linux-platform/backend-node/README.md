# AutoTest Backend - Node.js版本

## 🚀 技术栈

- **运行时**: Node.js 18+
- **框架**: Express + TypeScript
- **数据存储**: LowDB (JSON文件数据库)
- **日志**: Winston
- **HTTP客户端**: Axios
- **Docker**: Dockerode

## 📦 安装依赖

```bash
npm install
```

## ⚙️ 配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：
```env
# Windows Agent地址
WINDOWS_AGENT_URL=http://192.168.1.100:8081

# Maven私服地址
MAVEN_REPO_URL=http://nexus.company.com/repository/maven-releases/

# SVN项目路径
SVN_PROJECT_PATH=C:/svn/project
```

## 🏃 运行

### 开发模式（热重载）
```bash
npm run dev
```

### 生产模式
```bash
# 编译
npm run build

# 启动
npm start
```

## 📡 API接口

### 项目配置管理

```bash
# 获取所有项目
GET /api/project-config/list

# 获取单个项目
GET /api/project-config/:id

# 创建项目
POST /api/project-config/create
{
  "name": "电商系统",
  "description": "电商平台测试",
  "status": "active",
  "svn": {
    "path": "C:/svn/ecommerce",
    "branch": "trunk"
  },
  "build": {
    "type": "full"
  },
  "environments": {
    "test": {
      "enabled": true
    }
  }
}

# 更新项目
PUT /api/project-config/update/:id

# 删除项目
DELETE /api/project-config/delete/:id

# 测试SVN连接
POST /api/project-config/test-svn
{
  "svnPath": "C:/svn/project"
}
```

### 测试任务管理

```bash
# 创建测试任务
POST /api/task/create
{
  "projectName": "电商系统"
}

# 获取任务详情
GET /api/task/detail/:taskId

# 获取任务列表
GET /api/task/list

# 健康检查
GET /api/task/health
```

## 📁 目录结构

```
backend-node/
├── src/
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑
│   ├── models/           # 数据模型
│   ├── routes/           # 路由
│   ├── utils/            # 工具函数
│   └── index.ts          # 入口文件
├── data/                 # 数据存储
│   └── projects.json     # 项目配置
├── logs/                 # 日志文件
├── dist/                 # 编译输出
├── package.json
├── tsconfig.json
└── .env                  # 环境变量
```

## 🔄 与Java版本对比

| 特性 | Java版本 | Node.js版本 |
|------|---------|-------------|
| 启动时间 | ~30秒 | ~2秒 |
| 内存占用 | ~200MB | ~50MB |
| 开发效率 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 部署复杂度 | 需要JVM | 单个node进程 |

## 🎯 优势

- ✅ 轻量快速
- ✅ 与前端同语言
- ✅ 开发效率高
- ✅ 部署简单
- ✅ 生态丰富

## 📝 注意事项

1. 确保Node.js版本 >= 18
2. 确保Windows Agent服务已启动
3. 首次运行会自动创建 `data/projects.json`
4. 日志文件保存在 `logs/` 目录

## 🔗 相关链接

- [前端项目](../frontend)
- [Windows Agent](../../windows-agent)
- [项目文档](../../docs)
