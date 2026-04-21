# 归档文件说明

## Java后端已归档

原 `linux-platform/backend` (Spring Boot后端) 已移至此目录。

### 归档原因

项目已全面迁移到Node.js后端，Java后端不再使用。为避免混淆和维护负担，将其归档保存。

### 归档内容

- `java-backend-backup/backend/` - Spring Boot后端完整代码
  - 包含所有Java源文件
  - 包含pom.xml配置
  - 包含application.yml配置

### 如需恢复

如果需要恢复Java后端：

```bash
# 从归档目录恢复
cp -r archived/java-backend-backup/backend linux-platform/

# 编译运行
cd linux-platform/backend
mvn clean package
java -jar target/test-platform-1.0.0.jar
```

### 当前架构

项目现在使用：
- **后端**: Node.js + Express + TypeScript
- **前端**: Vue 3 + Element Plus
- **数据存储**: LowDB (JSON文件数据库)

### 归档时间

2026-04-08

### 相关文档

所有文档已更新，移除了Java后端的引用：
- PROJECT-STRUCTURE.md
- docs/project-summary.md
- docs/architecture.md
- linux-platform/README.md
