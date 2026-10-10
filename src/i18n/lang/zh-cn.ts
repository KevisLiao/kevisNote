export default {
  /** site-wide strings */
  site: {
    /** subtitle / tagline shown on the home page and as meta description */
    description: '人文主义视角下的科技思辨',
  },
  common: {
    /** all tags */
    all: '全部',
    /** language switcher aria label */
    language: '语言',
  },
  /** home page */
  home: {
    /** sort control aria label */
    sort: '排序',
    /** descending = newest first (default) */
    sortDesc: '倒序',
    /** ascending = oldest first */
    sortAsc: '正序',
  },
  blog: {
    lastModified: '编辑于',
    readingTime: '{{minutes}} 分钟阅读',
    /** AI auto-translation notice shown atop machine-translated articles */
    aiTranslated: '本文由 AI 自动翻译，可能存在偏差。',
    navigation: {
      label: '文章导航',
      previous: '上一篇',
      next: '下一篇',
    },
    /** article sharing */
    share: {
      /** accessible section label */
      label: '分享',
      bookmark: '收藏到浏览器书签',
      bookmarkHint: '按 {{shortcut}} 将这篇文章加入浏览器书签。',
      bookmarkMobileHint: '打开浏览器的菜单或分享菜单，选择“添加书签”。',
      /** copy-link button label */
      copyLink: '复制链接',
      /** feedback after the link is copied */
      copied: '链接已复制',
      copying: '正在复制…',
      copyFailed: '无法自动复制，请手动复制下方链接。',
      /** aria-label template for social platforms */
      shareTo: '分享到 {{platform}}',
      /** aria-label for email sharing */
      shareViaEmail: '通过邮件分享',
    },
  },
  404: {
    pageText: '你访问的页面不存在',
    backBtnText: '返回首页'
  }
}
