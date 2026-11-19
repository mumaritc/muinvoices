import { type Invoice } from '../features/invoices/schema'
import { calculateInvoice } from './calculations'
export function encodeTlv(fields: readonly [string, string, string, string, string]) {
  const chunks = fields.map((field, index) => {
    const bytes = new TextEncoder().encode(field)
    if (!field.trim() || bytes.length > 255)
      throw new Error(`QR field ${index + 1} must contain 1–255 UTF-8 bytes`)
    return new Uint8Array([index + 1, bytes.length, ...bytes])
  })
  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
export function invoiceQrPayload(invoice: Invoice) {
  const calculation = calculateInvoice(invoice)
  if (!calculation.ok) throw new Error('Fix invoice values before generating QR')
  if (invoice.currency !== 'SAR')
    throw new Error('QR supports SAR only; disable QR for other currencies')
  const active = new Set(
    invoice.items.filter((i) => i.treatment === 'taxed').flatMap((i) => i.taxIds),
  )
  const taxes = invoice.taxes.filter((t) => active.has(t.id) && t.rate !== '0')
  if (!taxes.length || taxes.some((t) => t.kind !== 'vat' || !invoice.qr.vatTaxIds.includes(t.id)))
    throw new Error(
      'QR requires VAT-only active taxes and explicit mapping of every active VAT tax',
    )
  const seller = invoice.seller.name[invoice.qr.sellerLanguage]
  if (!seller?.trim() || !/^\d{15}$/.test(invoice.seller.vat))
    throw new Error('Select an available seller name and enter a 15-digit VAT identifier')
  return encodeTlv([
    seller,
    invoice.seller.vat,
    new Date(invoice.issuedAt).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    calculation.value.grandTotal,
    calculation.value.taxTotal,
  ])
}
