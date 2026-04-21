const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs-extra');
const path = require('path');

/**
 * AI测试脚本生成器
 */
class TestGenerator {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
        });
    }

    /**
     * 分析Vue组件
     */
    async analyzeVueComponents(projectPath) {
        console.log('分析Vue组件...');

        const components = [];
        const componentsDir = path.join(projectPath, 'src/components');

        if (await fs.pathExists(componentsDir)) {
            const files = await fs.readdir(componentsDir);

            for (const file of files) {
                if (file.endsWith('.vue')) {
                    const filePath = path.join(componentsDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');

                    components.push({
                        name: file,
                        path: filePath,
                        content: content
                    });
                }
            }
        }

        return components;
    }

    /**
     * 分析API接口
     */
    async analyzeApiEndpoints(projectPath) {
        console.log('分析API接口...');

        const endpoints = [];
        const apiDir = path.join(projectPath, 'src/api');

        if (await fs.pathExists(apiDir)) {
            const files = await fs.readdir(apiDir);

            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.ts')) {
                    const filePath = path.join(apiDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');

                    // 简单的正则匹配API路径
                    const matches = content.match(/['"`](\/api\/[^'"`]+)['"`]/g);
                    if (matches) {
                        matches.forEach(match => {
                            endpoints.push(match.replace(/['"`]/g, ''));
                        });
                    }
                }
            }
        }

        return [...new Set(endpoints)]; // 去重
    }

    /**
     * 使用Claude生成测试脚本
     */
    async generateTestScript(component, endpoints) {
        console.log(`生成测试脚本: ${component.name}`);

        const prompt = `
你是一个专业的测试工程师。请根据以下Vue组件和API接口，生成Playwright E2E测试脚本。

## Vue组件信息
文件名: ${component.name}
组件代码:
\`\`\`vue
${component.content.substring(0, 2000)}
\`\`\`

## 可用的API接口
${endpoints.join('\n')}

## 要求
1. 使用Playwright框架
2. 测试主要的用户交互流程
3. 包含断言验证
4. 代码要清晰易读
5. 使用Page Object模式

请直接输出完整的测试脚本代码，不要有其他说明文字。
`;

        try {
            const message = await this.client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return message.content[0].text;
        } catch (error) {
            console.error('调用Claude API失败:', error.message);
            return this.generateFallbackTest(component);
        }
    }

    /**
     * 生成备用测试脚本（当AI不可用时）
     */
    generateFallbackTest(component) {
        const componentName = component.name.replace('.vue', '');

        return `
import { test, expect } from '@playwright/test';

test.describe('${componentName} 测试', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('页面加载测试', async ({ page }) => {
        await expect(page).toHaveTitle(/.*/);
    });

    test('基本交互测试', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 检查页面元素是否存在
        const mainContent = page.locator('main, .main, #app');
        await expect(mainContent).toBeVisible();

        // 检查按钮交互
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        if (buttonCount > 0) {
            await expect(buttons.first()).toBeVisible();
        }

        // 检查输入框
        const inputs = page.locator('input');
        const inputCount = await inputs.count();
        if (inputCount > 0) {
            await expect(inputs.first()).toBeVisible();
        }
    });

    test('导航测试', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // 检查导航链接
        const links = page.locator('a[href]');
        const linkCount = await links.count();

        if (linkCount > 0) {
            const firstLink = links.first();
            await expect(firstLink).toBeVisible();
        }
    });

    test('响应式测试', async ({ page }) => {
        // 测试移动端视图
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();

        // 测试桌面端视图
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });
});
`;
    }

    /**
     * 生成所有测试脚本
     */
    async generateAllTests(projectPath, outputDir) {
        console.log('开始生成测试脚本...');

        // 1. 分析组件和API
        const components = await this.analyzeVueComponents(projectPath);
        const endpoints = await this.analyzeApiEndpoints(projectPath);

        console.log(`找到 ${components.length} 个组件`);
        console.log(`找到 ${endpoints.length} 个API接口`);

        // 2. 确保输出目录存在
        await fs.ensureDir(outputDir);

        // 3. 生成测试脚本
        for (const component of components) {
            const testScript = await this.generateTestScript(component, endpoints);
            const testFileName = component.name.replace('.vue', '.spec.js');
            const testFilePath = path.join(outputDir, testFileName);

            await fs.writeFile(testFilePath, testScript);
            console.log(`生成测试文件: ${testFileName}`);
        }

        // 4. 生成playwright配置
        await this.generatePlaywrightConfig(outputDir);

        console.log('测试脚本生成完成！');
    }

    /**
     * 生成Playwright配置文件
     */
    async generatePlaywrightConfig(outputDir) {
        const config = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: '../reports/html' }],
        ['json', { outputFile: '../reports/results.json' }]
    ],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:8888',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
`;

        await fs.writeFile(path.join(outputDir, 'playwright.config.js'), config);
    }
}

module.exports = TestGenerator;

// 命令行调用
if (require.main === module) {
    const generator = new TestGenerator();
    const projectPath = process.argv[2] || '/path/to/vue/project';
    const outputDir = process.argv[3] || './generated-tests';

    generator.generateAllTests(projectPath, outputDir)
        .then(() => console.log('完成！'))
        .catch(err => console.error('错误:', err));
}
