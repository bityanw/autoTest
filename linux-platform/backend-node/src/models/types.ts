export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';

  // SVN配置
  svn: {
    path: string;
    branch?: string;
    username?: string;
    password?: string;
  };

  // 构建配置
  build: {
    type: 'full' | 'backend' | 'frontend';
    maven?: {
      goals?: string;
      profiles?: string[];
      skipTests?: boolean;
    };
    npm?: {
      command?: string;
      buildDir?: string;
    };
  };

  // 部署配置
  deploy: {
    type: 'docker' | 'war' | 'jar' | 'k8s';
    docker?: {
      image?: string;
      port?: number;
      envVars?: Record<string, string>;
    };
    war?: {
      tomcatPath?: string;
      contextPath?: string;
      tomcatPort?: number;
    };
    jar?: {
      javaOpts?: string;
      port?: number;
      workDir?: string;
    };
    k8s?: {
      namespace?: string;
      deployment?: string;
      service?: string;
    };
  };

  // 环境配置
  environments: {
    dev?: EnvironmentConfig;
    test?: EnvironmentConfig;
    prod?: EnvironmentConfig;
  };

  // Maven制品信息
  artifact?: {
    groupId: string;
    artifactId: string;
    version: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentConfig {
  enabled: boolean;
  deployUrl?: string;
  dockerImage?: string;
  envVars?: Record<string, string>;
}

export interface TestTask {
  taskId: string;
  projectName: string;
  projectId?: string;
  buildId?: string;
  status: 'pending' | 'building' | 'deploying' | 'testing' | 'success' | 'failed';
  buildLog?: string;
  testLog?: string;
  reportUrl?: string;
  createTime: string;
  updateTime: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  coverage?: number;
}

export interface BuildRequest {
  svnPath: string;
  svnBranch?: string;
  mavenRepoUrl: string;
  projectName: string;
  buildType: 'full' | 'backend' | 'frontend';
  callbackUrl?: string;
}

export interface BuildResponse {
  buildId: string;
  status: 'building' | 'success' | 'failed';
  message: string;
  backendArtifact?: ArtifactInfo;
  frontendArtifact?: ArtifactInfo;
  buildLog?: string;
}

export interface ArtifactInfo {
  groupId?: string;
  artifactId: string;
  version: string;
  downloadUrl?: string;
}
