# SM-DoubleAssistant

浙江科技大学数字媒体技术专业 **师生双选系统**，支持学生选导师、导师选学生的双向匹配流程。

包含微信小程序（学生/教师端）、管理后台（管理员端）和后端服务三个子项目，使用 pnpm monorepo 统一管理。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx                            │
│              (反向代理 + 静态资源托管)                      │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   location /         │   location /api                  │
│   Admin 静态资源      │   反向代理 → :7001                │
│                      │                                  │
├──────────────────────┼──────────────────────────────────┤
│                      │                                  │
│  ┌────────────────┐  │  ┌────────────────────────────┐  │
│  │  Admin 管理后台  │  │  │   Egg.js 后端服务 (:7001)   │  │
│  │  Vue3 + E.Plus  │──┼─▶│   Controller → Service     │  │
│  │  :8080 (dev)    │  │  │   Model (Mongoose)         │  │
│  └────────────────┘  │  └─────────┬──────────────────┘  │
│                      │            │                     │
│  ┌────────────────┐  │            ▼                     │
│  │  微信小程序      │  │  ┌──────────────────┐           │
│  │  UniApp + Vue3  │──┼─▶│    MongoDB        │           │
│  │  :9000 (H5)    │  │  └──────────────────┘           │
│  └────────────────┘  │                                  │
└──────────────────────┴──────────────────────────────────┘
```

## 技术栈

| 子项目 | 目录 | 技术栈 | 开发端口 |
|--------|------|--------|----------|
| 微信小程序 | `apps/miniprogram` | UniApp + Vue3 + Vite + UnoCSS + Pinia + wot-design-uni | 9000 (H5) |
| 管理后台 | `apps/admin` | Vue3 + Vite + Element Plus + Vuex | 8080 |
| 后端服务 | `apps/server` | Egg.js + MongoDB + Mongoose + JWT | 7001 |

**Monorepo 管理**: pnpm workspace

## 环境要求

- Node.js >= 18
- pnpm >= 9（`npm install -g pnpm`）
- MongoDB（后端服务需要）
- 微信开发者工具（小程序开发需要）

## 快速开始

```bash
# 1. 克隆项目
git clone git@github.com:OrangeK1NG-714/SM-monorepo.git
cd SM-monorepo

# 2. 安装所有依赖
pnpm install

# 3. 一键启动所有服务（小程序 H5 + 管理后台 + 后端）
pnpm dev:all
```

启动后访问：
- 小程序 H5 版：http://localhost:9000
- 管理后台：http://localhost:8080
- 后端 API：http://localhost:7001

## 开发命令

### 单独启动

```bash
pnpm dev:h5        # 小程序 H5 模式
pnpm dev:mp        # 小程序微信模式（需配合微信开发者工具）
pnpm dev:admin     # 管理后台
pnpm dev:server    # 后端服务
```

### 构建

```bash
pnpm build:all     # 构建管理后台 + 小程序 H5
pnpm build:admin   # 仅构建管理后台
pnpm build:h5      # 仅构建小程序 H5
pnpm build:mp      # 构建微信小程序
```

### 后端进程管理

```bash
pnpm start:server  # 以守护进程启动后端（生产模式）
pnpm stop:server   # 停止后端进程
```

### 代码规范

```bash
pnpm lint          # ESLint 检查（小程序）
pnpm lint:fix      # ESLint 自动修复
```

项目配置了 husky + lint-staged + commitlint，提交代码时会自动检查格式并校验 commit message 是否符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 项目结构

```
SM-monorepo/
├── apps/
│   ├── miniprogram/            # 微信小程序（UniApp）
│   │   ├── src/
│   │   │   ├── pages/          # 页面
│   │   │   │   ├── index/      #   首页
│   │   │   │   ├── login/      #   登录
│   │   │   │   ├── s_choose/   #   学生选导师
│   │   │   │   ├── t_choose/   #   导师选学生
│   │   │   │   ├── myStudent/  #   我的学生（导师端）
│   │   │   │   ├── myAmbition/ #   我的志愿（学生端）
│   │   │   │   ├── userMsg/    #   个人信息
│   │   │   │   └── resetPassword/ # 重置密码
│   │   │   ├── hooks/          # 组合式函数
│   │   │   ├── store/          # Pinia 状态管理
│   │   │   ├── interceptors/   # 请求拦截器
│   │   │   └── utils/          # 工具函数（HTTP 客户端等）
│   │   ├── env/                # 环境变量配置
│   │   └── vite.config.ts
│   │
│   ├── admin/                  # 管理后台
│   │   ├── src/
│   │   │   ├── views/          # 页面
│   │   │   │   ├── home/       #   首页仪表盘
│   │   │   │   ├── user-manage/#   用户管理
│   │   │   │   ├── activity/   #   活动管理
│   │   │   │   ├── volunteer/  #   志愿管理
│   │   │   │   └── center/     #   个人中心
│   │   │   ├── router/         # 路由 + 权限控制
│   │   │   ├── store/          # Vuex 状态管理
│   │   │   ├── components/     # 公共组件
│   │   │   └── util/           # Axios 封装等
│   │   └── vite.config.js
│   │
│   └── server/                 # 后端服务（Egg.js）
│       ├── app/
│       │   ├── controller/     # 控制器
│       │   ├── service/        # 业务逻辑层
│       │   ├── model/          # Mongoose 数据模型
│       │   ├── middleware/     # 中间件（JWT 认证）
│       │   ├── validate/       # 参数校验规则
│       │   ├── schedule/       # 定时任务
│       │   └── router.js       # 路由定义
│       └── config/             # Egg.js 配置
│
├── deploy/                     # 部署相关
│   ├── nginx.conf              # Nginx 配置模板
│   └── deploy.sh               # 一键部署脚本
├── patches/                    # pnpm 依赖补丁
├── package.json                # Monorepo 根配置
└── pnpm-workspace.yaml         # pnpm workspace 定义
```

## API 接口概览

后端基于 RESTful 风格，所有接口以 `/api` 为前缀，通过 JWT 进行身份认证。

### 用户模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/user/login` | 用户登录 | 公开 |
| POST | `/api/user/refreshToken` | 刷新 Token | 公开 |
| GET | `/api/user/detail` | 获取用户信息 | 登录 |

### 学生模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/user/writeMsg` | 填写学生信息 | 登录 |
| PUT | `/api/user/updateMsg` | 更新学生信息 | 登录 |
| GET | `/api/student/getMsg` | 查询学生信息 | 登录 |
| POST | `/api/student/selectTeacher` | 学生选导师 | 登录 |
| GET | `/api/student/getTeacherList` | 获取活动中导师列表 | 登录 |
| GET | `/api/student/isInActivity` | 检查学生是否在活动中 | 登录 |
| POST | `/api/student/uploadResume` | 上传简历 | 登录 |

### 导师模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/teacher/detail` | 获取导师信息 | 登录 |
| POST | `/api/teacher/selectStudent` | 导师选学生 | 登录 |
| DELETE | `/api/teacher/cancelSelect` | 取消选择学生 | 登录 |
| GET | `/api/teacher/getSelectList` | 查看已选学生 | 登录 |
| GET | `/api/teacher/isInActivity` | 检查导师是否在活动中 | 登录 |

### 管理员模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/admin/register` | 注册新用户 | 管理员 |
| POST | `/api/admin/addActivity` | 创建双选活动 | 管理员 |
| PUT | `/api/admin/updateActivity` | 修改活动 | 管理员 |
| DELETE | `/api/admin/deleteActivity` | 删除活动 | 管理员 |
| GET | `/api/admin/getUserList` | 查询所有用户 | 管理员 |
| POST | `/api/admin/resetPassword` | 重置用户密码 | 管理员 |
| POST | `/api/admin/addTeacherToActivity` | 添加导师到活动 | 管理员 |
| PUT | `/api/admin/configMaxSelectNum` | 配置导师最大可选学生数 | 管理员 |
| GET | `/api/admin/getSelectedList` | 查询志愿列表 | 管理员 |
| GET | `/api/admin/getFinalList` | 查询最终匹配结果 | 管理员 |

## 业务流程

```
管理员创建双选活动 → 添加导师到活动
        │
        ▼
学生登录 → 完善个人信息 → 查看导师列表 → 选择志愿（最多3个）
        │
        ▼
导师登录 → 查看选择自己的学生 → 确认/拒绝学生
        │
        ▼
管理员查看最终匹配结果 → 导出数据
```

## 部署（宝塔面板）

### 前置条件

在宝塔面板中安装：
- Nginx
- MongoDB
- Node.js >= 18（Node.js 版本管理器）
- PM2 管理器

### 部署步骤

**1. 上传代码到服务器**

```bash
cd /www/wwwroot
git clone git@github.com:OrangeK1NG-714/SM-monorepo.git sm-doubleassistant
cd sm-doubleassistant
```

**2. 一键部署**

```bash
bash deploy/deploy.sh
```

该脚本会自动完成：安装依赖 → 构建管理后台 → 启动后端服务。

**3. 配置 Nginx**

在宝塔面板中创建网站，将 `deploy/nginx.conf` 的内容合并到网站配置中：

```nginx
# 管理后台静态文件
location / {
    root /www/wwwroot/sm-doubleassistant/apps/admin/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}

# API 反向代理
location /api {
    proxy_pass http://127.0.0.1:7001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# 教师简历文件访问
location /public {
    proxy_pass http://127.0.0.1:7001;
    proxy_set_header Host $host;
}
```

**4. 后续更新**

```bash
cd /www/wwwroot/sm-doubleassistant
git pull
bash deploy/deploy.sh
```

### 微信小程序发布

小程序通过微信开发者工具上传，不需要部署到服务器：

```bash
pnpm build:mp
```

构建产物在 `apps/miniprogram/dist/build/mp-weixin/`，用微信开发者工具打开该目录并上传即可。

## 使用 pnpm --filter 操作单个项目

```bash
pnpm --filter miniprogram <script>  # 操作小程序
pnpm --filter admin <script>        # 操作管理后台
pnpm --filter server <script>       # 操作后端
```

## License

MIT
