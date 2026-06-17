/*
 * @file Multilingual post resolution helpers.
 *
 * Articles live under `src/content/post/<slug>/<locale>.md` (human) with optional
 * `<slug>/<locale>.auto.md` AI fallbacks. The glob loader exposes each variant as a
 * separate collection entry whose `id` is `<slug>/<locale>` or `<slug>/<locale>.auto`.
 * These helpers parse that id and resolve, per (slug, locale), which variant to serve:
 *   human (`.md`)  >  auto (`.auto.md`)  >  source-locale fallback.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import slateConfig from '~@/slate.config';
import type { LocaleCode } from '@/typings/config';

type PostEntry = CollectionEntry<'post'>;

export interface ParsedEntryId {
  slug: string;
  locale: string;
  isAuto: boolean;
}

export interface ResolvedPost {
  slug: string;
  locale: LocaleCode;
  entry: PostEntry;
  /** True when the served variant is an AI-generated `.auto.md` file */
  isAuto: boolean;
  /** True when no variant exists for this locale and the source locale is served */
  isFallback: boolean;
}

export const i18nConfig = slateConfig.i18n ?? {
  defaultLocale: 'zh' as LocaleCode,
  locales: ['zh'] as LocaleCode[],
};

export const sourceLocale: LocaleCode = i18nConfig.defaultLocale;

/** Parse a collection entry id like `my-slug/en.auto` → { slug, locale, isAuto }. */
export function parseEntryId(id: string): ParsedEntryId {
  const lastSlash = id.lastIndexOf('/');
  const slug = id.slice(0, lastSlash);
  const localePart = id.slice(lastSlash + 1);
  const isAuto = localePart.endsWith('.auto');
  const locale = isAuto ? localePart.slice(0, -'.auto'.length) : localePart;
  return { slug, locale, isAuto };
}

interface Variants {
  human?: PostEntry;
  auto?: PostEntry;
}
type PostIndex = Map<string, Map<string, Variants>>;

let cachedIndex: PostIndex | null = null;

/** Build (and memoize) a slug → locale → {human, auto} index of all post variants. */
async function getIndex(): Promise<PostIndex> {
  if (cachedIndex) return cachedIndex;
  const entries = await getCollection('post');
  const index: PostIndex = new Map();
  for (const entry of entries) {
    const { slug, locale, isAuto } = parseEntryId(entry.id);
    if (!index.has(slug)) index.set(slug, new Map());
    const byLocale = index.get(slug)!;
    if (!byLocale.has(locale)) byLocale.set(locale, {});
    const variants = byLocale.get(locale)!;
    if (isAuto) variants.auto = entry;
    else variants.human = entry;
  }
  cachedIndex = index;
  return index;
}

function resolveFromVariants(
  byLocale: Map<string, Variants>,
  slug: string,
  locale: LocaleCode,
): ResolvedPost | null {
  const variant = byLocale.get(locale);
  if (variant?.human) {
    return { slug, locale, entry: variant.human, isAuto: false, isFallback: false };
  }
  if (variant?.auto) {
    return { slug, locale, entry: variant.auto, isAuto: true, isFallback: false };
  }
  // Fall back to the human source-locale version (transient before translations land).
  const source = byLocale.get(sourceLocale)?.human;
  if (source) {
    return { slug, locale, entry: source, isAuto: false, isFallback: true };
  }
  return null;
}

/** Resolve a single article in a given locale, or null if it has no source. */
export async function resolvePost(
  slug: string,
  locale: LocaleCode,
): Promise<ResolvedPost | null> {
  const index = await getIndex();
  const byLocale = index.get(slug);
  if (!byLocale) return null;
  return resolveFromVariants(byLocale, slug, locale);
}

const isVisible = (post: ResolvedPost) =>
  import.meta.env.DEV || post.entry.data.draft !== true;

/** All published articles resolved for `locale`, newest first. */
export async function getLocalizedPosts(locale: LocaleCode): Promise<ResolvedPost[]> {
  const index = await getIndex();
  const posts: ResolvedPost[] = [];
  for (const [slug, byLocale] of index) {
    const resolved = resolveFromVariants(byLocale, slug, locale);
    if (resolved && isVisible(resolved)) posts.push(resolved);
  }
  return posts.sort(
    (a, b) =>
      (b.entry.data.pubDate?.getTime() ?? 0) - (a.entry.data.pubDate?.getTime() ?? 0),
  );
}

/** getStaticPaths source: every (locale × article) combination that has content. */
export async function getPostPaths() {
  const paths: {
    params: { lang: LocaleCode; slug: string };
    props: ResolvedPost;
  }[] = [];
  for (const locale of i18nConfig.locales) {
    const posts = await getLocalizedPosts(locale);
    for (const post of posts) {
      paths.push({ params: { lang: locale, slug: post.slug }, props: post });
    }
  }
  return paths;
}
