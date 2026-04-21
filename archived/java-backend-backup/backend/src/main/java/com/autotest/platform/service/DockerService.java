package com.autotest.platform.service;

import com.autotest.platform.model.BuildResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

/**
 * Docker服务
 */
@Slf4j
@Service
public class DockerService {

    @Value("${docker.network:autotest-network}")
    private String dockerNetwork;

    @Value("${app.port:8888}")
    private int appPort;

    /**
     * 部署应用
     */
    public void deployApplication(String projectName, BuildResponse buildResponse) throws Exception {
        log.info("开始部署应用: {}", projectName);

        // 1. 停止旧容器
        stopContainer(projectName);

        // 2. 启动新容器
        startContainer(projectName, buildResponse);

        // 3. 等待应用启动
        waitForApplicationReady(projectName);

        log.info("应用部署完成: {}", projectName);
    }

    /**
     * 停止容器
     */
    private void stopContainer(String projectName) {
        try {
            String containerName = projectName + "-app";
            executeCommand("docker stop " + containerName);
            executeCommand("docker rm " + containerName);
            log.info("停止旧容器: {}", containerName);
        } catch (Exception e) {
            log.warn("停止容器失败（可能不存在）: {}", e.getMessage());
        }
    }

    /**
     * 启动容器
     */
    private void startContainer(String projectName, BuildResponse buildResponse) throws Exception {
        String containerName = projectName + "-app";
        BuildResponse.ArtifactInfo artifact = buildResponse.getBackendArtifact();

        // 构建docker run命令
        StringBuilder cmd = new StringBuilder("docker run -d ");
        cmd.append("--name ").append(containerName).append(" ");
        cmd.append("--network ").append(dockerNetwork).append(" ");
        cmd.append("-p ").append(appPort).append(":8080 ");
        cmd.append("-e ARTIFACT_GROUP=").append(artifact.getGroupId()).append(" ");
        cmd.append("-e ARTIFACT_ID=").append(artifact.getArtifactId()).append(" ");
        cmd.append("-e ARTIFACT_VERSION=").append(artifact.getVersion()).append(" ");
        cmd.append("autotest/app-runner:latest");

        executeCommand(cmd.toString());
        log.info("启动新容器: {}", containerName);
    }

    /**
     * 等待应用就绪
     */
    private void waitForApplicationReady(String projectName) throws Exception {
        int maxRetries = 30;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                String result = executeCommand("curl -s http://localhost:" + appPort + "/actuator/health");
                if (result.contains("UP")) {
                    log.info("应用已就绪");
                    return;
                }
            } catch (Exception e) {
                // 忽略
            }

            Thread.sleep(2000);
            retryCount++;
        }

        throw new Exception("应用启动超时");
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
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            StringBuilder errorOutput = new StringBuilder();
            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }
            throw new Exception("命令执行失败: " + errorOutput.toString());
        }

        return output.toString();
    }
}
