package com.autotest.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 测试平台启动类
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TestPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestPlatformApplication.class, args);
        System.out.println("测试平台启动成功！");
        System.out.println("访问地址: http://localhost:8080");
    }
}
