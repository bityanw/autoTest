package com.autotest.platform.service;

import com.autotest.platform.model.TestTask;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;
import java.text.SimpleDateFormat;

/**
 * 邮件通知服务
 */
@Slf4j
@Service
public class NotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${notification.email.from:test-platform@company.com}")
    private String emailFrom;

    @Value("${notification.email.to:}")
    private String emailTo;

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    /**
     * 发送测试完成通知
     */
    public void sendTestCompleteNotification(TestTask task) {
        if (!emailEnabled || mailSender == null) {
            log.info("邮件通知未启用");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailFrom);
            helper.setTo(emailTo.split(","));
            helper.setSubject("测试任务完成通知 - " + task.getProjectName());
            helper.setText(buildEmailContent(task), true);

            mailSender.send(message);
            log.info("邮件通知已发送: {}", task.getTaskId());

        } catch (Exception e) {
            log.error("发送邮件失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 构建邮件内容
     */
    private String buildEmailContent(TestTask task) {
        String status = "success".equals(task.getStatus()) ? "✅ 成功" : "❌ 失败";
        String statusColor = "success".equals(task.getStatus()) ? "#52c41a" : "#f5222d";

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String createTime = task.getCreateTime() != null ? sdf.format(task.getCreateTime()) : "-";
        String updateTime = task.getUpdateTime() != null ? sdf.format(task.getUpdateTime()) : "-";

        double passRate = task.getTotalTests() != null && task.getTotalTests() > 0
                ? (task.getPassedTests() * 100.0 / task.getTotalTests())
                : 0;

        String reportLink = baseUrl + task.getReportUrl();

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }\n" +
                "        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }\n" +
                "        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }\n" +
                "        .label { font-weight: bold; color: #666; }\n" +
                "        .value { color: #333; }\n" +
                "        .status { font-size: 24px; font-weight: bold; color: " + statusColor + "; }\n" +
                "        .button { display: inline-block; padding: 12px 24px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }\n" +
                "        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h2>🎯 测试任务完成通知</h2>\n" +
                "        </div>\n" +
                "        <div class=\"content\">\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">项目名称:</span>\n" +
                "                <span class=\"value\">" + task.getProjectName() + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">任务ID:</span>\n" +
                "                <span class=\"value\">" + task.getTaskId() + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">执行状态:</span>\n" +
                "                <span class=\"status\">" + status + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">测试用例:</span>\n" +
                "                <span class=\"value\">总数 " + task.getTotalTests() + " | 通过 " + task.getPassedTests() + " | 失败 " + task.getFailedTests() + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">通过率:</span>\n" +
                "                <span class=\"value\">" + String.format("%.1f", passRate) + "%</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">代码覆盖率:</span>\n" +
                "                <span class=\"value\">" + String.format("%.1f", task.getCoverage()) + "%</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">开始时间:</span>\n" +
                "                <span class=\"value\">" + createTime + "</span>\n" +
                "            </div>\n" +
                "            <div class=\"info-row\">\n" +
                "                <span class=\"label\">完成时间:</span>\n" +
                "                <span class=\"value\">" + updateTime + "</span>\n" +
                "            </div>\n" +
                "            <div style=\"text-align: center;\">\n" +
                "                <a href=\"" + reportLink + "\" class=\"button\">查看详细报告</a>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>此邮件由自动化测试平台自动发送，请勿回复</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
