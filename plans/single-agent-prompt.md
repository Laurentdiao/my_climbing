# 可直接交给单个 Agent 的 Prompt

你将在 `/Users/weilidiao/Desktop/climbing` 从零实现一个静态个人攀岩记录网站。请完整执行，不要只给方案。

先阅读这些文档：

- `docs/PRODUCT-CAPABILITY.md`
- `docs/ARCHITECTURE.md`
- `docs/PLATFORM-DECISION.md`
- `plans/climbing-record-implementation-blueprint.md`

关键约束：

- 必须使用 Git 管理版本。如果当前目录不是 Git 仓库，第一步运行 `git init`。
- 每完成一个稳定阶段做一次 commit，commit message 要清楚。
- 使用 GitHub Pages 部署静态站点。
- 不租服务器，不备案，不接数据库，不做登录，不接 Supabase。
- 第一版不上传视频、不压缩视频、不存视频文件，只记录小红书或其他外部视频链接。
- 不要提交任何视频文件、大图片、密钥、token 或 `.env`。
- 数据来自仓库里的 JSON 文件，统计必须按 `quantity` 聚合，而不是只数记录行数。
- 手机优先，公开页面要像个人攀岩主页，不要做营销落地页。

技术栈建议：

- Vite + React + TypeScript
- Tailwind CSS
- Zod
- Vitest
- Recharts 或轻量图表库
- GitHub Actions for GitHub Pages

请按 `plans/climbing-record-implementation-blueprint.md` 的 T0-T5 顺序执行：

1. 初始化项目和 Git。
2. 建立 `src/data/climbing-log.json`、类型、Zod schema 和 `npm run validate:data`。
3. 实现领域统计逻辑和测试。
4. 实现主页、时间线、场次详情、统计页和移动端 UI。
5. 配置 GitHub Pages 部署并完善 README。
6. 运行 `npm run validate:data`、`npm run test`、`npm run build`。
7. 最后汇报完成内容、验证结果、Git commit 列表，以及用户如何更新记录和部署。

验收标准：

- 本地能运行。
- `npm run build` 通过。
- `npm run test` 通过。
- `npm run validate:data` 通过。
- 移动端布局无明显文字溢出。
- 没有视频文件进入仓库。
- README 能指导用户把网站发布到 GitHub Pages，并指导如何新增攀岩记录。

