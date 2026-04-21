package com.autotest.platform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * 测试报告服务
 */
@Slf4j
@Service
public class ReportService {

    @Value("${report.output.dir:/opt/reports}")
    private String reportOutputDir;

    /**
     * 生成测试报告
     */
    public String generateReport(String taskId, Map<String, Object> testResults) throws Exception {
        log.info("生成测试报告: {}", taskId);

        // 创建报告目录
        Path reportDir = Paths.get(reportOutputDir, taskId);
        Files.createDirectories(reportDir);

        // 1. 复制Playwright HTML报告
        copyPlaywrightReport(taskId, reportDir);

        // 2. 生成汇总报告
        generateSummaryReport(taskId, testResults, reportDir);

        // 3. 生成覆盖率报告
        generateCoverageReport(taskId, reportDir);

        String reportUrl = "/reports/" + taskId + "/index.html";
        log.info("报告生成完成: {}", reportUrl);

        return reportUrl;
    }

    /**
     * 复制Playwright报告
     */
    private void copyPlaywrightReport(String taskId, Path reportDir) throws Exception {
        Path playwrightReport = Paths.get("/opt/playwright-tests/playwright-report");

        if (Files.exists(playwrightReport)) {
            copyDirectory(playwrightReport, reportDir.resolve("playwright"));
            log.info("Playwright报告已复制");
        }
    }

    /**
     * 生成汇总报告
     */
    private void generateSummaryReport(String taskId, Map<String, Object> testResults, Path reportDir) throws Exception {
        String html = generateSummaryHtml(taskId, testResults);
        Files.write(reportDir.resolve("index.html"), html.getBytes("UTF-8"));
        log.info("汇总报告已生成");
    }

    /**
     * 生成汇总HTML
     */
    private String generateSummaryHtml(String taskId, Map<String, Object> testResults) {
        int totalTests = (int) testResults.getOrDefault("totalTests", 0);
        int passedTests = (int) testResults.getOrDefault("passedTests", 0);
        int failedTests = (int) testResults.getOrDefault("failedTests", 0);
        double coverage = (double) testResults.getOrDefault("coverage", 0.0);
        double passRate = totalTests > 0 ? (passedTests * 100.0 / totalTests) : 0;

        String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

        return "<!DOCTYPE html>\n" +
                "<html lang=\"zh-CN\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>测试报告 - " + taskId + "</title>\n" +
                "    <style>\n" +
                "        * { margin: 0; padding: 0; box-sizing: border-box; }\n" +
                "        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }\n" +
                "        .container { max-width: 1200px; margin: 0 auto; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }\n" +
                "        .header h1 { font-size: 32px; margin-bottom: 10px; }\n" +
                "        .header p { opacity: 0.9; }\n" +
                "        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }\n" +
                "        .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n" +
                "        .card h3 { color: #666; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }\n" +
                "        .card .value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }\n" +
                "        .card .label { color: #999; font-size: 14px; }\n" +
                "        .success { color: #52c41a; }\n" +
                "        .error { color: #f5222d; }\n" +
                "        .info { color: #1890ff; }\n" +
                "        .warning { color: #faad14; }\n" +
                "        .progress-bar { width: 100%; height: 30px; background: #f0f0f0; border-radius: 15px; overflow: hidden; margin-top: 10px; }\n" +
                "        .progress-fill { height: 100%; background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%); transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }\n" +
                "        .links { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n" +
                "        .links h2 { margin-bottom: 15px; color: #333; }\n" +
                "        .links a { display: inline-block; padding: 12px 24px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px; margin-bottom: 10px; transition: background 0.3s; }\n" +
                "        .links a:hover { background: #096dd9; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h1>🎯 测试报告</h1>\n" +
                "            <p>任务ID: " + taskId + " | 生成时间: " + timestamp + "</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"summary\">\n" +
                "            <div class=\"card\">\n" +
                "                <h3>测试用例总数</h3>\n" +
                "                <div class=\"value info\">" + totalTests + "</div>\n" +
                "                <div class=\"label\">Total Tests</div>\n" +
                "            </div>\n" +
                "            <div class=\"card\">\n" +
                "                <h3>通过用例</h3>\n" +
                "                <div class=\"value success\">" + passedTests + "</div>\n" +
                "                <div class=\"label\">Passed</div>\n" +
                "            </div>\n" +
                "            <div class=\"card\">\n" +
                "                <h3>失败用例</h3>\n" +
                "                <div class=\"value error\">" + failedTests + "</div>\n" +
                "                <div class=\"label\">Failed</div>\n" +
                "            </div>\n" +
                "            <div class=\"card\">\n" +
                "                <h3>代码覆盖率</h3>\n" +
                "                <div class=\"value warning\">" + String.format("%.1f", coverage) + "%</div>\n" +
                "                <div class=\"label\">Coverage</div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"card\" style=\"margin-bottom: 20px;\">\n" +
                "            <h3>通过率</h3>\n" +
                "            <div class=\"progress-bar\">\n" +
                "                <div class=\"progress-fill\" style=\"width: " + String.format("%.1f", passRate) + "%\">\n" +
                "                    " + String.format("%.1f", passRate) + "%\n" +
                "                </div>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"links\">\n" +
                "            <h2>详细报告</h2>\n" +
                "            <a href=\"playwright/index.html\" target=\"_blank\">📊 Playwright测试报告</a>\n" +
                "            <a href=\"coverage/index.html\" target=\"_blank\">📈 代码覆盖率报告</a>\n" +
                "            <a href=\"../\" target=\"_blank\">🔙 返回任务列表</a>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * 生成覆盖率报告
     */
    private void generateCoverageReport(String taskId, Path reportDir) throws Exception {
        Path coverageDir = reportDir.resolve("coverage");
        Files.createDirectories(coverageDir);

        try {
            // 尝试从Playwright测试结果中复制覆盖率报告
            Path playwrightCoverage = Paths.get("/opt/reports/" + taskId + "/coverage");

            if (Files.exists(playwrightCoverage)) {
                // 复制Playwright生成的覆盖率报告
                copyDirectory(playwrightCoverage, coverageDir);
                log.info("覆盖率报告已复制: {}", coverageDir);
            } else {
                // 生成占位符HTML
                generatePlaceholderCoverageReport(coverageDir);
                log.warn("未找到覆盖率报告，已生成占位符");
            }
        } catch (Exception e) {
            log.error("生成覆盖率报告失败: {}", e.getMessage(), e);
            generatePlaceholderCoverageReport(coverageDir);
        }
    }

    /**
     * 生成占位符覆盖率报告
     */
    private void generatePlaceholderCoverageReport(Path coverageDir) throws IOException {
        String placeholderHtml = "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>覆盖率报告</title>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; margin: 40px; }\n" +
                "        .info { background: #e3f2fd; padding: 20px; border-radius: 5px; }\n" +
                "        h1 { color: #1976d2; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <h1>代码覆盖率报告</h1>\n" +
                "    <div class=\"info\">\n" +
                "        <p>覆盖率报告功能说明：</p>\n" +
                "        <ul>\n" +
                "            <li>前端覆盖率：使用Istanbul/NYC生成</li>\n" +
                "            <li>后端覆盖率：使用JaCoCo生成</li>\n" +
                "            <li>配置Playwright测试时启用覆盖率收集</li>\n" +
                "        </ul>\n" +
                "        <p>当前测试未生成覆盖率数据。</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";

        Files.write(coverageDir.resolve("index.html"), placeholderHtml.getBytes("UTF-8"));
    }

    /**
     * 复制目录
     */
    private void copyDirectory(Path source, Path target) throws IOException {
        Files.walk(source).forEach(sourcePath -> {
            try {
                Path targetPath = target.resolve(source.relativize(sourcePath));
                if (Files.isDirectory(sourcePath)) {
                    Files.createDirectories(targetPath);
                } else {
                    Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                log.error("复制文件失败: {}", e.getMessage());
            }
        });
    }
}
