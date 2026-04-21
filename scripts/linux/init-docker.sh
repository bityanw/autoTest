#!/bin/bash

# Docker环境初始化脚本

echo "========================================"
echo "  Docker环境初始化"
echo "========================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."

# 创建Docker网络
echo -e "${GREEN}[1/3] 创建Docker网络${NC}"
if docker network ls | grep -q autotest-network; then
    echo -e "${YELLOW}[信息] Docker网络已存在${NC}"
else
    docker network create autotest-network
    echo -e "${GREEN}[信息] Docker网络创建成功${NC}"
fi

# 构建应用运行镜像
echo ""
echo -e "${GREEN}[2/3] 构建应用运行镜像${NC}"
cd "$PROJECT_ROOT/linux-platform/docker/app-runner"
docker build -t autotest/app-runner:latest .
echo -e "${GREEN}[信息] 应用运行镜像构建完成${NC}"

# 启动Playwright容器
echo ""
echo -e "${GREEN}[3/3] 启动Playwright测试容器${NC}"
cd "$PROJECT_ROOT/linux-platform/docker"

# 检测docker compose命令（支持新版docker compose插件）
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${YELLOW}[警告] 未找到docker compose命令，跳过Playwright容器启动${NC}"
    echo -e "${YELLOW}[提示] 请安装docker-compose或使用新版Docker (docker compose)${NC}"
    DOCKER_COMPOSE=""
fi

if [ -n "$DOCKER_COMPOSE" ]; then
    $DOCKER_COMPOSE up -d playwright-runner
    echo -e "${GREEN}[信息] Playwright容器启动完成${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Docker环境初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "查看容器状态: docker ps"
echo "查看网络: docker network inspect autotest-network"
echo ""
