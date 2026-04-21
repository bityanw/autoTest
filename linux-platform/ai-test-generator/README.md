# AI测试脚本生成器

## 功能说明

自动分析Vue组件和Java API接口，使用Claude AI生成Playwright测试脚本。

## 安装依赖

```bash
npm install
```

## 配置

设置环境变量：

```bash
export ANTHROPIC_API_KEY=your-api-key
```

## 使用方法

### 命令行方式

```bash
node src/generator.js /path/to/vue/project ./generated-tests
```

### 编程方式

```javascript
const TestGenerator = require('./src/generator');

const generator = new TestGenerator();
await generator.generateAllTests(
    '/path/to/vue/project',
    './generated-tests'
);
```

## 生成流程

1. 扫描Vue组件目录（src/components）
2. 扫描API接口定义（src/api）
3. 使用Claude AI分析组件和接口
4. 生成Playwright测试脚本
5. 生成playwright.config.js配置文件

## 输出结构

```
generated-tests/
├── Component1.spec.js
├── Component2.spec.js
├── ...
└── playwright.config.js
```

## 测试脚本特点

- 使用Page Object模式
- 包含完整的断言
- 支持截图和视频录制
- 失败自动重试
- 生成HTML可视化报告
