import i18next from 'i18next';
import zhCn from './lang/zh-cn';
import enUS from './lang/en-us';
import type { LangType, LocaleCode } from '@/typings/config';

/** Route locale → i18next resource key + html lang attribute + switcher label. */
export const localeMeta: Record<
  LocaleCode,
  { dictKey: LangType; htmlLang: string; label: string }
> = {
  zh: { dictKey: 'zh-CN', htmlLang: 'zh-CN', label: '中文' },
  en: { dictKey: 'en-US', htmlLang: 'en', label: 'English' },
};

await i18next.init({
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  resources: {
    'zh-CN': {
      translation: zhCn,
    },
    'en-US': {
      translation: enUS,
    },
  },
});

/** Returns a `t` function bound to the given route locale. */
export function getTranslations(locale: LocaleCode) {
  return i18next.getFixedT(localeMeta[locale]?.dictKey ?? 'zh-CN');
}

export default i18next;
