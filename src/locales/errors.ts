import { ZodError } from 'zod'
import { t } from './dictionary'
export function explainError(error: unknown, lang: 'en' | 'ar') {
  if (lang === 'ar') {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('Another') ? t('competingTab', lang) : t('operationFailed', lang)
  }
  if (error instanceof ZodError)
    return error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
  return error instanceof Error ? error.message : String(error)
}
