package com.autotest.agent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Windows编译Agent启动类
 */
@SpringBootApplication
public class BuildAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(BuildAgentApplication.class, args);
        System.out.println("Windows Build Agent 启动成功！");
        System.out.println("监听端口: 8081");
    }
}
