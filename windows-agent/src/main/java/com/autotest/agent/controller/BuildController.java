package com.autotest.agent.controller;

import com.autotest.agent.model.BuildRequest;
import com.autotest.agent.model.BuildResponse;
import com.autotest.agent.service.BuildService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 构建控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/build")
public class BuildController {

    @Autowired
    private BuildService buildService;

    /**
     * 触发构建
     */
    @PostMapping("/start")
    public BuildResponse startBuild(@RequestBody BuildRequest request) {
        log.info("收到构建请求: {}", request.getProjectName());
        return buildService.startBuild(request);
    }

    /**
     * 查询构建状态
     */
    @GetMapping("/status/{buildId}")
    public BuildResponse getBuildStatus(@PathVariable String buildId) {
        BuildResponse response = buildService.getBuildStatus(buildId);
        if (response == null) {
            return BuildResponse.failed(buildId, "构建ID不存在");
        }
        return response;
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
