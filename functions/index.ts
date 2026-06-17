/*
 * Cloudflare Pages Function for `/`.
 *
 * Static `/index.html` (the dev/preview fallback) is shipped too, but on
 * Cloudflare this Function intercepts `/` first and 302-redirects to a
 * locale-prefixed home based on the visitor's `Accept-Language`, defaulting to
 * the configured default locale.
 *
 * Keep the locale list in sync with `slate.config.ts` → `i18n.locales`.
 */
const LOCALES = ['zh', 'en'];
const DEFAULT_LOCALE = 'zh';

function pickLocale(acceptLanguage: string): string {
  const header = acceptLanguage.toLowerCase();
  // Honor Accept-Language order; first matching locale wins.
  for (const part of header.split(',')) {
    const tag = part.split(';')[0].trim();
    const match = LOCALES.find((code) => tag.startsWith(code));
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export const onRequest: PagesFunction = ({ request }) => {
  const locale = pickLocale(request.headers.get('accept-language') ?? '');
  const url = new URL(request.url);
  return Response.redirect(new URL(`/${locale}/`, url.origin), 302);
};
