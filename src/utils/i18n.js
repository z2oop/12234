import { createI18n } from 'vue-i18n';
import en from '../language/en.json';
import ja from '../language/ja.json';
import ko from '../language/ko.json';
import zh_CN from '../language/zh-CN.json';
import zh_TW from '../language/zh-TW.json';
import clil from '../language/clil.json';
import gugu from '../language/gugu.json';


const messages = {
  en,
  ja,
  ko,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  gugu,
  clil,
};

const getBrowserLocale = () => {
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  const lang = browserLang.split('-')[0];
  return Object.keys(messages).includes(lang) ? lang : 'zh-CN';
};

const defaultLocale = JSON.parse(localStorage.getItem('settings'))?.['language'] || getBrowserLocale();

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'zh-CN',
  messages,
});

export default i18n;