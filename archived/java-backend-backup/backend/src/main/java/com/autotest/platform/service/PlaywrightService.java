package com.autotest.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

/**
 * Playwright测试服务
 */
@Slf4j
@Service
public class PlaywrightService {

    @Value("${playwright.workspace:/opt/playwright-tests}")
    private String playwrightWorkspace;

    @Value("${app.url:http://localhost:8888}")
    private String appUrl;

    /**
     * 运行测试
     */
    public String runTests(String projectName) throws Exception {
        log.info("开始执行Playwright测试: {}", projectName);

        File testDir = new File(playwrightWorkspace, projectName);
        if (!testDir.exists()) {
            throw new Exception("测试目录不存在: " + testDir.getAbsolutePath());
        }

        // 执行测试
        String command = String.format(
            "cd %s && npx playwright test --reporter=html,json",
            testDir.getAbsolutePath()
        );

        return executeCommand(command);
    }

    /**
     * 生成测试报告
     */
    public String generateReport(String taskId) {
        // 报告路径
        String reportPath = "/reports/" + taskId + "/index.html";
        log.info("测试报告路径: {}", reportPath);
        return reportPath;
    }

    /**
     * 执行命令
     */
    private String executeCommand(String command) throws Exception {
        log.debug("执行命令: {}", command);

        Process process = Runtime.getRuntime().exec(new String[]{"bash", "-c", command});
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        StringBuilder output = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            output.append(line).append("\n");
            log.info(line);
        }

        int exitCode = process.waitFor();
        String result = output.toString();

        if (exitCode != 0) {
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errorOutput = new StringBuilder();
            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }
            log.warn("测试执行有失败用例，退出码: {}", exitCode);
            result += "\n错误输出:\n" + errorOutput.toString();
        }

        return result;
    }
}
