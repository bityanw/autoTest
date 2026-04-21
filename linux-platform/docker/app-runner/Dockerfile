FROM eclipse-temurin:8-jre

# 安装curl和wget
RUN apk add --no-cache curl wget

# 创建工作目录
WORKDIR /app

# 复制启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["/app/start.sh"]
