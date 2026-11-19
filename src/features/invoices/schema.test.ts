import { expect, it } from 'vitest'
import { newInvoice, uuid } from './defaults'
import { invoiceSchema } from './schema'
it('rejects invalid calendar dates and timestamps without explicit offsets', () => {
  const i = newInvoice()
  i.dueDate = '2026-02-30'
  expect(invoiceSchema.safeParse(i).success).toBe(false)
  i.dueDate = ''
  i.issuedAt = '2026-11-17T12:00:00'
  expect(invoiceSchema.safeParse(i).success).toBe(false)
  i.issuedAt += '+03:00'
  expect(invoiceSchema.safeParse(i).success).toBe(true)
  i.timezone = 'Invalid/Zone'
  expect(invoiceSchema.safeParse(i).success).toBe(false)
})
it('rejects duplicate custom IDs and untrusted font/color/image references', () => {
  const i = newInvoice()
  const field = { id: uuid(), label: {}, value: {}, visible: true }
  i.seller.fields = [field, field]
  expect(invoiceSchema.safeParse(i).success).toBe(false)
  i.seller.fields = []
  expect(
    invoiceSchema.safeParse({ ...i, design: { ...i.design, color: 'url(https://example.test)' } })
      .success,
  ).toBe(false)
  expect(
    invoiceSchema.safeParse({ ...i, design: { ...i.design, font: 'remote-font' } }).success,
  ).toBe(false)
  i.seller.logoAssetId = 'https://example.test/logo.png'
  expect(invoiceSchema.safeParse(i).success).toBe(false)
})
