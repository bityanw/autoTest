# 使用手册

## 快速开始

### 1. 访问系统

浏览器打开: `http://your-linux-ip`

### 2. 创建测试任务

1. 点击左侧菜单"测试任务"
2. 点击右上角"创建任务"按钮
3. 输入项目名称（如: my-project）
4. 点击"创建"

### 3. 查看任务进度

任务创建后会自动执行，状态变化：
- **等待中**: 任务已创建
- **构建中**: Windows正在编译代码
- **部署中**: Docker正在部署应用
- **测试中**: Playwright正在执行测试
- **成功**: 测试完成
- **失败**: 某个环节失败

### 4. 查看测试报告

任务完成后，点击"报告"按钮查看详细的测试报告。

## 功能详解

### 测试任务管理

#### 任务列表

显示所有测试任务，包括：
- 任务ID
- 项目名称
- 状态
- 创建时间
- 测试结果（总数/通过/失败）
- 覆盖率

#### 任务详情

点击"详情"按钮查看：
- 任务基本信息
- 构建日志
- 测试日志

#### 自动刷新

任务列表每10秒自动刷新，实时显示最新状态。

### 测试报告

测试报告包含：
- **测试结果汇总**: 通过率、失败率
- **测试用例详情**: 每个用例的执行结果
- **失败截图**: 失败用例的页面截图
- **执行视频**: 测试执行过程录像
- **覆盖率报告**: 代码覆盖率统计
- **性能指标**: 页面加载时间、API响应时间

## 高级功能

### AI测试脚本生成

系统会自动分析Vue组件和API接口，生成Playwright测试脚本。

#### 手动生成测试脚本

```bash
cd linux-platform/ai-test-generator

# 生成测试脚本
node src/generator.js /path/to/vue/project ./generated-tests/project-name

# 查看生成的脚本
ls generated-tests/project-name/
```

#### 自定义测试脚本

生成的测试脚本可以手动修改：

```bash
cd linux-platform/ai-test-generator/generated-tests/project-name
vim Login.spec.js
```

修改后，下次测试会使用新的脚本。

### 配置项目

每个项目可以独立配置：

#### 1. SVN路径

在Windows编译机上配置SVN工作目录：

```yaml
# windows-agent/src/main/resources/application.yml
build:
  workspace: C:/build-workspace
```

#### 2. Maven坐标

确保项目的pom.xml配置正确：

```xml
<groupId>com.example</groupId>
<artifactId>my-project</artifactId>
<version>1.0.0-SNAPSHOT</version>
```

#### 3. 测试环境

配置测试应用的访问地址：

```yaml
# linux-platform/backend/src/main/resources/application.yml
app:
  url: http://localhost:8888
```

### 定时任务

可以配置定时执行测试任务（需要修改代码）：

```java
@Scheduled(cron = "0 0 2 * * ?")  // 每天凌晨2点
public void scheduledTest() {
    testTaskService.createTask("my-project");
}
```

## 常见问题

### Q: 任务一直处于"构建中"状态？

A: 可能原因：
1. Windows Agent未启动
2. 网络不通
3. SVN更新失败
4. Maven编译失败

解决方法：
1. 检查Windows Agent状态
2. 查看任务详情中的构建日志
3. 手动在Windows机器上执行构建命令测试

### Q: 测试失败怎么办？

A:
1. 查看任务详情中的测试日志
2. 查看测试报告中的失败截图
3. 检查应用是否正常启动
4. 检查测试脚本是否正确

### Q: 如何添加新的测试用例？

A:
1. 手动编写测试脚本放到 `generated-tests/project-name/`
2. 或者修改Vue组件后重新生成测试脚本

### Q: 报告在哪里查看？

A:
1. Web界面点击"报告"按钮
2. 或者直接访问: `http://linux-ip/reports/task-id/index.html`

### Q: 如何配置邮件通知？

A:
编辑 `linux-platform/backend/src/main/resources/application.yml`:

```yaml
spring:
  mail:
    host: smtp.company.com
    port: 587
    username: your-email@company.com
    password: your-password
```

然后在代码中实现邮件发送逻辑。

## 最佳实践

### 1. 测试脚本管理

- 将生成的测试脚本提交到Git仓库
- 定期review和优化测试用例
- 保持测试脚本的可维护性

### 2. 测试数据管理

- 使用独立的测试数据库
- 每次测试前重置数据
- 避免测试数据污染

### 3. 测试环境隔离

- 开发环境和测试环境分离
- 使用Docker保证环境一致性
- 定期清理测试环境

### 4. 持续优化

- 分析测试报告，优化慢速测试
- 提高测试覆盖率
- 减少误报和漏报

## 技术支持

如有问题，请联系：
- 邮箱: support@company.com
- 文档: 查看项目README和docs目录
- 日志: 查看系统日志排查问题
