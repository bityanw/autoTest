#!/bin/bash

# SSH推送配置文件
# 请根据实际情况修改以下配置

# 服务器信息
SSH_HOST="192.168.1.100"      # 目标服务器IP地址
SSH_PORT="22"                  # SSH端口
SSH_USER="root"                # SSH用户名

# 目标目录
SSH_TARGET_DIR="/opt/autotest"  # 服务器上的目标目录

# 推送内容
# 可以是单个文件或目录
# 示例：
# PUSH_CONTENT="../linux-platform"  # 推送整个linux-platform目录
# PUSH_CONTENT="../windows-agent/target/windows-agent-1.0.0.jar"  # 推送单个jar文件

# 默认推送整个项目目录
PUSH_CONTENT="../../"  # 相对于脚本目录的路径
