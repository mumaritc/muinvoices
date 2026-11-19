import { describe, expect, it } from 'vitest'
import { newInvoice, newItem, uuid } from '../features/invoices/defaults'
import { calculateInvoice } from './calculations'
import { normalizeDecimal } from '../features/invoices/schema'
function fixture(price = '1000', rate = '15') {
  const invoice = newInvoice()
  const taxId = uuid()
  invoice.taxes = [{ id: taxId, name: { en: 'VAT' }, rate, kind: 'vat' }]
  invoice.items = [
    {
      ...newItem(),
      description: { en: 'Design work', ar: 'أعمال التصميم' },
      unitPrice: price,
      treatment: 'taxed',
      taxIds: [taxId],
    },
  ]
  return invoice
}
function result(invoice: ReturnType<typeof newInvoice>) {
  const r = calculateInvoice(invoice)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.value
}
describe('golden arithmetic policy', () => {
  it('adds two nonzero taxes on the same base rather than compounding', () => {
    const i = fixture('100')
    const second = uuid()
    i.taxes.push({ id: second, name: { en: 'Other' }, rate: '5', kind: 'other' })
    i.items[0].taxIds.push(second)
    expect(result(i)).toMatchObject({ netTotal: '100.00', taxTotal: '20.00', grandTotal: '120.00' })
    expect(result(i).breakdown.map((t) => t.amount)).toEqual(['15.00', '5.00'])
  })
  it('rejects discounts beyond the available base, including a zero subtotal', () => {
    const i = fixture()
    i.items[0].discount = { type: 'fixed', value: '1001' }
    expect(calculateInvoice(i).ok).toBe(false)
    i.items[0].discount = undefined
    i.items[0].unitPrice = '0'
    i.overallDiscount = { type: 'fixed', value: '0.01' }
    expect(calculateInvoice(i).ok).toBe(false)
    i.overallDiscount.value = '0'
    expect(result(i).grandTotal).toBe('0.00')
  })
  it('1000 less 10% plus 15% = 1035', () => {
    const i = fixture()
    i.items[0].discount = { type: 'percent', value: '10' }
    expect(result(i)).toMatchObject({
      netTotal: '900.00',
      taxTotal: '135.00',
      grandTotal: '1035.00',
    })
  })
  it('recovers inclusive net before applying a fixed net discount', () => {
    const i = fixture('115')
    i.priceMode = 'inclusive'
    expect(result(i)).toMatchObject({ netTotal: '100.00', taxTotal: '15.00', grandTotal: '115.00' })
    i.items[0].discount = { type: 'fixed', value: '10' }
    expect(result(i).grandTotal).toBe('103.50')
  })
  it('allocates overall discount across taxed and untaxed lines', () => {
    const i = fixture('100')
    i.items.push({ ...newItem(), unitPrice: '100' })
    i.overallDiscount = { type: 'fixed', value: '20' }
    expect(result(i)).toMatchObject({ netTotal: '180.00', taxTotal: '13.50', grandTotal: '193.50' })
    expect(result(i).lines.map((l) => l.allocation)).toEqual(['10.00', '10.00'])
  })
  it('uses stable largest remainder ties with zero-line exclusion', () => {
    const i = newInvoice()
    i.items = ['0.01', '0.01', '0.01', '0'].map((unitPrice) => ({ ...newItem(), unitPrice }))
    i.overallDiscount = { type: 'fixed', value: '0.01' }
    expect(result(i).lines.map((l) => l.allocation)).toEqual(['0.01', '0.00', '0.00', '0.00'])
    expect(result(i).grandTotal).toBe('0.02')
  })
  it('rounds additive taxes separately, preserving inclusive minor-unit differences', () => {
    const i = fixture('0.03', '10')
    i.taxes.push({ id: uuid(), name: { en: 'Other' }, rate: '10', kind: 'other' })
    i.items[0].taxIds.push(i.taxes[1].id)
    i.priceMode = 'inclusive'
    expect(result(i)).toMatchObject({ netTotal: '0.03', taxTotal: '0.00', grandTotal: '0.03' })
  })
  it.each([
    ['JPY', '0.5', '1'],
    ['SAR', '0.005', '0.01'],
    ['KWD', '0.0005', '0.001'],
  ])('half-up at %s scale', (currency, unitPrice, total) => {
    const i = newInvoice()
    i.currency = currency
    i.items[0].unitPrice = unitPrice
    expect(result(i).grandTotal).toBe(total)
  })
  it('fractional quantities, full discounts, zero/exempt remain distinct', () => {
    const i = fixture('20')
    i.items[0].quantity = '0.125'
    expect(result(i).grandTotal).toBe('2.88')
    i.items[0].discount = { type: 'percent', value: '100' }
    expect(result(i).grandTotal).toBe('0.00')
    i.items[0].treatment = 'exempt'
    i.items[0].taxIds = []
    expect(result(i).breakdown[0].treatment).toBe('exempt')
    i.items[0].treatment = 'zeroRated'
    i.taxes[0].rate = '0'
    i.items[0].taxIds = [i.taxes[0].id]
    expect(result(i).breakdown[0].treatment).toBe('zeroRated')
  })
  it('overall percentage and unequal shares conserve minor units', () => {
    const i = newInvoice()
    i.items = ['0.01', '0.02', '0.03'].map((unitPrice) => ({ ...newItem(), unitPrice }))
    i.overallDiscount = { type: 'percent', value: '50' }
    expect(result(i).lines.map((l) => l.allocation)).toEqual(['0.01', '0.01', '0.01'])
    expect(result(i).grandTotal).toBe('0.03')
  })
  it('rejects bounds, negative/unknown/duplicate references, invalid fixed scale and overflow', () => {
    const i = fixture()
    i.items[0].quantity = '-1'
    expect(calculateInvoice(i).ok).toBe(false)
    i.items[0].quantity = '1'
    i.taxes[0].rate = '101'
    expect(calculateInvoice(i).ok).toBe(false)
    i.taxes[0].rate = '15'
    i.items[0].taxIds = [uuid()]
    expect(calculateInvoice(i).ok).toBe(false)
    i.items[0].taxIds = [i.taxes[0].id, i.taxes[0].id]
    expect(calculateInvoice(i).ok).toBe(false)
    i.items[0].taxIds = [i.taxes[0].id]
    i.items[0].discount = { type: 'fixed', value: '0.001' }
    expect(calculateInvoice(i).ok).toBe(false)
    i.items[0].discount = undefined
    i.items[0].quantity = '999999999999'
    expect(calculateInvoice(i).ok).toBe(false)
  })
})
describe('decimal input boundary', () => {
  it('normalizes Arabic digits and canonical zeros without float conversion', () => {
    expect(normalizeDecimal('٠٠١٢٫٣٤٠٠')).toBe('12.34')
    expect(normalizeDecimal('0.000000')).toBe('0')
  })
  it.each(['', '1,000', '١٬٠٠٠', '1e3', '-1', 'NaN', '1.٢٫3', '0.0000001'])(
    'rejects ambiguous or out-of-range %s',
    (input) => expect(() => normalizeDecimal(input)).toThrow(),
  )
})
