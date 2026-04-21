package com.autotest.agent.model;

import lombok.Data;

/**
 * 构建请求参数
 */
@Data
public class BuildRequest {

    /**
     * SVN仓库路径
     */
    private String svnPath;

    /**
     * SVN分支或标签
     */
    private String svnBranch;

    /**
     * Maven私服地址
     */
    private String mavenRepoUrl;

    /**
     * 项目名称
     */
    private String projectName;

    /**
     * 构建类型：full(全量), backend(仅后端), frontend(仅前端)
     */
    private String buildType = "full";

    /**
     * 回调URL（构建完成后通知）
     */
    private String callbackUrl;
}
