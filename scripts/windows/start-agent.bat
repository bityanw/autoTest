@echo off
REM Windows编译Agent启动脚本

echo ========================================
echo   Windows Build Agent 启动脚本
echo ========================================
echo.

REM 检查Java环境
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Java环境，请先安装JDK 8+
    pause
    exit /b 1
)

REM 检查Maven
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到Maven，构建功能可能无法使用
)

REM 检查Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到Node.js，前端构建功能可能无法使用
)

REM 检查SVN
svn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未检测到SVN客户端，代码更新功能可能无法使用
)

echo.
echo [信息] 环境检查完成
echo.

REM 切换到Agent目录
cd /d %~dp0..\windows-agent

REM 检查jar文件
if not exist "target\windows-build-agent-1.0.0.jar" (
    echo [信息] 未找到jar文件，开始编译...
    call mvn clean package -DskipTests
    if %errorlevel% neq 0 (
        echo [错误] 编译失败
        pause
        exit /b 1
    )
)

echo.
echo [信息] 启动Windows Build Agent...
echo [信息] 监听端口: 8081
echo [信息] 按 Ctrl+C 停止服务
echo.

REM 启动服务
java -jar target\windows-build-agent-1.0.0.jar

pause
