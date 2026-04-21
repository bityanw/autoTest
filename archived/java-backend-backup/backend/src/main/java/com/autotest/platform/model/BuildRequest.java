package com.autotest.platform.model;

import lombok.Data;

/**
 * 构建请求参数
 */
@Data
public class BuildRequest {
    private String svnPath;
    private String svnBranch;
    private String mavenRepoUrl;
    private String projectName;
    private String buildType = "full";
    private String callbackUrl;
}
