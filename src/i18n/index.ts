import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './zh.json'
import en from './en.json'
import { loadJSON, LS_KEYS } from '@/services/persist'

export type AppLang = 'zh' | 'en'

const saved = loadJSON<AppLang>(LS_KEYS.lang, 'zh')

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: saved,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

export function changeAppLang(lang: AppLang) {
  void i18n.changeLanguage(lang)
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
}

export default i18n
