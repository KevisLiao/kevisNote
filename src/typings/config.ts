import type { SitemapOptions } from '@astrojs/sitemap';

export const languages = ['zh-CN', 'en-US'] as const;
export type LangType = (typeof languages)[number];

/** Route locale codes used as URL prefixes (`/zh`, `/en`, ...) */
export const localeCodes = ['zh', 'en'] as const;
export type LocaleCode = (typeof localeCodes)[number];

export interface I18nConfig {
  /** Default locale; also the human source language for auto-translation */
  defaultLocale: LocaleCode;
  /** All routable locales (each gets a URL prefix) */
  locales: LocaleCode[];
}

export const theme = ['auto', 'light', 'dark'] as const;
/** Theme mode */
export type ThemeMode = (typeof theme)[number];
export interface ThemeOptions {
  /** Mode */
  mode: ThemeMode;
  /** Whether to allow user to change theme */
  enableUserChange?: boolean;
}

/** 社交链接配置 */
export interface SocialLink {
  icon: SocialLinkIcon;
  link: string;
  ariaLabel?: string;
}

type SocialLinkIcon =
  | 'dribbble'
  | 'facebook'
  | 'figma'
  | 'github'
  | 'instagram'
  | 'link'
  | 'mail'
  | 'notion'
  | 'rss'
  | 'threads'
  | 'x'
  | 'youtube'
  | { svg: string };

export interface SlateConfig {
  /** Final deployment link */
  site: string;
  /** Language */
  lang?: LangType;
  /** Multilingual routing configuration (defaulted by `defineConfig`) */
  i18n: I18nConfig;
  /** Theme */
  theme?: ThemeOptions;
  /** Avatar */
  avatar?: string;
  /** Sitemap configuration */
  sitemap?: SitemapOptions;
  /** Website title */
  title: string;
  /** Website description */
  description: string;
  /** Whether to show reading time */
  readTime?: boolean;
  /** Whether to show last modified time */
  lastModified?: boolean;
  /** Docsearch configuration */
  algolia?: {
    appId: string;
    apiKey: string;
    indexName: string;
  };
  /** Website footer configuration */
  footer?: {
    copyright: string;
  };
  /** Follow subscription authentication configuration */
  follow?: {
    feedId: string;
    userId: string;
  };
  /** 社交链接 */
  socialLinks?: SocialLink[];
}
