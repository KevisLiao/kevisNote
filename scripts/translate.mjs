/*
 * Build-time auto-translation (Google Gemini, free tier).
 *
 * For every article folder under `src/content/post/<slug>/`, generates a
 * machine-translated `<locale>.auto.md` for each target locale that has no
 * human-authored `<locale>.md`. Source language is `zh`. Results are cached by
 * source-content hash under `.translations/cache/` so unchanged posts are not
 * re-translated. Generated `*.auto.md` files and the cache are gitignored.
 *
 * Gemini is an LLM that understands Markdown, so the whole file is translated
 * in one shot with a system instruction that preserves structure (only prose +
 * the `title`/`description` frontmatter values change).
 *
 * Skips silently (leaving any existing `.auto.md` in place) when
 * GEMINI_API_KEY is unset, so contributors without a key can still build.
 *
 * Keep LOCALES / SOURCE_LOCALE in sync with `slate.config.ts` → `i18n`.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POST_DIR = path.join(ROOT, 'src/content/post');
const CACHE_DIR = path.join(ROOT, '.translations/cache');

const SOURCE_LOCALE = 'zh';
const LOCALES = ['zh', 'en'];
const TARGET_LOCALES = LOCALES.filter((l) => l !== SOURCE_LOCALE);

const LANGUAGE_NAMES = { en: 'English', ja: 'Japanese' };

// gemini-2.5-flash is on the free tier; override with TRANSLATION_MODEL.
const MODEL = process.env.TRANSLATION_MODEL || 'gemini-2.5-flash';

const AUTO_SUFFIX = '.auto.md';

/** Minimal .env loader so `GEMINI_API_KEY` in a gitignored .env is picked up. */
async function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const text = await fs.readFile(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

function systemPrompt(targetName) {
  return `You are a professional translator for a personal blog whose voice is reflective, humanist tech writing in Chinese. Translate the given Markdown file from Chinese into ${targetName}.

Output rules:
- Output ONLY the translated Markdown file. No commentary, and do NOT wrap the whole output in a code fence.
- Preserve the YAML frontmatter block (between the leading and trailing \`---\`) exactly, EXCEPT translate the values of \`title\` and \`description\` into ${targetName}. Keep every other key, date, boolean, and all \`tags\` values unchanged.
- Preserve all Markdown structure: headings, lists, blockquotes, tables, emphasis, footnotes.
- Do NOT translate or alter: fenced or inline code, URLs, link targets, image paths, HTML tags, or math ($...$). Leave product/brand names that are conventionally untranslated as-is.
- DO translate link text and image alt text.
- Keep the author's tone: thoughtful and precise, not marketing-speak. Render idioms naturally rather than literally.`;
}

/** Strip an accidental ```markdown ... ``` wrapper or leading preamble line. */
function unwrap(text) {
  let t = text.trim();
  const fence = t.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  if (fence) t = fence[1];
  return t.trimEnd() + '\n';
}

function splitFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fmRaw: '', body: md };
  return { fmRaw: m[1], body: md.slice(m[0].length) };
}

/** Read a frontmatter scalar value (quotes stripped), or null if absent. */
function getFmValue(fmRaw, key) {
  const m = fmRaw.match(new RegExp(`^${key}:[ \\t]*(.+)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^['"]/, '').replace(/['"]$/, '').trim();
}

/** Replace a frontmatter key's value, leaving the rest of the block untouched. */
function setFmValue(fmRaw, key, rawValue) {
  return fmRaw.replace(new RegExp(`^(${key}:)[ \\t]*.*$`, 'm'), `$1 ${rawValue}`);
}

async function withRetry(fn, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.code;
      const retryable = status === 429 || status === 503 || status === 500;
      if (!retryable || attempt >= tries) throw err;
      const waitMs = 2000 * attempt;
      console.warn(`[translate] ${status} — retrying in ${waitMs}ms (${attempt}/${tries - 1})`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

async function translateFile(ai, md, targetLocale) {
  const targetName = LANGUAGE_NAMES[targetLocale] ?? targetLocale;
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: md,
      config: {
        systemInstruction: systemPrompt(targetName),
        temperature: 0.3,
      },
    }),
  );
  const raw = response.text;
  if (!raw || !raw.trim()) {
    throw new Error('Empty translation from Gemini');
  }
  const out = unwrap(raw);

  // Trust the model for the BODY only. Rebuild the frontmatter from the source
  // as a template and substitute just the translated title/description (safely
  // quoted), so the model can't emit invalid YAML — e.g. an English title with
  // a colon, which YAML would read as a nested mapping.
  const src = splitFrontmatter(md);
  if (!src.fmRaw) return out; // source had no frontmatter — pass model output through

  const translated = splitFrontmatter(out);
  let fm = src.fmRaw;
  for (const key of ['title', 'description']) {
    if (getFmValue(src.fmRaw, key) == null) continue; // key absent in source
    const value = getFmValue(translated.fmRaw, key);
    if (value != null) fm = setFmValue(fm, key, JSON.stringify(value));
  }
  const body = translated.body || src.body;
  return (`---\n${fm}\n---\n` + body).trimEnd() + '\n';
}

async function listArticleSlugs() {
  const entries = await fs.readdir(POST_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function run() {
  await loadDotEnv();
  const authKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const ai = authKey ? new GoogleGenAI({ apiKey: authKey }) : null;
  if (!ai) {
    console.warn(
      '[translate] GEMINI_API_KEY not set — skipping translation; existing *.auto.md left as-is.',
    );
  }

  const slugs = await listArticleSlugs();
  let generated = 0;
  let cached = 0;

  for (const slug of slugs) {
    const dir = path.join(POST_DIR, slug);
    const sourcePath = path.join(dir, `${SOURCE_LOCALE}.md`);
    if (!existsSync(sourcePath)) {
      console.warn(`[translate] ${slug}: no ${SOURCE_LOCALE}.md source, skipping`);
      continue;
    }
    const sourceText = await fs.readFile(sourcePath, 'utf8');
    const hash = sha(sourceText);

    for (const locale of TARGET_LOCALES) {
      const humanPath = path.join(dir, `${locale}.md`);
      const autoPath = path.join(dir, `${locale}${AUTO_SUFFIX}`);

      // Human translation wins: drop any stale auto fallback and move on.
      if (existsSync(humanPath)) {
        if (existsSync(autoPath)) await fs.rm(autoPath);
        continue;
      }

      const cacheFile = path.join(CACHE_DIR, slug, `${locale}-${hash}.md`);
      if (existsSync(cacheFile)) {
        await fs.copyFile(cacheFile, autoPath);
        cached++;
        continue;
      }

      if (!ai) continue; // no key: can't generate, leave as-is

      console.log(`[translate] ${slug} → ${locale} (Gemini ${MODEL})`);
      const translated = await translateFile(ai, sourceText, locale);
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, translated);
      await fs.writeFile(autoPath, translated);
      // Drop older cache entries for this slug/locale (source content changed).
      const cacheSlugDir = path.join(CACHE_DIR, slug);
      for (const f of await fs.readdir(cacheSlugDir)) {
        if (f.startsWith(`${locale}-`) && f !== `${locale}-${hash}.md`) {
          await fs.rm(path.join(cacheSlugDir, f));
        }
      }
      generated++;
    }
  }

  // Sweep orphaned *.auto.md (article removed, locale dropped, or human added).
  for (const slug of slugs) {
    const dir = path.join(POST_DIR, slug);
    for (const f of await fs.readdir(dir)) {
      if (!f.endsWith(AUTO_SUFFIX)) continue;
      const locale = f.slice(0, -AUTO_SUFFIX.length);
      const orphaned =
        !TARGET_LOCALES.includes(locale) || existsSync(path.join(dir, `${locale}.md`));
      if (orphaned) await fs.rm(path.join(dir, f));
    }
  }

  console.log(
    `[translate] done — ${generated} generated, ${cached} from cache, ${slugs.length} articles.`,
  );
}

run().catch((err) => {
  console.error('[translate] failed:', err);
  process.exit(1);
});
