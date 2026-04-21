#!/bin/bash

# Linux测试平台停止脚本

echo "========================================"
echo "  停止测试平台"
echo "========================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# 停止后端
if [ -f /tmp/test-platform-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/test-platform-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[信息] 停止后端服务 (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID
        rm /tmp/test-platform-backend.pid
    else
        echo -e "${RED}[警告] 后端服务未运行${NC}"
        rm /tmp/test-platform-backend.pid
    fi
else
    echo -e "${RED}[警告] 未找到后端PID文件${NC}"
fi

# 停止前端
if [ -f /tmp/test-platform-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/test-platform-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[信息] 停止前端服务 (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID
        rm /tmp/test-platform-frontend.pid
    else
        echo -e "${RED}[警告] 前端服务未运行${NC}"
        rm /tmp/test-platform-frontend.pid
    fi
else
    echo -e "${RED}[警告] 未找到前端PID文件${NC}"
fi

echo ""
echo -e "${GREEN}[信息] 测试平台已停止${NC}"
echo ""
