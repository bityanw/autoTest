#!/bin/bash

# 健康检查脚本

echo "========================================"
echo "  系统健康检查"
echo "========================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查Windows Agent
echo -e "${YELLOW}[检查] Windows Agent${NC}"
WINDOWS_AGENT_URL=${WINDOWS_AGENT_URL:-"http://192.168.1.100:8081"}
if curl -s "$WINDOWS_AGENT_URL/api/build/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Windows Agent 正常 ($WINDOWS_AGENT_URL)${NC}"
else
    echo -e "${RED}✗ Windows Agent 无法访问 ($WINDOWS_AGENT_URL)${NC}"
fi

# 检查Linux后端
echo -e "${YELLOW}[检查] Linux后端${NC}"
if curl -s http://localhost:8080/api/task/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Linux后端 正常 (http://localhost:8080)${NC}"
else
    echo -e "${RED}✗ Linux后端 无法访问${NC}"
fi

# 检查前端
echo -e "${YELLOW}[检查] 前端服务${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务 正常 (http://localhost:3000)${NC}"
else
    echo -e "${RED}✗ 前端服务 无法访问${NC}"
fi

# 检查Docker
echo -e "${YELLOW}[检查] Docker服务${NC}"
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker 正常${NC}"

    # 检查Playwright容器
    if docker ps | grep -q playwright-runner; then
        echo -e "${GREEN}✓ Playwright容器 运行中${NC}"
    else
        echo -e "${RED}✗ Playwright容器 未运行${NC}"
    fi
else
    echo -e "${RED}✗ Docker 无法访问${NC}"
fi

# 检查磁盘空间
echo -e "${YELLOW}[检查] 磁盘空间${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ 磁盘空间充足 (已使用 ${DISK_USAGE}%)${NC}"
else
    echo -e "${YELLOW}⚠ 磁盘空间不足 (已使用 ${DISK_USAGE}%)${NC}"
fi

# 检查内存
echo -e "${YELLOW}[检查] 内存使用${NC}"
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ 内存充足 (已使用 ${MEM_USAGE}%)${NC}"
else
    echo -e "${YELLOW}⚠ 内存使用较高 (已使用 ${MEM_USAGE}%)${NC}"
fi

echo ""
echo "========================================"
echo ""
