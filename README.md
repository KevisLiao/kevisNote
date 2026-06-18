# Kevis's Note

English · [中文](./README-zh_CN.md)

> Reflections on technology through a humanist lens · <https://note.kevisliao.com>

A personal blog built on [Astro](https://astro.build/). On top of the [Slate](https://github.com/SlateDesign/slate-blog) theme, it adds a custom **multilingual routing + build-free AI auto-translation** system (Chinese as the source language, English as the translation, Japanese reserved).

---

## Tech stack

- **Astro 5** + React + TypeScript
- **Tailwind CSS v4** + `@radix-ui/colors`
- Content: Markdown / MDX (Content Collections, glob loader)
- Code highlighting: `astro-expressive-code`; math: KaTeX (`remark-math` + `rehype-katex`)
- Deploy: **Cloudflare Pages** (the `/` language redirect uses a Pages Function)
- Auto-translation: **Google Gemini** (free tier, `@google/genai`)

## Getting started

```bash
npm install
npm run dev        # local dev (no translation)
npm run build      # build (no translation; serves the translations already in the repo)
npm run preview    # preview the build output
npm run lint       # tsc + eslint + astro check
npm run translate  # manually generate/update AI translations (see below)
```

Requires Node ≥ 18.

---

## Multilingual & auto-translation

This is the main customization over the base theme.

### Content model

Each article is a **folder** — the folder name is the English slug, and the locale is the filename:

```
src/content/post/
  product-thinking-macbook-neo/
    zh.md          # human source (Chinese, always present)
    en.md          # human English version (optional, highest priority)
    en.auto.md     # AI translation (committed to the repo)
```

- **slug = folder name**, **locale = filename**; no `slug`/`lang` needed in frontmatter (derived from the path).
- Resolution order: **human `<locale>.md` > AI `<locale>.auto.md` > Chinese-source fallback**. See [`src/helpers/posts.ts`](src/helpers/posts.ts).
- AI-translated pages show a "machine translated" notice banner; adding a human `<locale>.md` makes it disappear.

### Routing

- All locales are prefixed: `/zh/...`, `/en/...`.
- The root `/` redirects by browser language: in production via a Cloudflare Pages Function ([`functions/index.ts`](functions/index.ts), reading `Accept-Language`); in local dev via the `navigator.language` fallback in [`src/pages/index.astro`](src/pages/index.astro).
- Locales are configured in [`slate.config.ts`](slate.config.ts) (`i18n`), and Astro i18n is enabled in [`astro.config.mjs`](astro.config.mjs).
- UI strings live in [`src/i18n/lang/`](src/i18n/lang/), resolved per locale via `getTranslations(locale)`. hreflang / canonical / per-locale RSS (`/<lang>/rss.xml`) / sitemap i18n are all wired up.

### Translation workflow (manual — not run at build time)

To avoid spending translation quota on every Cloudflare build, **translation runs locally only**, and the output is committed to the repo:

```bash
npm run translate
```

- Script: [`scripts/translate.mjs`](scripts/translate.mjs). Source language is `zh`; it generates `<locale>.auto.md` for every target locale that lacks a human translation.
- Gemini is an LLM that understands Markdown: the whole file is translated in one shot, preserving frontmatter / code / links / structure (only prose and `title`/`description` are translated). Frontmatter is rebuilt from the source as a template to avoid emitting invalid YAML.
- Cached by **source-content hash** under `.translations/` (gitignored), so unchanged posts are not re-translated.
- Requires `GEMINI_API_KEY` (see "Deployment"). When unset it skips silently, leaving existing translations in place.

### Writing a new post

1. Create `src/content/post/<english-slug>/zh.md` with frontmatter and body.
2. Run `npm run translate` locally to generate `en.auto.md`.
3. Commit everything (including the `.auto.md`).
4. (Optional) For a high-quality human English version, write `en.md` to override.

> Changing the slug of a published article breaks links — add a 301 in [`public/_redirects`](public/_redirects).

---

## Directory structure

```
functions/            # Cloudflare Pages Functions (/ language redirect)
plugins/              # custom remark/rehype plugins (reading time, modified time, ...)
scripts/              # translate.mjs and other scripts
public/               # static assets, _redirects
src/
  ├── assets/         # images, styles, SVG icons
  ├── components/     # components (layouts, TOC, theme switch, search, ...)
  ├── content/        # Content Collections (post folders + config.ts)
  ├── helpers/        # post resolution, config, utils
  ├── i18n/           # UI string dictionaries + getTranslations
  ├── pages/          # localized pages under [lang]/ + root redirect
  └── typings/        # type definitions
slate.config.ts       # site configuration
```

## Site configuration (`slate.config.ts`)

| Field | Description | Type |
| --- | --- | --- |
| `site` | Deployed site URL | `string` |
| `title` | Site title (brand name, not translated) | `string` |
| `i18n` | Multilingual configuration | `{ defaultLocale: 'zh', locales: ['zh','en'] }` |
| `avatar` | Avatar | `string` |
| `theme` | Theme mode | `{ mode: 'auto' \| 'light' \| 'dark', enableUserChange: boolean }` |
| `sitemap` | Sitemap config (with i18n) | [SitemapOptions](https://docs.astro.build/en/guides/integrations-guide/sitemap/) |
| `readTime` | Show reading time | `boolean` |
| `lastModified` | Show last modified time | `boolean` |
| `footer` | Footer | `{ copyright: string }` |
| `socialLinks` | Social links | `SocialLink[]` |

> The site subtitle/description switches by locale and is hardcoded as `site.description` in [`src/i18n/lang/`](src/i18n/lang/) — **not** auto-translated at build.

## Article frontmatter

| Field | Description | Type | Required |
| --- | --- | --- | --- |
| `title` | Title | `string` | Yes |
| `description` | Description | `string` | No |
| `tags` | Tags | `string[]` | No |
| `draft` | Draft (local-only; non-drafts require `pubDate`) | `boolean` | No |
| `pubDate` | Publish date | `date` | Required when `draft` is false |

Full definition in [`src/content/config.ts`](src/content/config.ts).

## Markdown extensions

Beyond standard Markdown:

- Container syntax: `:::info ... :::`
- LaTeX: inline `$E = mc^2$`, block `$$ E = mc^2 $$`
- Image captions: `![caption](image-url)` renders as a figure caption
- Code groups, emoji, code import, etc. (see the remark/rehype config in [`astro.config.mjs`](astro.config.mjs))

---

## Deployment (Cloudflare Pages)

1. Connect the repo; framework preset Astro, build command `npm run build`, output directory `dist`.
2. Environment variables:
   - `NODE_VERSION` = `22` (to be safe)
   - `GEMINI_API_KEY` — **only needed for local manual translation**; the build doesn't translate, so it can be omitted here.
3. The `/` language redirect is handled at the edge by `functions/index.ts`; no extra config needed.

The key used for local translation goes in `.env` (gitignored):

```bash
GEMINI_API_KEY=your_key   # free key at https://aistudio.google.com/apikey
```

---

## Credits

Built on the [Slate](https://github.com/SlateDesign/slate-blog) theme (MIT), extended with multilingual support and auto-translation.
