package com.autotest.platform.client;

import com.alibaba.fastjson.JSON;
import com.autotest.platform.model.BuildRequest;
import com.autotest.platform.model.BuildResponse;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Windows Agent客户端
 */
@Slf4j
@Component
public class WindowsAgentClient {

    @Value("${windows.agent.url}")
    private String agentUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    /**
     * 触发构建
     */
    public BuildResponse triggerBuild(BuildRequest request) throws IOException {
        String url = agentUrl + "/api/build/start";
        String jsonBody = JSON.toJSONString(request);

        Request httpRequest = new Request.Builder()
                .url(url)
                .post(RequestBody.create(jsonBody, JSON_TYPE))
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("调用Windows Agent失败: " + response.code());
            }

            String responseBody = response.body().string();
            return JSON.parseObject(responseBody, BuildResponse.class);
        }
    }

    /**
     * 查询构建状态
     */
    public BuildResponse getBuildStatus(String buildId) throws IOException {
        String url = agentUrl + "/api/build/status/" + buildId;

        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("查询构建状态失败: " + response.code());
            }

            String responseBody = response.body().string();
            return JSON.parseObject(responseBody, BuildResponse.class);
        }
    }

    /**
     * 健康检查
     */
    public boolean healthCheck() {
        try {
            String url = agentUrl + "/api/build/health";
            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            log.error("Windows Agent健康检查失败", e);
            return false;
        }
    }
}
