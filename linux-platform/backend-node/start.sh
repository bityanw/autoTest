#!/bin/bash

echo "========================================"
echo "  启动Node.js后端服务"
echo "========================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js，请先安装Node.js 18+"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 进入目录
cd "$(dirname "$0")"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建必要目录
mkdir -p data logs

# 复制环境变量
if [ ! -f ".env" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置参数"
fi

# 启动服务
echo ""
echo "🚀 启动服务..."
npm run dev
