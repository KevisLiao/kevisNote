# note.kevisliao.com · 迭代任务清单

> 本清单基于《功能完善需求清单》整理，并与**当前代码实际状态**做了对账。
> 重要前提：仓库已远超原文档假设的「能跑的基础博客」。原文档把很多项当作"待做"，
> 但代码里其实已经实现（英文 slug、301 重定向、中英 i18n、AI 自动翻译兜底、
> 站内搜索、分享按钮、暗色模式、RSS、sitemap、JSON-LD）。
>
> 因此本清单只把**真正还没做 / 只做了一半 / 与文档方案有出入需要决策**的事项列为任务。
>
> 对账日期：2026-06-18

---

## 一、已完成（文档列为待做，但代码已实现）

| 文档条目 | 实际状态 | 说明 |
|---|---|---|
| P0-1 英文 slug | ✅ 已完成 | 文章目录即英文 slug（`src/content/post/<slug>/`）；路由 `/[lang]/blog/[slug]` |
| P0-1 旧链 301 | ✅ 已完成 | `public/_redirects` 已对 5 篇中文旧 URL 配 301 → `/zh/...` |
| P0-2 description 渲染 | ✅ 基建已完成 | `[slug].astro` 与 `HeadMeta.astro` 已渲染 description / og / twitter（**但正文 frontmatter 尚未填**，见任务 1） |
| P0-5 Sitemap | ✅ 已集成 | `@astrojs/sitemap` 已配置（含 i18n）；提交 GSC 为站外手动动作（见任务 4） |
| P1-7 站内搜索 | ✅ 已实现（技术不同） | 用的是 Algolia DocSearch（`src/components/search`），非文档建议的 Pagefind（见决策 A） |
| P2 多语言路由 | ✅ 已完成 | Astro i18n，中(默认)/英，`prefixDefaultLocale: true`；边缘按 Accept-Language 重定向 |
| P2 自动翻译兜底 | ✅ 已实现（方案不同） | `scripts/translate.mjs` 用 Gemini（非 DeepL），按源文 hash 缓存；解析优先级 人工 `.md` > `.auto.md` > 源语言兜底（见决策 B） |
| 社交-9 分享按钮 | ✅ 部分完成 | 已有 X / Facebook / LinkedIn / Threads / 复制链接 / 邮件（**缺 LINE、微信**，见任务 6） |
| 贯穿 暗色模式 | ✅ 已有组件 | `src/components/theme-select`（需回归验证三端表现，见任务 9） |
| RSS / JSON-LD | ✅ 已完成 | `[lang]/rss.xml.js`、`components/json-ld/*` |

---

## 二、待办任务（按建议落地顺序）

### 任务 1 — 回填文章 description【P0｜内容｜成本低】
- **现状**：渲染管线已就绪，但 5 篇文章的 `zh.md` frontmatter **均无 `description`**。
- **做法**：为每篇手写 1–2 句中文 description；英文版同步（人工版或重跑翻译）。
- **验收**：列表页 / `<head>` meta / og:description 都有内容；分享卡片不再空白。
- **涉及**：`src/content/post/*/zh.md`（5 篇）、`*/en*.md`。

### 任务 2 — About 页面【P0】
- **现状**：❌ 无 `/about`。
- **做法**：新增 `/[lang]/about` 静态页：自我介绍、写作方向（人文主义视角下的科技思辨）、社交链接。
- **顺带**：`slate.config.ts` 里 `socialLinks` 目前被注释掉 → 取消注释并填真实链接，About / Footer 复用。
- **验收**：中英两版可访问，导航有入口。

### 任务 3 — 首页分页【P0/P1】
- **现状**：❌ `[lang]/index.astro` 经 `PostList` 一次性渲染全部文章（仅客户端排序）。
- **做法**：文章量小，先不急；超过 ~10 篇时用 Astro `paginate()` 出 `/page/2`，或加「加载更多」。
- **验收**：每页 8–10 篇，分页链接对 i18n 前缀正确。

### 任务 4 — 提交 Google Search Console【P0｜站外手动】
- **现状**：sitemap 已生效，GSC 未确认。
- **做法**：验证站点所有权 → 提交 `/sitemap-index.xml`。
- **验收**：GSC 收录无误。（此项 Claude 无法代办，需人工在控制台操作。）

### 任务 5 — 标签 / 分类系统【P1】
- **现状**：frontmatter 已有 `tags`（schema 支持，文章已打标），但 ❌ **无 `/tags` 与 `/tags/[tag]` 路由**，导航也无入口。
- **做法**：新增 `/[lang]/tags` 与 `/[lang]/tags/[tag]`；顶部或侧边暴露入口；标签需考虑 i18n（同一标签跨语言展示）。
- **验收**：点击标签可筛选；与现有 i18n 解析（`helpers/posts.ts`）兼容。

### 任务 6 — 补全分享渠道：LINE、微信【P1｜社交】
- **现状**：分享组件已有 X/FB/LinkedIn/Threads/复制/邮件，缺文档点名的 **LINE（日本场景）** 与 **微信复制链接**。
- **做法**：在 `src/components/share/index.tsx` 的 `targets` 增加 LINE（`https://social-plugins.line.me/lineit/share?url=`）；微信走「复制链接 + 提示在微信内打开」。
- **验收**：移动端可唤起对应渠道。

### 任务 7 — Giscus 评论【P1】
- **现状**：❌ 未接入。
- **做法**：开启仓库 GitHub Discussions → 配 Giscus → 文章页底部插入组件；主题随站点暗色模式联动；语言跟随 locale。
- **验收**：文章底部可评论，暗色模式不割裂。

### 任务 8 — OG Image 自动生成（Satori）【P2｜社交】
- **现状**：仅有静态 `public/og_image.png`，所有文章共用；❌ 无逐篇生成。
- **做法**：构建期用 Satori 按「标题 + 站名 + 配色」生成每篇卡片图，`HeadMeta` 注入对应 `og:image`。
- **验收**：各文章分享卡片显示自己的标题图。

### 任务 9 — 样式与暗色模式贯穿打磨【贯穿】
- **现状**：暗色组件已存在；需系统性回归。
- **做法**：排版 / 字体 / 配色 / 间距统一；移动端适配；暗色模式逐页检查（含 Giscus、搜索弹窗、分享）；头像 `alt` 当前为 `Kevis's Note`，可改更具体描述。
- **验收**：三端 + 明暗两态视觉一致。

### 任务 10 — 正文图片优化管线【P2｜社交-11】
- **现状**：装了 `sharp`，但未确认正文走 Astro `<Image />` 优化。
- **做法**：正文图片走优化管线（自动 WebP），补 `alt`，注意 CLS。
- **验收**：图片输出 WebP，无明显布局抖动。

### 任务 11 — 日语（ja）上线【P2｜多语言收尾】
- **现状**：i18n 框架与翻译脚本已含 `ja` 语言名映射，但 `slate.config.ts` 的 `locales` 仅 `['zh','en']`，未启用。
- **做法**：确认中英人工版稳定后，`locales` 加 `ja`；翻译脚本 `LOCALES` 同步；i18n 文案补 `ja`；DeepL/Gemini 对日语质量做一次抽检。
- **依赖**：决策 B（翻译方案）先定。
- **验收**：`/ja/...` 可访问，AI 兜底版有「自动翻译」标注（见任务 12）。

### 任务 12 — 自动翻译版本标注核验【P2】
- **现状**：解析层已区分 `isAuto`，需确认页面**确实**显示「此版本由 AI 自动翻译」提示。
- **做法**：在文章页对 `isAuto`/`isFallback` 渲染醒目 banner（若已存在则仅核验文案与多语言）。
- **验收**：自动翻译页顶部有清晰提示，避免误导。

---

## 三、待决策项（需先拍板再开工）

### 决策 A — 搜索：保留 Algolia 还是换 Pagefind？
- 现状是 Algolia DocSearch（需外部账号/索引，依赖配置 `slateConfig.algolia`）。
- 文档倾向 Pagefind（构建期生成、零服务端、免费）。
- **建议**：若不想维护 Algolia 账号与索引同步，换 Pagefind 更省心；若 Algolia 已稳定可用则保留。**先定，再决定任务排期。**

### 决策 B — 翻译方案：维持现状 vs 文档建议
- 现状：`translate.mjs` 用 **Gemini**，**手动跑**（不进 build），结果 **commit 回仓库**，按 hash 缓存。
- 文档建议：用 **DeepL**（日语质量优先），**构建期即时生成、不回写仓库**（结果进 `dist`/缓存）。
- **取舍**：现状方案简单、git 历史可见、不烧每次构建额度，但翻译文件入库；文档方案仓库更干净但构建更复杂、需密钥进 CI。
- **建议**：中英阶段维持现状（已跑通）；上日语前再评估是否切 DeepL（日语质量）。**这是一处实质偏离原文档，需确认是否接受。**

### 决策 C — 默认语言前缀策略
- 现状 `prefixDefaultLocale: true`（中文也带 `/zh/`），边缘按 Accept-Language 重定向。文档提醒「先定一种，别中途换」。
- **建议**：保持现状（已上线、已配旧链 301），不再变更，避免再次断链。

---

## 四、建议执行顺序（逐个 PR）

1. 任务 1 description 回填 + 任务 2 About + socialLinks（一个 PR 把分享/介绍体验补齐）
2. 任务 4 GSC 提交（人工）
3. 任务 5 tags 系统
4. 任务 6 分享渠道补全（LINE/微信）
5. 任务 7 Giscus
6. 决策 A 定调后处理搜索（保留或换 Pagefind）
7. 任务 8 OG Image (Satori) + 任务 10 图片管线
8. 任务 3 分页（文章量到阈值再做）
9. 任务 11 日语 + 任务 12 标注核验（依赖决策 B）
10. 任务 9 样式 / 暗色 贯穿打磨
