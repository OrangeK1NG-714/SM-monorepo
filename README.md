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

## 修改简历上传

修复学生简历上传功能的 3 个 Bug，并统一环境配置管理。

### Bug 修复

1. **服务端未保存上传文件**：控制器从 `ctx.request.body.filePath` 读取的是客户端临时路径，实际文件在 `ctx.request.files[0]` 但没有被读取保存 → 已修复，文件正确保存到 `app/public/uploads/`
2. **学生简历不能更新**：已有简历时返回"简历已存在"而非覆盖 → 已修复，支持删除旧文件后更新
3. **管理后台老师简历上传 accept 包含 PDF 但 beforeUpload 拦截 PDF**：老师简历用 `<img>` 展示，不支持 PDF → `accept` 属性去掉 `.pdf`，与验证逻辑一致

### 环境配置统一

将 7 个文件中分散的 `const localhost = 'https://richardq.tech'` 提取到统一配置文件，切换环境只改一处。

**切换方式**：修改 `apps/miniprogram/src/config/index.ts`

```ts
// 本地开发
export const API_BASE_URL = 'http://localhost:7001'
// 生产部署
export const API_BASE_URL = 'https://richardq.tech'
```

管理后台头像 URL 从 `http://localhost:3000`（端口不对）改为相对路径，本地和生产都通过代理/Nginx 访问。

服务端 `config.default.js` 中 MongoDB、JWT Secret、CORS 三处加了"部署时需修改"注释。

### 涉及文件

| 层级 | 文件 | 改动 |
|------|------|------|
| Server | `app/controller/stdinfo.js` | 重写 `uploadResume`：从 `ctx.request.files` 读取文件并保存到磁盘 |
| Server | `app/service/stdinfo.js` | `uploadResume` 支持更新已有简历，删除旧文件 |
| Server | `config/config.default.js` | MongoDB / JWT / CORS 加部署注释 |
| Admin | `views/user-manage/userList.vue` | `accept` 去掉 `.pdf` |
| Admin | `components/upload/Upload.vue` | 头像 URL 去掉 `localhost:3000` 前缀 |
| Admin | `views/home/Home.vue` | 同上 |
| Admin | `views/center/Center.vue` | 同上 |
| 小程序 | `config/index.ts`（新建） | 统一 `API_BASE_URL` 常量 |
| 小程序 | `api/login.ts` | 引入 `API_BASE_URL` 替换硬编码 |
| 小程序 | `api/useraction.ts` | 同上 |
| 小程序 | `api/stdInfo.ts` | 同上 |
| 小程序 | `api/teaInfo.ts` | 同上 |
| 小程序 | `utils/http.ts` | 同上 |
| 小程序 | `pages/s_choose/index.vue` | 同上 |
| 小程序 | `pages/userMsg/index.vue` | 上传 URL 改为使用 `API_BASE_URL` |

## 修改中本位

实现"某位老师只允许被某专业（普通/中本）的学生选择"功能，同时修复已有 Bug。

### 新增功能

- **学生注册时选择专业类型**：学生填写信息表单新增"专业类型"必填项（普通 / 中本），存入 `student.data.major`
- **管理员配置老师专业限制**：
  - 添加老师时可勾选"允许选择的专业"（默认全选）
  - 活动用户管理中，老师行新增"设置专业限制"按钮，可随时修改
- **小程序按专业过滤老师**：学生进入选择页面时，只显示允许其专业选择的导师
- **服务端校验**：`selectTeacher` 接口增加专业匹配校验，防止绕过前端直接调接口

### Bug 修复

- **`selectTeacher` 时间校验**：`Date()` 未使用 `new` 导致返回字符串而非 Date 对象，且判断条件逻辑反转 → 已修正
- **移除死代码**：`s_choose/index.vue` 中 `isEight` 变量（学号倒数第5位判断中本）声明后从未使用 → 已移除，改为通过学生信息表中的 `major` 字段判断

### 兜底处理

- 已上线的老学生没有 `major` 字段 → 默认按"普通"处理
- 已上线的老老师没有 `allowedMajors` 字段 → 不过滤，对所有学生可见
- 前端和服务端双重兜底

### 涉及文件

| 层级 | 文件 | 改动 |
|------|------|------|
| Server | `app/model/teacher.js` | 新增 `allowedMajors` 字段 |
| Server | `app/service/stdinfo.js` | `writeUserMsg` 增加 `major`；修复时间 Bug；新增专业校验 |
| Server | `app/controller/stdinfo.js` | 提取 `major` 参数 |
| Server | `app/controller/userinfo.js` | 提取 `allowedMajors` 参数 |
| Server | `app/service/userinfo.js` | 注册时写入 `allowedMajors` |
| Server | `app/router.js` | 新增 `PUT /api/admin/updateTeacherAllowedMajors` |
| Server | `app/controller/admin.js` | 新增 `updateTeacherAllowedMajors` |
| Server | `app/service/admin.js` | 新增 `updateTeacherAllowedMajors` |
| Admin | `views/user-manage/addUser.vue` | 添加老师时增加专业限制复选框 |
| Admin | `views/activity/activityList.vue` | 活动用户管理增加"设置专业限制"按钮和弹窗 |
| 小程序 | `pages/userMsg/index.vue` | 表单增加"专业类型"选择 |
| 小程序 | `pages/s_choose/index.vue` | 移除 `isEight` 死代码；按专业过滤老师列表 |
| 小程序 | `api/stdInfo.ts` | 接口类型定义增加 `major` |

### 新增 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| PUT | `/api/admin/updateTeacherAllowedMajors` | 配置老师允许的专业 | 管理员 |

## 增加小程序端修改个人信息

学生首次登录后填写的个人信息原先无法修改，现在在小程序首页右上角增加编辑入口，学生可以随时修改已提交的个人信息。

### 改动说明

- **首页增加编辑按钮**：学生视角的首页右上角新增蓝色圆形编辑图标，点击进入修改个人信息页面
- **信息表单支持编辑模式**：`userMsg` 页面通过 `?mode=edit` 参数区分新建/编辑模式，编辑模式下自动加载已有信息并回填表单，学号字段不可修改
- **提交后返回首页**：编辑模式提交成功后返回上一页，新建模式仍跳转首页

### 涉及文件

| 层级 | 文件 | 改动 |
|------|------|------|
| 小程序 | `pages/index/index.vue` | 新增编辑按钮、`goEditProfile()` 方法及相关样式 |
| 小程序 | `pages/userMsg/index.vue` | 支持编辑模式：`onLoad` 获取已有数据回填表单，标题/按钮文字动态切换，学号禁止修改 |

## 交互 Bug 与兜底报错修复

全面修复服务端返回值不统一、空指针崩溃、前端 API 路径错误、缺少错误处理等问题，涉及约 20 个文件。

### 服务端：返回值统一 & 空值兜底

- **`service/admin.js`**：所有方法统一返回 `{ code, msg }` 格式，包裹 try-catch；新增 `deleteUser(id)` 和 `updateUser(id, username, role)` 方法
- **`service/stdinfo.js`**：`updateUserMsg` 增加学生不存在的 else 分支；`getStudentMsg` 返回 `{ code, msg, data }` 格式
- **`service/userinfo.js`**：`getUserDetail` 增加 data 为 null 时的兜底返回
- **`controller/admin.js`**：新增 `deleteUser`、`updateUser` 控制器方法
- **`controller/stdinfo.js`**：`getStudentMsg` 适配新的 service 返回格式
- **`model/activity.js`**：补充 `firstChooseCount`、`secondChooseCount`、`thirdChooseCount`、`stdChooseCount` 四个 Number 字段
- **`router.js`**：取消注释 `deleteUser` 路由；新增 `PUT /api/admin/updateUser` 路由

### 小程序：API 层 & 页面交互修复

- **`api/useraction.ts`**：移除 `import axios`，`getTeacherResume` 改用项目封装的 `http` 方法
- **`api/login.ts`**：6 个接口补全 `${API_BASE_URL}/api` 前缀；`getWxCode` fail 回调修复 `new Error(err)` → `new Error(err.errMsg || 'wx login failed')`
- **`pages/s_choose/index.vue`**：
  - `duplicates` 类型从 `ref()` 改为 `ref<number[]>([])`
  - v-for key 从 `:key="item.id"` 改为 `:key="item._id || item.teacherId"`（4 处）
  - `toggleSelect` 后同步更新 `currentTeacher` 引用
  - 取消选择时使用 filter 替代 splice 避免索引错乱
- **`pages/index/index.vue`**：
  - 活动分类：未来活动归入"进行中"列表
  - `Promise.all` → `Promise.allSettled`，防止单个接口失败导致全部失败
- **`pages/userMsg/index.vue`**：
  - 简历上传从 `uni.chooseImage` 改为 `uni.chooseMessageFile`（微信端）/ `uni.chooseFile`（其他端）
  - 上传请求 header 添加 Authorization token
- **`utils/http.ts`**：3 处 `uni.redirectTo` 添加 `isRedirectingToLogin` 守卫，防止多个 401 触发多次重定向

### 管理后台：路径修复 & 功能补全

- **`util/axios.config.js`**：恢复 401 响应拦截，自动清除 token 并跳转登录页
- **`views/activity/activityList.vue`**：
  - `saveAddUser` 补 `await` + try-catch
  - 4 处 API 路径补前导 `/`（`"api/admin/..."` → `"/api/admin/..."`）
  - `saveEdit`、`handleDelete` 包裹 try-catch + ElMessage.error
- **`views/user-manage/userList.vue`**：
  - `handleEdit` 从空实现改为回填表单数据并打开弹窗
  - `handleEditConfirm` 路径从 `/adminapi/user/list/` 改为 `/api/admin/updateUser`
  - `handleDelete` 路径从 `/adminapi/user/list/` 改为 `/api/admin/deleteUser`，添加 try-catch
  - `handleSelectAll` 全选去重：`[...new Set()]`（对象无效）→ 基于 `_id` 的 Map 去重
  - 角色 `options` 从数字值 (1, 2) 改为字符串值 ('admin', 'teacher', 'student')
- **`views/volunteer/selectVolunteerList.vue`**：移除编辑按钮和编辑弹窗及相关代码；`handleDelete` 添加 try-catch
- **`views/volunteer/finalVolunteerList.vue`**：移除编辑按钮和编辑弹窗及相关代码；`handleDelete` 路径从 `/adminapi/user/list/` 改为 `/api/admin/deleteSelected`，添加 try-catch
- **`util/formatTime.js`**：`moment()` → `moment(date)`，修复忽略传入参数的 Bug
- **`components/mainbox/TopHeader.vue`**：退出登录时增加 `store.commit("changeGetterRouter", false)`，重置动态路由状态
- **`views/center/Center.vue`**：角色显示从 `role === 1 ? "管理员" : "编辑"` 改为字符串角色匹配（admin/teacher/student）

### 涉及文件

| 模块 | 文件 | 改动 |
|------|------|------|
| Server | `service/admin.js` | 返回值统一 + 新增 deleteUser/updateUser |
| Server | `service/stdinfo.js` | 空值兜底 |
| Server | `service/userinfo.js` | 空值兜底 |
| Server | `controller/admin.js` | 新增 deleteUser/updateUser |
| Server | `controller/stdinfo.js` | 适配新返回格式 |
| Server | `model/activity.js` | 补 4 个 Number 字段 |
| Server | `router.js` | 取消注释 + 新增路由 |
| 小程序 | `api/useraction.ts` | 移除 axios |
| 小程序 | `api/login.ts` | URL 统一 + 错误处理 |
| 小程序 | `pages/s_choose/index.vue` | duplicates/key/state/priority |
| 小程序 | `pages/index/index.vue` | 分类 + allSettled |
| 小程序 | `pages/userMsg/index.vue` | PDF 上传修复 |
| 小程序 | `utils/http.ts` | 重定向守卫 |
| Admin | `util/axios.config.js` | 401 处理 |
| Admin | `views/activity/activityList.vue` | await + 路径 + try-catch |
| Admin | `views/user-manage/userList.vue` | 编辑/删除/去重/角色 |
| Admin | `views/volunteer/selectVolunteerList.vue` | 移除编辑 |
| Admin | `views/volunteer/finalVolunteerList.vue` | 移除编辑 + 删除路径 |
| Admin | `util/formatTime.js` | 修复 getTime |
| Admin | `components/mainbox/TopHeader.vue` | logout 重置路由 |
| Admin | `views/center/Center.vue` | 角色显示修复 |

### 新增 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| DELETE | `/api/admin/deleteUser` | 删除用户（同时清除关联的学生/教师记录）| 管理员 |
| PUT | `/api/admin/updateUser` | 修改用户信息（用户名、角色）| 管理员 |

## License

MIT
