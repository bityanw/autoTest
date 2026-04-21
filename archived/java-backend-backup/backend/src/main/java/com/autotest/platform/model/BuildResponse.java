package com.autotest.platform.model;

import lombok.Data;

/**
 * 构建响应结果
 */
@Data
public class BuildResponse {
    private String buildId;
    private String status;
    private String message;
    private ArtifactInfo backendArtifact;
    private ArtifactInfo frontendArtifact;
    private String buildLog;

    @Data
    public static class ArtifactInfo {
        private String groupId;
        private String artifactId;
        private String version;
        private String downloadUrl;
    }
}
