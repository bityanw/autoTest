<template>
  <div class="project-config-container">
    <!-- 左侧项目列表 -->
    <div class="project-sidebar">
      <div class="sidebar-header">
        <h3>项目列表</h3>
        <el-button type="primary" size="small" @click="handleCreateProject">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
      </div>
      
      <el-input
        v-model="searchText"
        placeholder="搜索项目..."
        prefix-icon="Search"
        size="small"
        class="search-input"
      />
      
      <div class="project-list">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          :class="['project-item', { active: selectedProject?.id === project.id }]"
          @click="selectProject(project)"
        >
          <div class="project-info">
            <div class="project-name">{{ project.name }}</div>
            <div class="project-desc">{{ project.description }}</div>
          </div>
          <el-tag :type="project.status === 'active' ? 'success' : 'info'" size="small">
            {{ project.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </div>
        
        <el-empty v-if="filteredProjects.length === 0" description="暂无项目" />
      </div>
    </div>
    
    <!-- 右侧配置表单 -->
    <div class="config-panel">
      <div v-if="!selectedProject" class="empty-state">
        <el-empty description="请选择或创建一个项目" />
      </div>
      
      <el-form
        v-else
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="config-form"
      >
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>基本信息</span>
            </div>
          </template>
          
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入项目名称" />
          </el-form-item>
          
          <el-form-item label="项目描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入项目描述"
            />
          </el-form-item>
          
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio label="active">启用</el-radio>
              <el-radio label="inactive">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-card>
        
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>SVN配置</span>
            </div>
          </template>
          
          <el-form-item label="SVN路径" prop="svn.path">
            <el-input v-model="formData.svn.path" placeholder="C:/svn/project" />
          </el-form-item>
          
          <el-form-item label="分支" prop="svn.branch">
            <el-input v-model="formData.svn.branch" placeholder="trunk" />
          </el-form-item>
          
          <el-form-item label="用户名" prop="svn.username">
            <el-input v-model="formData.svn.username" placeholder="SVN用户名（可选）" />
          </el-form-item>
          
          <el-form-item label="密码" prop="svn.password">
            <el-input
              v-model="formData.svn.password"
              type="password"
              placeholder="SVN密码（可选）"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button @click="testSvnConnection" :loading="testingConnection">
              测试SVN连接
            </el-button>
          </el-form-item>
        </el-card>
        
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>构建配置</span>
            </div>
          </template>
          
          <el-form-item label="构建类型" prop="build.type">
            <el-select v-model="formData.build.type" placeholder="请选择构建类型">
              <el-option label="完整构建" value="full" />
              <el-option label="仅后端" value="backend" />
              <el-option label="仅前端" value="frontend" />
            </el-select>
          </el-form-item>
          
          <template v-if="formData.build.type !== 'frontend'">
            <el-divider content-position="left">Maven配置</el-divider>
            
            <el-form-item label="Maven Goals">
              <el-input v-model="formData.build.maven.goals" placeholder="clean package" />
            </el-form-item>
            
            <el-form-item label="Maven Profiles">
              <el-select
                v-model="formData.build.maven.profiles"
                multiple
                placeholder="选择Profile"
                allow-create
                filterable
              >
                <el-option label="dev" value="dev" />
                <el-option label="test" value="test" />
                <el-option label="prod" value="prod" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="跳过测试">
              <el-switch v-model="formData.build.maven.skipTests" />
            </el-form-item>
          </template>
          
          <template v-if="formData.build.type !== 'backend'">
            <el-divider content-position="left">NPM配置</el-divider>
            
            <el-form-item label="构建命令">
              <el-input v-model="formData.build.npm.command" placeholder="npm run build" />
            </el-form-item>
            
            <el-form-item label="构建目录">
              <el-input v-model="formData.build.npm.buildDir" placeholder="dist" />
            </el-form-item>
          </template>
        </el-card>
        
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>Docker部署配置</span>
            </div>
          </template>
          
          <el-form-item label="部署类型" prop="deploy.type">
            <el-select v-model="formData.deploy.type" placeholder="请选择部署类型">
              <el-option label="Docker容器" value="docker" />
              <el-option label="WAR包" value="war" />
              <el-option label="JAR包" value="jar" />
              <el-option label="Kubernetes" value="k8s" />
            </el-select>
          </el-form-item>
          
          <template v-if="formData.deploy.type === 'docker'">
            <el-form-item label="镜像名称">
              <el-input v-model="formData.deploy.docker.image" placeholder="myapp:latest" />
            </el-form-item>
            
            <el-form-item label="端口映射">
              <el-input-number v-model="formData.deploy.docker.port" :min="1" :max="65535" />
            </el-form-item>
            
            <el-form-item label="环境变量">
              <div class="env-vars">
                <div
                  v-for="(value, key) in formData.deploy.docker.envVars"
                  :key="key"
                  class="env-var-item"
                >
                  <el-input v-model="formData.deploy.docker.envVars[key]" :placeholder="key">
                    <template #prepend>{{ key }}</template>
                    <template #append>
                      <el-button @click="removeEnvVar(key)" icon="Delete" />
                    </template>
                  </el-input>
                </div>
                <el-button @click="addEnvVar" icon="Plus" size="small">添加环境变量</el-button>
              </div>
            </el-form-item>
          </template>
        </el-card>
        
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>环境配置</span>
            </div>
          </template>
          
          <el-form-item label="启用环境">
            <el-checkbox-group v-model="enabledEnvironments">
              <el-checkbox label="dev">开发环境</el-checkbox>
              <el-checkbox label="test">测试环境</el-checkbox>
              <el-checkbox label="prod">生产环境</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-card>
        
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>Maven制品信息</span>
            </div>
          </template>
          
          <el-form-item label="GroupId">
            <el-input v-model="formData.artifact.groupId" placeholder="com.example" />
          </el-form-item>
          
          <el-form-item label="ArtifactId">
            <el-input v-model="formData.artifact.artifactId" placeholder="myapp" />
          </el-form-item>
          
          <el-form-item label="Version">
            <el-input v-model="formData.artifact.version" placeholder="1.0.0" />
          </el-form-item>
        </el-card>
        
        <div class="form-actions">
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存配置
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button
            v-if="!isNewProject"
            type="danger"
            @click="handleDelete"
            :loading="deleting"
          >
            删除项目
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, Delete } from '@element-plus/icons-vue';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 数据
const projects = ref([]);
const selectedProject = ref(null);
const searchText = ref('');
const testingConnection = ref(false);
const saving = ref(false);
const deleting = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  status: 'active',
  svn: {
    path: '',
    branch: 'trunk',
    username: '',
    password: ''
  },
  build: {
    type: 'full',
    maven: {
      goals: 'clean package',
      profiles: [],
      skipTests: false
    },
    npm: {
      command: 'npm run build',
      buildDir: 'dist'
    }
  },
  deploy: {
    type: 'docker',
    docker: {
      image: '',
      port: 8080,
      envVars: {}
    }
  },
  environments: {
    dev: { enabled: false },
    test: { enabled: false },
    prod: { enabled: false }
  },
  artifact: {
    groupId: '',
    artifactId: '',
    version: '1.0.0'
  }
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
  'svn.path': [{ required: true, message: '请输入SVN路径', trigger: 'blur' }]
};

const formRef = ref(null);

// 计算属性
const filteredProjects = computed(() => {
  if (!searchText.value) return projects.value;
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
    p.description.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

const isNewProject = computed(() => !selectedProject.value?.id);

const enabledEnvironments = computed({
  get: () => {
    const envs = [];
    if (formData.environments.dev?.enabled) envs.push('dev');
    if (formData.environments.test?.enabled) envs.push('test');
    if (formData.environments.prod?.enabled) envs.push('prod');
    return envs;
  },
  set: (value) => {
    formData.environments.dev = { enabled: value.includes('dev') };
    formData.environments.test = { enabled: value.includes('test') };
    formData.environments.prod = { enabled: value.includes('prod') };
  }
});

// 方法
const loadProjects = async () => {
  try {
    const response = await axios.get(`${API_BASE}/project-config/list`);
    projects.value = response.data.data || [];
  } catch (error) {
    ElMessage.error('加载项目列表失败');
    console.error(error);
  }
};

const selectProject = (project) => {
  selectedProject.value = project;
  Object.assign(formData, JSON.parse(JSON.stringify(project)));
};

const handleCreateProject = () => {
  selectedProject.value = { id: null };
  Object.assign(formData, {
    name: '',
    description: '',
    status: 'active',
    svn: { path: '', branch: 'trunk', username: '', password: '' },
    build: {
      type: 'full',
      maven: { goals: 'clean package', profiles: [], skipTests: false },
      npm: { command: 'npm run build', buildDir: 'dist' }
    },
    deploy: {
      type: 'docker',
      docker: { image: '', port: 8080, envVars: {} }
    },
    environments: {
      dev: { enabled: false },
      test: { enabled: false },
      prod: { enabled: false }
    },
    artifact: { groupId: '', artifactId: '', version: '1.0.0' }
  });
};

const testSvnConnection = async () => {
  if (!formData.svn.path) {
    ElMessage.warning('请先输入SVN路径');
    return;
  }
  
  testingConnection.value = true;
  try {
    const response = await axios.post(`${API_BASE}/project-config/test-svn`, {
      svnPath: formData.svn.path
    });
    
    if (response.data.success) {
      ElMessage.success('SVN连接测试成功');
    } else {
      ElMessage.error(response.data.message || 'SVN连接测试失败');
    }
  } catch (error) {
    ElMessage.error('SVN连接测试失败');
    console.error(error);
  } finally {
    testingConnection.value = false;
  }
};

const handleSave = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    saving.value = true;
    try {
      const data = { ...formData };
      
      if (isNewProject.value) {
        const response = await axios.post(`${API_BASE}/project-config/create`, data);
        if (response.data.success) {
          ElMessage.success('项目创建成功');
          await loadProjects();
          selectedProject.value = response.data.data;
        }
      } else {
        const response = await axios.put(
          `${API_BASE}/project-config/update/${selectedProject.value.id}`,
          data
        );
        if (response.data.success) {
          ElMessage.success('项目更新成功');
          await loadProjects();
        }
      }
    } catch (error) {
      ElMessage.error(isNewProject.value ? '创建项目失败' : '更新项目失败');
      console.error(error);
    } finally {
      saving.value = false;
    }
  });
};

const handleReset = () => {
  if (selectedProject.value?.id) {
    Object.assign(formData, JSON.parse(JSON.stringify(selectedProject.value)));
  } else {
    handleCreateProject();
  }
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    deleting.value = true;
    const response = await axios.delete(
      `${API_BASE}/project-config/delete/${selectedProject.value.id}`
    );
    
    if (response.data.success) {
      ElMessage.success('项目删除成功');
      selectedProject.value = null;
      await loadProjects();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除项目失败');
      console.error(error);
    }
  } finally {
    deleting.value = false;
  }
};

const addEnvVar = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入环境变量名称', '添加环境变量', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[A-Z_][A-Z0-9_]*$/,
      inputErrorMessage: '环境变量名称格式不正确'
    });
    
    if (value && !formData.deploy.docker.envVars[value]) {
      formData.deploy.docker.envVars[value] = '';
    }
  } catch (error) {
    // 用户取消
  }
};

const removeEnvVar = (key) => {
  delete formData.deploy.docker.envVars[key];
};

// 生命周期
onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.project-config-container {
  display: flex;
  height: calc(100vh - 120px);
  gap: 20px;
}

.project-sidebar {
  width: 300px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.search-input {
  margin-bottom: 15px;
}

.project-list {
  flex: 1;
  overflow-y: auto;
}

.project-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.project-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.project-item.active .project-name,
.project-item.active .project-desc {
  color: white;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-desc {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.config-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-form {
  max-width: 800px;
}

.form-section {
  margin-bottom: 20px;
}

.section-header {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.env-vars {
  width: 100%;
}

.env-var-item {
  margin-bottom: 10px;
}

.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 10px;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
}

:deep(.el-divider__text) {
  background: white;
  color: #909399;
  font-size: 13px;
}
</style>
