package com.autotest.platform.model;

import lombok.Data;
import java.util.Date;

/**
 * 测试任务
 */
@Data
public class TestTask {
    private String taskId;
    private String projectName;
    private String buildId;
    private String status; // pending, building, deploying, testing, success, failed
    private String buildLog;
    private String testLog;
    private String reportUrl;
    private Date createTime;
    private Date updateTime;
    private Integer totalTests;
    private Integer passedTests;
    private Integer failedTests;
    private Double coverage;
}
