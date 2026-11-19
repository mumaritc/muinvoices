import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { newInvoice, duplicateInvoice } from '../invoices/defaults'
import { templateIds, designSchema } from '../invoices/schema'
import { InvoiceRenderer } from '../../components/invoice/InvoiceRenderer'
import { templates, templateDefaults } from './registry'
import { localizedValues } from '../../locales/dictionary'
it('has exactly 25 stable, unique compositions with valid defaults', () => {
  expect(templates.map((t) => t.id)).toEqual([...templateIds])
  expect(new Set(templates.map((t) => t.component)).size).toBe(25)
  for (const template of templates) {
    expect(designSchema.safeParse(templateDefaults(template.id)).success).toBe(true)
    const i = newInvoice()
    i.design.templateId = template.id
    i.seller.name.en = '<script>alert(1)</script>'
    const html = renderToStaticMarkup(<InvoiceRenderer invoice={i} />)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  }
})
it('preserves language fallback and independent duplicate identities', () => {
  expect(localizedValues({ en: 'Same', ar: 'Same' }, 'bilingual', 'ar-first')).toEqual([
    { language: 'ar', text: 'Same' },
  ])
  expect(localizedValues({ en: 'Only' }, 'ar', 'ar-first')[0].language).toBe('en')
  const i = newInvoice()
  const duplicate = duplicateInvoice(i)
  expect(duplicate.id).not.toBe(i.id)
  expect(duplicate.items[0].id).not.toBe(i.items[0].id)
  duplicate.seller.name.en = 'Changed'
  expect(i.seller.name.en).toBeUndefined()
})
