#!/bin/sh

echo "=== 应用启动脚本 ==="
echo "Maven仓库: $MAVEN_REPO_URL"
echo "GroupId: $ARTIFACT_GROUP"
echo "ArtifactId: $ARTIFACT_ID"
echo "Version: $ARTIFACT_VERSION"

# 构建下载URL
ARTIFACT_PATH="${ARTIFACT_GROUP//./\/}/${ARTIFACT_ID}/${ARTIFACT_VERSION}/${ARTIFACT_ID}-${ARTIFACT_VERSION}.jar"
DOWNLOAD_URL="${MAVEN_REPO_URL}/${ARTIFACT_PATH}"

echo "下载地址: $DOWNLOAD_URL"

# 下载jar包
echo "正在下载应用..."
wget -O /app/application.jar "$DOWNLOAD_URL"

if [ $? -ne 0 ]; then
    echo "下载失败！"
    exit 1
fi

echo "下载完成，启动应用..."

# 启动应用
java -jar /app/application.jar
