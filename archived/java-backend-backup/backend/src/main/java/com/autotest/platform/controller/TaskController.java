package com.autotest.platform.controller;

import com.autotest.platform.model.TestTask;
import com.autotest.platform.service.TestTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 测试任务控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/task")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private TestTaskService testTaskService;

    /**
     * 创建测试任务
     */
    @PostMapping("/create")
    public Map<String, Object> createTask(@RequestBody Map<String, String> params) {
        String projectName = params.get("projectName");
        log.info("创建测试任务: {}", projectName);

        TestTask task = testTaskService.createTask(projectName);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("taskId", task.getTaskId());
        result.put("message", "任务创建成功");
        return result;
    }

    /**
     * 查询任务详情
     */
    @GetMapping("/detail/{taskId}")
    public Map<String, Object> getTaskDetail(@PathVariable String taskId) {
        TestTask task = testTaskService.getTask(taskId);

        Map<String, Object> result = new HashMap<>();
        if (task == null) {
            result.put("success", false);
            result.put("message", "任务不存在");
        } else {
            result.put("success", true);
            result.put("task", task);
        }
        return result;
    }

    /**
     * 获取任务列表
     */
    @GetMapping("/list")
    public Map<String, Object> getTaskList() {
        List<TestTask> tasks = testTaskService.getAllTasks();

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("tasks", tasks);
        result.put("total", tasks.size());
        return result;
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
