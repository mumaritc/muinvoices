// @vitest-environment node
import { expect, it } from 'vitest'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { encodeTlv, invoiceQrPayload } from './zatca-qr'
import { newInvoice, uuid } from '../features/invoices/defaults'
const tail = ['1', '2026-01-01T00:00:00Z', '1.00', '0.00'] as const
function decode(payload: string) {
  const bytes = Buffer.from(payload, 'base64')
  const fields: { tag: number; value: string; length: number }[] = []
  for (let offset = 0; offset < bytes.length;) {
    const tag = bytes[offset++]
    const length = bytes[offset++]
    const value = bytes.subarray(offset, offset + length).toString('utf8')
    fields.push({ tag, value, length })
    offset += length
  }
  return fields
}
it('matches independently assembled English and Arabic known-answer bytes', () => {
  expect(encodeTlv(['A', ...tail])).toBe('AQFBAgExAxQyMDI2LTAxLTAxVDAwOjAwOjAwWgQEMS4wMAUEMC4wMA==')
  const ar = encodeTlv(['ب', ...tail])
  expect(ar).toBe('AQLYqAIBMQMUMjAyNi0wMS0wMVQwMDowMDowMFoEBDEuMDAFBDAuMDA=')
  expect(Buffer.from(ar, 'base64').toString('hex')).toBe(
    '0102d8a80201310314323032362d30312d30315430303a30303a30305a0404312e30300504302e3030',
  )
  expect(decode(ar)[0]).toEqual({ tag: 1, value: 'ب', length: 2 })
})
it('uses unsigned one-byte lengths at 128/255 and rejects overflow/empty fields', () => {
  expect(decode(encodeTlv(['ب'.repeat(64), ...tail]))[0].length).toBe(128)
  expect(decode(encodeTlv(['A'.repeat(255), ...tail]))[0].length).toBe(255)
  expect(() => encodeTlv(['ب'.repeat(128), ...tail])).toThrow('255')
  expect(() => encodeTlv(['', ...tail])).toThrow()
})
it('renders a QR that an independent offline decoder reads exactly', async () => {
  const payload = encodeTlv(['شركة تجريبية', ...tail])
  const png = PNG.sync.read(await QRCode.toBuffer(payload, { width: 480, margin: 4 }))
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(payload)
})
it('derives current totals/time and rejects unsupported currency, other taxes and missing mapping', () => {
  const i = newInvoice()
  const id = uuid()
  i.seller.name = { en: 'Synthetic Seller' }
  i.seller.vat = '300000000000003'
  i.taxes = [{ id, name: { en: 'VAT' }, rate: '15', kind: 'vat' }]
  i.items[0].unitPrice = '1000'
  i.items[0].discount = { type: 'percent', value: '10' }
  i.items[0].treatment = 'taxed'
  i.items[0].taxIds = [id]
  i.qr.vatTaxIds = [id]
  i.issuedAt = '2026-11-16T15:00:00+03:00'
  expect(decode(invoiceQrPayload(i)).map((f) => f.value)).toEqual([
    'Synthetic Seller',
    '300000000000003',
    '2026-11-16T12:00:00Z',
    '1035.00',
    '135.00',
  ])
  i.items[0].unitPrice = '2000'
  expect(decode(invoiceQrPayload(i))[3].value).toBe('2070.00')
  i.currency = 'USD'
  expect(() => invoiceQrPayload(i)).toThrow('SAR')
  i.currency = 'SAR'
  i.taxes[0].kind = 'other'
  expect(() => invoiceQrPayload(i)).toThrow()
  i.taxes[0].kind = 'vat'
  i.qr.vatTaxIds = []
  expect(() => invoiceQrPayload(i)).toThrow('mapping')
})
