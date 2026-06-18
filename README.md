# Kevis's Note

> 人文主义视角下的科技思辨 · <https://note.kevisliao.com>

一个基于 [Astro](https://astro.build/) 的个人博客。在 [Slate](https://github.com/SlateDesign/slate-blog) 主题基础上,扩展了一套**多语言路由 + 构建无关的 AI 自动翻译**体系(中文为源语言,英文为译文,日语预留)。

---

## 技术栈

- **Astro 5** + React + TypeScript
- **Tailwind CSS v4** + `@radix-ui/colors`
- 内容:Markdown / MDX(Content Collections,glob loader)
- 代码高亮:`astro-expressive-code`;数学公式:KaTeX(`remark-math` + `rehype-katex`)
- 部署:**Cloudflare Pages**(根路径语言重定向用 Pages Function)
- 自动翻译:**Google Gemini**(免费层,`@google/genai`)

## 快速开始

```bash
npm install
npm run dev        # 本地开发(不翻译)
npm run build      # 构建(不翻译,直接用仓库里已有的译文)
npm run preview    # 预览构建产物
npm run lint       # tsc + eslint + astro check
npm run translate  # 手动生成/更新 AI 译文(见下文)
```

要求 Node ≥ 18。

---

## 多语言与自动翻译

这是本项目相对原主题的核心改造。

### 内容结构

每篇文章是一个**目录**,目录名即英文 slug,语言用文件名区分:

```
src/content/post/
  product-thinking-macbook-neo/
    zh.md          # 人工源文(中文,必有)
    en.md          # 人工英文版(可选,优先级最高)
    en.auto.md     # AI 自动译文(已提交进仓库)
```

- **slug = 目录名**,**locale = 文件名**;无需在 frontmatter 写 slug/lang(由路径推导)。
- 解析优先级:**人工 `<locale>.md` > AI `<locale>.auto.md` > 中文源文回退**。逻辑见 [`src/helpers/posts.ts`](src/helpers/posts.ts)。
- AI 译文页面顶部会显示「机器翻译」提示横幅;一旦放入人工 `<locale>.md`,横幅自动消失。

### 路由

- 所有语言都带前缀:`/zh/...`、`/en/...`。
- 根路径 `/` 按浏览器语言重定向:生产环境走 Cloudflare Pages Function([`functions/index.ts`](functions/index.ts),读 `Accept-Language`),本地开发走 [`src/pages/index.astro`](src/pages/index.astro) 里的 `navigator.language` 兜底。
- 语言列表配置在 [`slate.config.ts`](slate.config.ts) 的 `i18n` 字段,Astro i18n 在 [`astro.config.mjs`](astro.config.mjs) 启用。
- UI 文案在 [`src/i18n/lang/`](src/i18n/lang/),通过 `getTranslations(locale)` 按语言取值;hreflang / canonical / 每语言 RSS(`/<lang>/rss.xml`)/ sitemap i18n 均已接入。

### 自动翻译流程(手动、不在构建期跑)

为避免每次 Cloudflare 构建都消耗翻译额度,**翻译只在本地手动运行**,产物提交进仓库:

```bash
npm run translate
```

- 脚本:[`scripts/translate.mjs`](scripts/translate.mjs)。源语言 `zh`,为每个缺少人工译文的目标语言生成 `<locale>.auto.md`。
- Gemini 是 LLM、原生懂 Markdown:整文件一次翻译,保留 frontmatter / 代码 / 链接 / 结构(只译正文与 `title`/`description`);frontmatter 用源文件做模板回填,避免生成非法 YAML。
- 按**源文内容哈希**缓存到 `.translations/`(gitignored),源文不变不会重复翻译。
- 需要 `GEMINI_API_KEY`(见「部署」)。未设置时静默跳过,保留已有译文。

### 写一篇新文章

1. 新建 `src/content/post/<english-slug>/zh.md`,写好 frontmatter 和正文。
2. 本地 `npm run translate` 生成 `en.auto.md`。
3. 一并提交(包含 `.auto.md`)。
4. (可选)想要某篇高质量人工英文版,手写 `en.md` 覆盖即可。

> 已上线文章若改 slug 会断链,记得在 [`public/_redirects`](public/_redirects) 加 301。

---

## 目录结构

```
functions/            # Cloudflare Pages Functions(/ 语言重定向)
plugins/              # 自定义 remark/rehype 插件(阅读时长、修改时间等)
scripts/              # translate.mjs 等脚本
public/               # 静态资源、_redirects
src/
  ├── assets/         # 图片、样式、SVG 图标
  ├── components/     # 组件(布局、TOC、主题切换、搜索等)
  ├── content/        # Content Collections(post 目录 + config.ts)
  ├── helpers/        # posts 解析、配置、工具
  ├── i18n/           # UI 文案字典 + getTranslations
  ├── pages/          # [lang]/ 下的本地化页面 + 根重定向
  └── typings/        # 类型定义
slate.config.ts       # 站点配置
```

## 站点配置(`slate.config.ts`)

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| `site` | 部署后的站点地址 | `string` |
| `title` | 站点标题(品牌名,不翻译) | `string` |
| `i18n` | 多语言配置 | `{ defaultLocale: 'zh', locales: ['zh','en'] }` |
| `avatar` | 头像 | `string` |
| `theme` | 主题模式 | `{ mode: 'auto' \| 'light' \| 'dark', enableUserChange: boolean }` |
| `sitemap` | sitemap 配置(含 i18n) | [SitemapOptions](https://docs.astro.build/en/guides/integrations-guide/sitemap/) |
| `readTime` | 显示阅读时长 | `boolean` |
| `lastModified` | 显示最后修改时间 | `boolean` |
| `footer` | 页脚 | `{ copyright: string }` |
| `socialLinks` | 社交链接 | `SocialLink[]` |

> 站点副标题/描述按语言切换,写死在 [`src/i18n/lang/`](src/i18n/lang/) 的 `site.description`,**不走构建翻译**。

## 文章 Frontmatter

| 字段 | 说明 | 类型 | 必填 |
| --- | --- | --- | --- |
| `title` | 标题 | `string` | 是 |
| `description` | 描述 | `string` | 否 |
| `tags` | 标签 | `string[]` | 否 |
| `draft` | 草稿(仅本地可见;非草稿必须有 `pubDate`) | `boolean` | 否 |
| `pubDate` | 发布日期 | `date` | `draft` 为 false 时必填 |

完整定义见 [`src/content/config.ts`](src/content/config.ts)。

## Markdown 扩展语法

标准 Markdown 之外还支持:

- 容器语法:`:::info ... :::`
- LaTeX:行内 `$E = mc^2$`,块级 `$$ E = mc^2 $$`
- 图片标题:`![图注](image-url)` 自动渲染为 figure caption
- 代码组、emoji、代码导入等(见 [`astro.config.mjs`](astro.config.mjs) 的 remark/rehype 配置)

---

## 部署(Cloudflare Pages)

1. 连接仓库,框架预设选 Astro,构建命令 `npm run build`,输出目录 `dist`。
2. 环境变量:
   - `NODE_VERSION` = `22`(保险起见)
   - `GEMINI_API_KEY` —— **仅本地手动翻译时需要**;构建不翻译,这里可不配。
3. `/` 的语言重定向由 `functions/index.ts` 在边缘处理,无需额外配置。

本地翻译用的 key 放在 `.env`(已 gitignore):

```bash
GEMINI_API_KEY=your_key   # https://aistudio.google.com/apikey 免费申请
```

---

## 致谢

基于 [Slate](https://github.com/SlateDesign/slate-blog) 主题(MIT)构建,在其之上做了多语言与自动翻译扩展。
