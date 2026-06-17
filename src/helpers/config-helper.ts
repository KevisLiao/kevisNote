/*
 * @file: Configuration handler
 */
import type { SlateConfig, ThemeOptions } from '@/typings/config';

/** Default configuration */
const defaultConfig: Partial<SlateConfig> = {
  lang: 'zh-CN',
  theme: {
    mode: 'auto',
    enableUserChange: true,
  },
  readTime: false,
  lastModified: false,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh'],
  },
};

/** Input config; i18n is optional here and defaulted below. */
type SlateConfigInput = Omit<SlateConfig, 'i18n'> & Partial<Pick<SlateConfig, 'i18n'>>;

export function defineConfig(config: SlateConfigInput): SlateConfig {
  const mergedConfig: Partial<SlateConfig> = {};

  if (typeof config.theme === 'string') {
    mergedConfig.theme = {
      ...(defaultConfig.theme as ThemeOptions),
      mode: config.theme,
    };
  } else {
    mergedConfig.theme = {
      ...(defaultConfig.theme as ThemeOptions),
      ...config.theme,
    };
  }

  return Object.assign({}, defaultConfig, config, mergedConfig) as SlateConfig;
}
