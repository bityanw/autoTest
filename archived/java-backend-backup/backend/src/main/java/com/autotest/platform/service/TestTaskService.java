package com.autotest.platform.service;

import com.autotest.platform.client.WindowsAgentClient;
import com.autotest.platform.model.BuildRequest;
import com.autotest.platform.model.BuildResponse;
import com.autotest.platform.model.TestTask;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 测试任务服务
 */
@Slf4j
@Service
public class TestTaskService {

    @Autowired
    private WindowsAgentClient windowsAgentClient;

    @Autowired
    private DockerService dockerService;

    @Autowired
    private PlaywrightService playwrightService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private NotificationService notificationService;

    @Value("${maven.repo.url}")
    private String mavenRepoUrl;

    @Value("${svn.project.path}")
    private String svnProjectPath;

    private final Map<String, TestTask> taskMap = new ConcurrentHashMap<>();

    /**
     * 创建测试任务
     */
    public TestTask createTask(String projectName) {
        TestTask task = new TestTask();
        task.setTaskId(UUID.randomUUID().toString());
        task.setProjectName(projectName);
        task.setStatus("pending");
        task.setCreateTime(new Date());
        task.setUpdateTime(new Date());

        taskMap.put(task.getTaskId(), task);
        log.info("创建测试任务: {}", task.getTaskId());

        // 异步执行任务
        executeTaskAsync(task);

        return task;
    }

    /**
     * 异步执行测试任务
     */
    @Async
    public void executeTaskAsync(TestTask task) {
        try {
            // 1. 触发Windows编译
            log.info("步骤1: 触发Windows编译");
            task.setStatus("building");
            updateTask(task);

            BuildRequest buildRequest = new BuildRequest();
            buildRequest.setSvnPath(svnProjectPath);
            buildRequest.setMavenRepoUrl(mavenRepoUrl);
            buildRequest.setProjectName(task.getProjectName());
            buildRequest.setBuildType("full");
            buildRequest.setCallbackUrl("http://localhost:8080/api/callback/build");

            BuildResponse buildResponse = windowsAgentClient.triggerBuild(buildRequest);
            task.setBuildId(buildResponse.getBuildId());
            updateTask(task);

            // 2. 等待构建完成
            log.info("步骤2: 等待构建完成");
            buildResponse = waitForBuildComplete(buildResponse.getBuildId());
            if (!"success".equals(buildResponse.getStatus())) {
                task.setStatus("failed");
                task.setBuildLog(buildResponse.getBuildLog());
                updateTask(task);
                return;
            }
            task.setBuildLog(buildResponse.getBuildLog());

            // 3. Docker部署应用
            log.info("步骤3: Docker部署应用");
            task.setStatus("deploying");
            updateTask(task);

            dockerService.deployApplication(task.getProjectName(), buildResponse);

            // 4. 执行Playwright测试
            log.info("步骤4: 执行Playwright测试");
            task.setStatus("testing");
            updateTask(task);

            String testLog = playwrightService.runTests(task.getProjectName());
            task.setTestLog(testLog);

            // 5. 生成测试报告
            log.info("步骤5: 生成测试报告");
            parseTestResults(task);

            Map<String, Object> testResults = new HashMap<>();
            testResults.put("totalTests", task.getTotalTests());
            testResults.put("passedTests", task.getPassedTests());
            testResults.put("failedTests", task.getFailedTests());
            testResults.put("coverage", task.getCoverage());

            String reportUrl = reportService.generateReport(task.getTaskId(), testResults);
            task.setReportUrl(reportUrl);

            task.setStatus("success");
            task.setUpdateTime(new Date());
            updateTask(task);

            // 6. 发送通知
            notificationService.sendTestCompleteNotification(task);

            log.info("测试任务完成: {}", task.getTaskId());

        } catch (Exception e) {
            log.error("测试任务执行失败: {}", e.getMessage(), e);
            task.setStatus("failed");
            task.setTestLog(e.getMessage());
            updateTask(task);
        }
    }

    /**
     * 等待构建完成
     */
    private BuildResponse waitForBuildComplete(String buildId) throws Exception {
        int maxRetries = 60; // 最多等待30分钟
        int retryCount = 0;

        while (retryCount < maxRetries) {
            BuildResponse response = windowsAgentClient.getBuildStatus(buildId);

            if ("success".equals(response.getStatus())) {
                return response;
            } else if ("failed".equals(response.getStatus())) {
                throw new Exception("构建失败: " + response.getMessage());
            }

            Thread.sleep(30000); // 等待30秒
            retryCount++;
        }

        throw new Exception("构建超时");
    }

    /**
     * 解析测试结果
     */
    private void parseTestResults(TestTask task) {
        try {
            String reportPath = String.format("/opt/reports/%s/results.json", task.getProjectName());
            File reportFile = new File(reportPath);

            if (!reportFile.exists()) {
                log.warn("测试报告不存在: {}, 使用默认值", reportPath);
                task.setTotalTests(0);
                task.setPassedTests(0);
                task.setFailedTests(0);
                task.setCoverage(0.0);
                return;
            }

            // 读取JSON报告
            String jsonContent = new String(java.nio.file.Files.readAllBytes(reportFile.toPath()));
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonContent);

            int total = 0;
            int passed = 0;
            int failed = 0;

            // 解析测试套件
            if (root.has("suites") && root.get("suites").isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode suite : root.get("suites")) {
                    if (suite.has("specs") && suite.get("specs").isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode spec : suite.get("specs")) {
                            total++;
                            if (spec.has("ok") && spec.get("ok").asBoolean()) {
                                passed++;
                            } else {
                                failed++;
                            }
                        }
                    }
                }
            }

            task.setTotalTests(total);
            task.setPassedTests(passed);
            task.setFailedTests(failed);

            // 尝试读取覆盖率
            String coveragePath = String.format("/opt/reports/%s/coverage/coverage-summary.json", task.getProjectName());
            File coverageFile = new File(coveragePath);
            if (coverageFile.exists()) {
                String coverageJson = new String(java.nio.file.Files.readAllBytes(coverageFile.toPath()));
                com.fasterxml.jackson.databind.JsonNode coverageRoot = mapper.readTree(coverageJson);
                if (coverageRoot.has("total") && coverageRoot.get("total").has("lines")) {
                    double coverage = coverageRoot.get("total").get("lines").get("pct").asDouble();
                    task.setCoverage(coverage);
                } else {
                    task.setCoverage(0.0);
                }
            } else {
                task.setCoverage(0.0);
            }

            log.info("测试结果解析完成: 总计{}, 通过{}, 失败{}, 覆盖率{}%",
                    total, passed, failed, task.getCoverage());

        } catch (Exception e) {
            log.error("解析测试结果失败: {}", e.getMessage(), e);
            task.setTotalTests(0);
            task.setPassedTests(0);
            task.setFailedTests(0);
            task.setCoverage(0.0);
        }
    }

    /**
     * 更新任务
     */
    private void updateTask(TestTask task) {
        task.setUpdateTime(new Date());
        taskMap.put(task.getTaskId(), task);
    }

    /**
     * 获取任务
     */
    public TestTask getTask(String taskId) {
        return taskMap.get(taskId);
    }

    /**
     * 获取所有任务
     */
    public List<TestTask> getAllTasks() {
        return new ArrayList<>(taskMap.values());
    }
}
