#!/bin/bash

# 部署脚本
# 用于执行SSH推送到服务器

set -e

SCRIPT_DIR="$(dirname "$0")/scripts/deploy"

# 检查脚本是否存在
if [ ! -f "$SCRIPT_DIR/ssh-push.sh" ]; then
    echo "错误: SSH推送脚本不存在"
    exit 1
fi

# 赋予执行权限
chmod +x "$SCRIPT_DIR/ssh-push.sh"
chmod +x "$SCRIPT_DIR/ssh-push-config.sh"

# 执行SSH推送
echo "正在执行SSH推送..."
echo "========================================"

"$SCRIPT_DIR/ssh-push.sh"

echo "部署完成!"
