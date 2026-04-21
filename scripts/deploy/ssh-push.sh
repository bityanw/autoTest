#!/bin/bash

# SSH推送程序
# 用于将项目程序推送到服务器部署

set -e

# 配置文件路径
CONFIG_FILE="$(dirname "$0")/ssh-push-config.sh"

# 加载配置
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "错误: 配置文件 $CONFIG_FILE 不存在"
    exit 1
fi

# 显示配置信息
echo "========================================"
echo "SSH推送程序"
echo "========================================"
echo "目标服务器: $SSH_HOST"
echo "用户名: $SSH_USER"
echo "端口: $SSH_PORT"
echo "目标目录: $SSH_TARGET_DIR"
echo "推送内容: $PUSH_CONTENT"
echo "========================================"

# 检查推送内容是否存在
if [ ! -d "$PUSH_CONTENT" ] && [ ! -f "$PUSH_CONTENT" ]; then
    echo "错误: 推送内容 $PUSH_CONTENT 不存在"
    exit 1
fi

# 执行SSH推送
echo "开始推送..."

# 使用rsync进行推送
rsync -avz -e "ssh -p $SSH_PORT" --delete "$PUSH_CONTENT" "$SSH_USER@$SSH_HOST:$SSH_TARGET_DIR"

echo "========================================"
echo "推送完成!"
echo "========================================"
