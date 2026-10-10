export default {
  /** site-wide strings */
  site: {
    /** subtitle / tagline shown on the home page and as meta description */
    description: 'Reflections on technology through a humanist lens',
  },
  common: {
    /** all tags */
    all: 'All',
    /** language switcher aria label */
    language: 'Language',
  },
  /** home page */
  home: {
    /** sort control aria label */
    sort: 'Sort',
    /** descending = newest first (default) */
    sortDesc: 'Newest',
    /** ascending = oldest first */
    sortAsc: 'Oldest',
  },
  /** blog page */
  blog: {
    /** last modified */
    lastModified: 'Last edited',
    /** reading time */
    readingTime: '{{minutes}} Min Read',
    /** AI auto-translation notice shown atop machine-translated articles */
    aiTranslated: 'This article was machine-translated by AI and may contain inaccuracies.',
    navigation: {
      label: 'Article navigation',
      previous: 'Previous post',
      next: 'Next post',
    },
    /** article sharing */
    share: {
      /** accessible section label */
      label: 'Share',
      bookmark: 'Bookmark this article',
      bookmarkHint: 'Press {{shortcut}} to bookmark this article in your browser.',
      bookmarkMobileHint: 'Open your browser’s menu or share menu and choose “Add bookmark”.',
      /** copy-link button label */
      copyLink: 'Copy link',
      /** feedback after the link is copied */
      copied: 'Link copied',
      copying: 'Copying…',
      copyFailed: 'Automatic copying failed. Copy the link below manually.',
      /** aria-label template for social platforms */
      shareTo: 'Share on {{platform}}',
      /** aria-label for email sharing */
      shareViaEmail: 'Share via email',
    }
  },
  /** 404 page */
  404: {
    /** page text */
    pageText: 'Page Not Found',
    /** back button text */
    backBtnText: 'Back to Home'
  }
}
