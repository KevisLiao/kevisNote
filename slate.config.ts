/*
 * @file Theme configuration
 */
import { defineConfig } from './src/helpers/config-helper';

export default defineConfig({
  lang: 'en-US',
  site: 'https://note.kevisliao.com',
  avatar: '/avatar.png',
  title: 'Kevis\'s Note',
  description: '人文主义视角下的科技思辨',
  lastModified: true,
  readTime: true,
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
  },
  sitemap: {
    i18n: {
      defaultLocale: 'zh',
      locales: {
        zh: 'zh-CN',
        en: 'en',
      },
    },
  },
  footer: {
    copyright: '© 2026 Kevis Liao',
  },
  // socialLinks: [
  //   {
  //     icon: 'github',
  //     link: 'https://github.com/kevisliao'
  //   },
  // ]
});