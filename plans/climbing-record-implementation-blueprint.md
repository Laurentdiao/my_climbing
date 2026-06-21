# 攀岩记录工具单 Agent 实施蓝图

**日期**: 2026-06-21
**状态**: ready-for-single-agent
**目标部署**: GitHub Pages
**核心约束**: 不租服务器、不备案、不上传视频、用 Git 管理数据。

## 总目标

从零实现一个手机优先的静态个人攀岩记录网站。数据来自仓库中的 JSON 文件，网站自动展示个人主页、训练时间线、场次详情、外部视频链接和统计图。第一版部署到 GitHub Pages，不使用数据库、登录系统、云存储或服务端函数。

## 执行要求

- 必须使用 Git 管理版本。
- 如果当前目录不是 Git 仓库，第一步运行 `git init`。
- 每完成一个稳定阶段就提交一次 Git commit。
- 不要提交视频文件、大图片、密钥、token 或 `.env`。
- 先读：
  - `docs/PRODUCT-CAPABILITY.md`
  - `docs/ARCHITECTURE.md`
  - `docs/PLATFORM-DECISION.md`

## 推荐技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Zod
- Vitest
- Recharts 或其他轻量图表库
- GitHub Actions

## 任务顺序

### T0 初始化项目和 Git

目标：建立可运行的前端项目和版本管理基础。

任务：

- 如果没有 `.git`，执行 `git init`。
- 初始化 Vite + React + TypeScript。
- 配置 Tailwind CSS。
- 配置 ESLint/Prettier 或项目默认 lint。
- 安装 Zod、Vitest、图表库。
- 添加 `.gitignore`，排除 `node_modules`、`dist`、本地临时文件、视频文件格式。
- 添加 README，说明本地开发和部署方式。
- 首次提交：`chore: initialize static climbing log app`。

验证：

```bash
npm run build
npm run test
git status --short
```

### T1 数据模型和示例数据

目标：建立静态数据文件和校验规则。

任务：

- 创建 `src/data/climbing-log.json`。
- 创建 TypeScript 类型和 Zod schema。
- 创建数据校验脚本 `scripts/validate-data.ts`。
- 添加 npm script：`validate:data`。
- 写 3-5 条示例训练数据，包含不同岩馆、难度、结果、quantity 和小红书链接示例。
- 提交：`feat: add climbing data model and validation`。

验证：

```bash
npm run validate:data
npm run test
```

### T2 领域统计逻辑

目标：把统计和业务规则从 UI 中独立出来。

任务：

- 实现 `stats.ts`：总场次、总线路数、完成率、最高完成难度、月度趋势、岩馆分布、难度分布。
- 实现 `grade.ts`：难度排序和展示 helper。
- 实现 `staticDataRepository.ts`。
- 编写 Vitest 单元测试，重点检查 `quantity` 聚合。
- 提交：`feat: add climbing stats domain logic`。

验证：

```bash
npm run test
npm run validate:data
```

### T3 页面和移动端 UI

目标：完成主要浏览体验。

任务：

- 实现全局布局、导航和响应式主题。
- 实现 `/` 个人主页。
- 实现 `/sessions` 时间线和筛选。
- 实现 `/sessions/:sessionId` 场次详情。
- 实现 `/stats` 统计页。
- 实现组件：SessionCard、SessionDetail、StatsPanel、GradePill、VideoLink、GymFilter。
- 视频链接只作为外部打开按钮，不做 iframe 嵌入。
- 提交：`feat: build static climbing log UI`。

验证：

```bash
npm run build
npm run test
```

### T4 GitHub Pages 部署

目标：让项目可自动发布到 GitHub Pages。

任务：

- 配置 `vite.config.ts` 的 `base`，并在 README 说明如何设置。
- 添加 GitHub Actions workflow，build 后发布 Pages artifact。
- README 增加：如何创建 GitHub 仓库、push、开启 Pages、如何更新数据。
- 添加 `.nojekyll` 如需要。
- 提交：`ci: deploy static site to github pages`。

验证：

```bash
npm run build
```

### T5 收尾验收

目标：确保单个 agent 交付的是完整可用项目。

任务：

- 检查移动端 375px 宽度页面无明显溢出。
- 检查无视频文件进入仓库。
- 检查公开数据中没有明显隐私字段。
- 检查 README 足够让用户更新记录。
- 运行全部验证命令。
- 最终提交：`chore: final verification for climbing log mvp`。

验证：

```bash
npm run validate:data
npm run test
npm run build
git status --short
```

## 数据更新方式

第一版更新记录的标准流程：

1. 编辑 `src/data/climbing-log.json`。
2. 运行 `npm run validate:data`。
3. 运行 `npm run build`。
4. Git commit。
5. Push 到 GitHub，GitHub Actions 自动发布。

## 明确不做

- 不做视频上传。
- 不做视频压缩。
- 不接 Supabase。
- 不接数据库。
- 不做登录。
- 不做后台在线编辑。
- 不租服务器。
- 不配置大陆 CDN。

## 可选加分项

在核心功能完成后，如仍有时间，可以增加 `/editor` 本地辅助编辑器：

- 表单录入记录。
- 保存到 localStorage。
- 导出符合 schema 的 JSON。
- 明确提示它不会在线发布，仍需用户手动提交 Git。

不要为了这个加分项影响 MVP 完成度。

