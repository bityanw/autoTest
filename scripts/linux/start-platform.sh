#!/bin/bash

# Linux测试平台启动脚本

echo "========================================"
echo "  Linux Test Platform 启动脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo -e "${RED}[错误] 未检测到Java环境，请先安装JDK 8+${NC}"
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] 未检测到Docker，请先安装Docker${NC}"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[警告] 未检测到Node.js，前端功能可能无法使用${NC}"
fi

echo -e "${GREEN}[信息] 环境检查完成${NC}"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# 启动后端 (Node.js版本)
echo -e "${GREEN}[信息] 启动后端服务...${NC}"
cd "$PROJECT_ROOT/linux-platform/backend-node"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到Node.js，请先安装Node.js 18+${NC}"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[信息] 安装后端依赖...${NC}"
    npm install
fi

# 创建必要目录
mkdir -p data logs

# 复制环境变量
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[信息] 创建环境变量文件...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}[警告] 请编辑 .env 文件配置Windows Agent地址${NC}"
fi

# 后台启动后端
nohup npm run dev > logs/platform.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}[信息] 后端服务已启动 (PID: $BACKEND_PID)${NC}"
echo $BACKEND_PID > /tmp/test-platform-backend.pid

# 等待后端启动
echo -e "${YELLOW}[信息] 等待后端服务就绪...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}[信息] 后端服务已就绪${NC}"
        break
    fi
    sleep 1
done

# 启动前端
echo ""
echo -e "${GREEN}[信息] 启动前端服务...${NC}"
cd "$PROJECT_ROOT/linux-platform/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[信息] 安装前端依赖...${NC}"
    npm install
fi

# 后台启动前端
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}[信息] 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
echo $FRONTEND_PID > /tmp/test-platform-frontend.pid

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  测试平台启动完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "后端地址: ${YELLOW}http://localhost:8080${NC}"
echo -e "前端地址: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "查看后端日志: tail -f $PROJECT_ROOT/linux-platform/backend/logs/platform.log"
echo -e "查看前端日志: tail -f $PROJECT_ROOT/linux-platform/frontend/logs/frontend.log"
echo ""
echo -e "停止服务: $SCRIPT_DIR/stop-platform.sh"
echo ""
