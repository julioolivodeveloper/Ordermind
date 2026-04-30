'use client'
import { es } from './es'
import { en } from './en'
import type { Locale } from '@/types'

const translations = { es, en }

export function t(locale: Locale = 'es') {
  return translations[locale] ?? translations.es
}

export { es, en }
export type { Translations } from './es'
