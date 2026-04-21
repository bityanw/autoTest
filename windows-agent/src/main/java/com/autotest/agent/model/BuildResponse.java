package com.autotest.agent.model;

import lombok.Data;

/**
 * 构建响应结果
 */
@Data
public class BuildResponse {

    /**
     * 构建ID
     */
    private String buildId;

    /**
     * 状态：success, failed, building
     */
    private String status;

    /**
     * 消息
     */
    private String message;

    /**
     * 后端制品信息
     */
    private ArtifactInfo backendArtifact;

    /**
     * 前端制品信息
     */
    private ArtifactInfo frontendArtifact;

    /**
     * 构建日志
     */
    private String buildLog;

    @Data
    public static class ArtifactInfo {
        private String groupId;
        private String artifactId;
        private String version;
        private String downloadUrl;
    }

    public static BuildResponse success(String buildId, String message) {
        BuildResponse response = new BuildResponse();
        response.setBuildId(buildId);
        response.setStatus("success");
        response.setMessage(message);
        return response;
    }

    public static BuildResponse failed(String buildId, String message) {
        BuildResponse response = new BuildResponse();
        response.setBuildId(buildId);
        response.setStatus("failed");
        response.setMessage(message);
        return response;
    }

    public static BuildResponse building(String buildId) {
        BuildResponse response = new BuildResponse();
        response.setBuildId(buildId);
        response.setStatus("building");
        response.setMessage("构建中...");
        return response;
    }
}
