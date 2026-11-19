import { expect, it } from 'vitest'
import { emptyWorkspace, newInvoice, uuid } from '../features/invoices/defaults'
import { makeBackup, mergeBackup, parseBackup } from './backup'
it('round trips v1 and rejects future versions, unknown authority fields and missing assets', () => {
  const w = emptyWorkspace()
  w.invoices.push(newInvoice())
  const b = makeBackup(w, [])
  expect(parseBackup(JSON.stringify(b))).toEqual(b)
  expect(() => parseBackup(JSON.stringify({ ...b, schemaVersion: 2 }))).toThrow('Unsupported')
  expect(() => parseBackup(JSON.stringify({ ...b, totals: { grandTotal: '1' } }))).toThrow()
  b.invoices[0].seller.logoAssetId = uuid()
  expect(() => parseBackup(JSON.stringify(b))).toThrow('Missing image')
})
it('keeps local settings and reports identical and conflicting records', () => {
  const w = emptyWorkspace()
  w.invoices.push(newInvoice())
  const b = makeBackup(w, [])
  expect(mergeBackup(w, [], b)).toMatchObject({ identical: 1, added: 0, skipped: 0 })
  b.invoices[0].number = 'changed'
  b.settings.uiLanguage = 'ar'
  const plan = mergeBackup(w, [], b)
  expect(plan.skipped).toBe(1)
  expect(plan.workspace.invoices[0].number).toBe(w.invoices[0].number)
  expect(plan.workspace.settings.uiLanguage).toBe('en')
})
it('propagates image conflicts to dependent profiles/invoices without changing local data', () => {
  const w = emptyWorkspace()
  const id = uuid()
  const incoming = makeBackup(emptyWorkspace(), [])
  const local = {
    id,
    mime: 'image/png' as const,
    base64: 'AQ==',
    byteLength: 1,
    width: 1,
    height: 1,
  }
  incoming.assets = [{ ...local, base64: 'Ag==' }]
  const i = newInvoice()
  i.seller.logoAssetId = id
  incoming.invoices = [i]
  const plan = mergeBackup(w, [local], incoming)
  expect(plan.skipped).toBe(2)
  expect(plan.workspace.invoices).toEqual([])
  expect(plan.assets).toEqual([local])
  expect(w.invoices).toEqual([])
})
it('rejects duplicate IDs, malformed and oversize files and invalid amounts', () => {
  const w = emptyWorkspace()
  w.invoices = [newInvoice()]
  const b = makeBackup(w, [])
  expect(() => parseBackup('{bad')).toThrow()
  expect(() => parseBackup(' '.repeat(25 * 1024 * 1024 + 1))).toThrow('25 MiB')
  b.invoices.push(b.invoices[0])
  expect(() => parseBackup(JSON.stringify(b))).toThrow('Duplicate')
  b.invoices.pop()
  b.invoices[0].items[0].unitPrice = '-1'
  expect(() => parseBackup(JSON.stringify(b))).toThrow()
})
