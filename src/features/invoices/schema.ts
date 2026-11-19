import { z } from 'zod'

export const id = z.uuid()
export const text = z.string().max(10000)
export const localizedSchema = z.strictObject({ en: text.optional(), ar: text.optional() })
export type LocalizedText = z.infer<typeof localizedSchema>
export const decimalSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/)
  .refine(
    (v) => !v.includes('.') || !v.endsWith('0'),
    'Use canonical decimals without trailing zeros',
  )
export const percentSchema = decimalSchema.refine(
  (v) => Number(v) <= 100 && (v.split('.')[1]?.length ?? 0) <= 4,
  'Percentage must be 0–100 with at most 4 decimal places',
)
export const currencies =
  'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWG'.split(
    ' ',
  )
export const currencySchema = z
  .string()
  .refine((v) => currencies.includes(v), 'Use a supported ISO currency code')
export function currencyScale(currency: string) {
  if (!currencies.includes(currency)) throw new Error('Unsupported currency')
  if (
    'BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX VND VUV XAF XOF XPF'.split(' ').includes(currency)
  )
    return 0
  return 'BHD IQD JOD KWD LYD OMR TND'.split(' ').includes(currency) ? 3 : 2
}
const instant = z.iso.datetime({ offset: true })
const date = z.iso.date()
const field = z.strictObject({
  id,
  label: localizedSchema,
  value: localizedSchema,
  visible: z.boolean(),
})
const uniqueIds = (values: { id: string }[]) =>
  new Set(values.map((v) => v.id)).size === values.length
const fieldsSchema = z.array(field).max(100).refine(uniqueIds, 'Duplicate custom field IDs')
export const partySchema = z.strictObject({
  name: localizedSchema,
  address: localizedSchema,
  vat: text,
  registration: text,
  phone: text,
  email: text,
  website: text,
  fields: fieldsSchema,
  logoAssetId: id.optional(),
})
export const discountSchema = z
  .strictObject({ type: z.enum(['percent', 'fixed']), value: decimalSchema })
  .superRefine((v, ctx) => {
    if (v.type === 'percent' && !percentSchema.safeParse(v.value).success)
      ctx.addIssue({ code: 'custom', message: 'Invalid percentage', path: ['value'] })
  })
export const taxSchema = z.strictObject({
  id,
  name: localizedSchema,
  rate: percentSchema,
  kind: z.enum(['vat', 'other']),
})
export const itemSchema = z.strictObject({
  id,
  description: localizedSchema,
  sku: text,
  unit: localizedSchema,
  quantity: decimalSchema.refine((v) => Number(v) > 0, 'Quantity must be positive'),
  unitPrice: decimalSchema,
  discount: discountSchema.optional(),
  treatment: z.enum(['taxed', 'zeroRated', 'exempt', 'none']),
  taxIds: z.array(id).max(100),
  explanation: localizedSchema,
})
export const sectionSchema = z.strictObject({
  id,
  title: localizedSchema,
  kind: z.enum(['text', 'keyValue']),
  text: localizedSchema,
  fields: fieldsSchema,
  visible: z.boolean(),
  position: z.enum(['beforeItems', 'afterItems', 'footer']),
})
export const columnIds = [
  'number',
  'sku',
  'description',
  'quantity',
  'unit',
  'unitPrice',
  'discount',
  'tax',
  'total',
] as const
export const templateIds = [
  'pure',
  'clean-line',
  'monochrome',
  'air',
  'executive',
  'ledger',
  'blue-office',
  'structured',
  'formal',
  'gradient-edge',
  'bold-header',
  'split-panel',
  'accent-bar',
  'studio',
  'geometric',
  'editorial',
  'color-block',
  'signature',
  'luxury-gold',
  'elegant-serif',
  'arabic-classic',
  'arabic-modern',
  'arabic-formal',
  'dual-column',
  'saudi-business',
] as const
export const designSchema = z
  .strictObject({
    templateId: z.enum(templateIds),
    mode: z.enum(['en', 'ar', 'bilingual']),
    order: z.enum(['en-first', 'ar-first']),
    font: z.enum(['noto', 'cairo', 'plex']),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    size: z.enum(['small', 'medium', 'large']),
    spacing: z.enum(['compact', 'normal', 'airy']),
    border: z.enum(['none', 'rules', 'grid']),
    logoPosition: z.enum(['start', 'center', 'end']),
    logoSize: z.number().int().min(24).max(160),
    showSellerLabel: z.boolean().default(true),
    qrPosition: z.enum(['top', 'bottom']).default('bottom'),
    qrAlign: z.enum(['left', 'center', 'right']).default('right'),
    columns: z
      .array(
        z.strictObject({
          id: z.enum(columnIds),
          visible: z.boolean(),
          label: localizedSchema,
          align: z.enum(['start', 'center', 'end']),
          width: z.number().min(1).max(8),
        }),
      )
      .length(columnIds.length),
    labels: z.partialRecord(
      z.enum([
        'invoice',
        'seller',
        'customer',
        'subtotal',
        'discount',
        'tax',
        'total',
        'due',
        'reference',
        'signature',
      ]),
      localizedSchema,
    ),
  })
  .superRefine((v, ctx) => {
    if (
      new Set(v.columns.map((c) => c.id)).size !== columnIds.length ||
      !v.columns.some((c) => c.visible)
    )
      ctx.addIssue({ code: 'custom', message: 'Use unique columns with at least one visible' })
  })
export const invoiceSchema = z
  .strictObject({
    id,
    number: text,
    type: z.enum(['invoice', 'tax-invoice', 'simplified-tax']),
    status: z.enum(['draft', 'finalized']),
    issuedAt: instant,
    timezone: z
      .string()
      .max(100)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: v })
          return true
        } catch {
          return false
        }
      }, 'Invalid timezone'),
    dueDate: z.union([date, z.literal('')]),
    reference: text,
    headerText: localizedSchema.default({}),
    footerText: localizedSchema.default({}),
    currency: currencySchema,
    numerals: z.enum(['latn', 'arab']),
    priceMode: z.enum(['exclusive', 'inclusive']),
    seller: partySchema,
    customer: partySchema,
    taxes: z.array(taxSchema).max(100).refine(uniqueIds, 'Duplicate tax IDs'),
    items: z.array(itemSchema).max(1000),
    overallDiscount: discountSchema.optional(),
    sections: z.array(sectionSchema).max(100).refine(uniqueIds, 'Duplicate section IDs'),
    design: designSchema,
    signatureAssetId: id.optional(),
    qr: z.strictObject({
      enabled: z.boolean(),
      sellerLanguage: z.enum(['en', 'ar']),
      vatTaxIds: z.array(id).max(100),
    }),
    createdAt: instant,
    updatedAt: instant,
  })
  .superRefine((v, ctx) => {
    const unique = (ids: string[], path: string) => {
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: 'custom', message: 'Duplicate IDs', path: [path] })
    }
    unique(
      v.taxes.map((t) => t.id),
      'taxes',
    )
    unique(
      v.items.map((t) => t.id),
      'items',
    )
    unique(
      v.sections.map((t) => t.id),
      'sections',
    )
    for (const [index, item] of v.items.entries()) {
      if (
        new Set(item.taxIds).size !== item.taxIds.length ||
        item.taxIds.some((t) => !v.taxes.some((tax) => tax.id === t)) ||
        (item.treatment === 'taxed' && !item.taxIds.length) ||
        (['none', 'exempt'].includes(item.treatment) && item.taxIds.length) ||
        (item.treatment === 'zeroRated' &&
          item.taxIds.some((t) => v.taxes.find((tax) => tax.id === t)?.rate !== '0'))
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid tax references or treatment',
          path: ['items', index, 'taxIds'],
        })
    }
    if (
      new Set(v.qr.vatTaxIds).size !== v.qr.vatTaxIds.length ||
      v.qr.vatTaxIds.some((t) => !v.taxes.some((tax) => tax.id === t && tax.kind === 'vat'))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid QR VAT mapping', path: ['qr'] })
  })
export const companySchema = z.strictObject({
  id,
  label: text,
  party: partySchema,
  currency: currencySchema,
  taxes: z.array(taxSchema).max(100).refine(uniqueIds, 'Duplicate tax IDs'),
  design: designSchema,
  sections: z.array(sectionSchema).max(100).refine(uniqueIds, 'Duplicate section IDs'),
  createdAt: instant,
  updatedAt: instant,
})
export const settingsSchema = z.strictObject({
  uiLanguage: z.enum(['en', 'ar']),
  defaultCurrency: currencySchema,
  defaultDesign: designSchema,
  defaultTaxes: z.array(taxSchema).max(100).refine(uniqueIds, 'Duplicate tax IDs'),
  defaultCompanyId: id.optional(),
  backupReminder: z.boolean(),
  lastExportedAt: instant.optional(),
  lastChangedAt: instant.optional(),
})
export const workspaceSchema = z.strictObject({
  settings: settingsSchema,
  companies: z.array(companySchema).max(100),
  invoices: z.array(invoiceSchema).max(1000),
})
export const assetSchema = z
  .strictObject({
    id,
    mime: z.enum(['image/png', 'image/jpeg', 'image/webp']),
    base64: z
      .string()
      .max(2796204)
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    byteLength: z
      .number()
      .int()
      .positive()
      .max(2 * 1024 * 1024),
    width: z.number().int().positive().max(4096),
    height: z.number().int().positive().max(4096),
    filename: z.string().max(255).optional(),
  })
  .refine((a) => a.width * a.height <= 16000000)
export const backupSchema = workspaceSchema.extend({
  app: z.literal('muinvoice'),
  schemaVersion: z.literal(1),
  exportedAt: instant,
  assets: z.array(assetSchema).max(100),
})
export type Invoice = z.infer<typeof invoiceSchema>
export type Design = z.infer<typeof designSchema>
export type Party = z.infer<typeof partySchema>
export type Workspace = z.infer<typeof workspaceSchema>
export type Backup = z.infer<typeof backupSchema>
export type Asset = z.infer<typeof assetSchema>

export function normalizeDecimal(value: string) {
  const ascii = value
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace('٫', '.')
  if (!/^\d+(\.\d+)?$/.test(ascii))
    throw new Error('Use digits and a decimal point only; no grouping separators')
  const [whole, fraction = ''] = ascii.split('.')
  const normalized =
    whole.replace(/^0+(?=\d)/, '') +
    (fraction.replace(/0+$/, '') ? '.' + fraction.replace(/0+$/, '') : '')
  return decimalSchema.parse(normalized)
}
