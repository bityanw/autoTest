package com.autotest.agent.service;

import com.autotest.agent.model.BuildRequest;
import com.autotest.agent.model.BuildResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.exec.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import okhttp3.*;

import java.io.*;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * 构建服务
 */
@Slf4j
@Service
public class BuildService {

    @Value("${build.workspace:C:/build-workspace}")
    private String workspace;

    @Value("${build.timeout:1800}")
    private int buildTimeout;

    private final ExecutorService executorService = Executors.newFixedThreadPool(3);
    private final ConcurrentHashMap<String, BuildResponse> buildStatusMap = new ConcurrentHashMap<>();
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    /**
     * 异步执行构建
     */
    public BuildResponse startBuild(BuildRequest request) {
        String buildId = UUID.randomUUID().toString();
        BuildResponse response = BuildResponse.building(buildId);
        buildStatusMap.put(buildId, response);

        executorService.submit(() -> {
            try {
                executeBuild(buildId, request);
            } catch (Exception e) {
                log.error("构建失败: {}", e.getMessage(), e);
                BuildResponse failedResponse = BuildResponse.failed(buildId, e.getMessage());
                buildStatusMap.put(buildId, failedResponse);
                notifyCallback(request.getCallbackUrl(), failedResponse);
            }
        });

        return response;
    }

    /**
     * 执行构建流程
     */
    private void executeBuild(String buildId, BuildRequest request) throws Exception {
        log.info("开始构建: {}", buildId);
        StringBuilder buildLog = new StringBuilder();

        // 1. SVN更新
        if (request.getSvnPath() != null) {
            buildLog.append("=== SVN更新 ===\n");
            String svnLog = executeSvnUpdate(request.getSvnPath());
            buildLog.append(svnLog).append("\n");
        }

        BuildResponse response = BuildResponse.success(buildId, "构建成功");

        // 2. 后端构建
        if ("full".equals(request.getBuildType()) || "backend".equals(request.getBuildType())) {
            buildLog.append("\n=== Maven构建后端 ===\n");
            String mavenLog = executeMavenBuild(request.getSvnPath());
            buildLog.append(mavenLog).append("\n");

            // 设置后端制品信息
            BuildResponse.ArtifactInfo backendArtifact = new BuildResponse.ArtifactInfo();
            backendArtifact.setGroupId("com.example");
            backendArtifact.setArtifactId(request.getProjectName());
            backendArtifact.setVersion("1.0.0-SNAPSHOT");
            response.setBackendArtifact(backendArtifact);
        }

        // 3. 前端构建
        if ("full".equals(request.getBuildType()) || "frontend".equals(request.getBuildType())) {
            buildLog.append("\n=== npm构建前端 ===\n");
            String npmLog = executeNpmBuild(request.getSvnPath());
            buildLog.append(npmLog).append("\n");

            // 设置前端制品信息
            BuildResponse.ArtifactInfo frontendArtifact = new BuildResponse.ArtifactInfo();
            frontendArtifact.setArtifactId(request.getProjectName() + "-frontend");
            frontendArtifact.setVersion("1.0.0");
            response.setFrontendArtifact(frontendArtifact);
        }

        response.setBuildLog(buildLog.toString());
        buildStatusMap.put(buildId, response);

        // 4. 回调通知
        notifyCallback(request.getCallbackUrl(), response);

        log.info("构建完成: {}", buildId);
    }

    /**
     * 执行SVN更新
     */
    private String executeSvnUpdate(String svnPath) throws Exception {
        String command = String.format("svn update \"%s\"", svnPath);
        return executeCommand(command, new File(svnPath).getParentFile());
    }

    /**
     * 执行Maven构建
     */
    private String executeMavenBuild(String projectPath) throws Exception {
        String command = "mvn clean package -DskipTests";
        return executeCommand(command, new File(projectPath));
    }

    /**
     * 执行npm构建
     */
    private String executeNpmBuild(String projectPath) throws Exception {
        File frontendDir = new File(projectPath, "frontend");
        if (!frontendDir.exists()) {
            return "前端目录不存在，跳过构建";
        }

        // npm install
        String installLog = executeCommand("npm install", frontendDir);
        // npm build
        String buildLog = executeCommand("npm run build", frontendDir);

        return installLog + "\n" + buildLog;
    }

    /**
     * 执行命令
     */
    private String executeCommand(String command, File workingDir) throws Exception {
        log.info("执行命令: {} in {}", command, workingDir);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        CommandLine cmdLine = CommandLine.parse(command);
        DefaultExecutor executor = new DefaultExecutor();
        executor.setWorkingDirectory(workingDir);
        executor.setStreamHandler(new PumpStreamHandler(outputStream));

        ExecuteWatchdog watchdog = new ExecuteWatchdog(buildTimeout * 1000L);
        executor.setWatchdog(watchdog);

        try {
            executor.execute(cmdLine);
            return outputStream.toString("UTF-8");
        } catch (Exception e) {
            String output = outputStream.toString("UTF-8");
            throw new Exception("命令执行失败: " + e.getMessage() + "\n" + output);
        }
    }

    /**
     * 回调通知
     */
    private void notifyCallback(String callbackUrl, BuildResponse response) {
        if (callbackUrl == null || callbackUrl.isEmpty()) {
            return;
        }

        try {
            // 构建JSON请求体
            String json = String.format(
                "{\"buildId\":\"%s\",\"status\":\"%s\",\"buildLog\":\"%s\",\"artifactUrl\":\"%s\"}",
                response.getBuildId(),
                response.getStatus(),
                response.getBuildLog() != null ? response.getBuildLog().replace("\"", "\\\"").replace("\n", "\\n") : "",
                response.getArtifactUrl() != null ? response.getArtifactUrl() : ""
            );

            RequestBody body = RequestBody.create(
                json,
                MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(callbackUrl)
                    .post(body)
                    .build();

            // 异步发送回调
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    log.error("回调通知失败: {} - {}", callbackUrl, e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response httpResponse) throws IOException {
                    if (httpResponse.isSuccessful()) {
                        log.info("回调通知成功: {} -> {}", callbackUrl, response.getStatus());
                    } else {
                        log.warn("回调通知返回错误: {} - {}", callbackUrl, httpResponse.code());
                    }
                    httpResponse.close();
                }
            });

        } catch (Exception e) {
            log.error("回调通知异常: {}", e.getMessage(), e);
        }
    }

    /**
     * 查询构建状态
     */
    public BuildResponse getBuildStatus(String buildId) {
        return buildStatusMap.get(buildId);
    }
}
