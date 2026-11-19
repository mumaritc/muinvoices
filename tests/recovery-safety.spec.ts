import { test, expect } from '@playwright/test'
import { newInvoice, emptyWorkspace } from '../src/features/invoices/defaults'
import { makeBackup } from '../src/lib/backup'
test('unsupported local schema opens raw recovery and never resets existing storage', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'New invoice', exact: true }).first()).toBeVisible()
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('muinvoice', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('workspace', 'readwrite')
      tx.objectStore('workspace').put(
        { schemaVersion: 999, revision: 3, workspace: { marker: 'synthetic recovery data' } },
        'current',
      )
      tx.oncomplete = () => resolve()
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Local workspace needs recovery' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New invoice', exact: true })).toHaveCount(0)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download raw recovery file' }).click()
  expect((await downloaded).suggestedFilename()).toBe('muinvoice-local-recovery.json')
  const record = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('muinvoice', 1)
      r.onsuccess = () => resolve(r.result)
    })
    return new Promise<unknown>((resolve) => {
      const r = db.transaction('workspace').objectStore('workspace').get('current')
      r.onsuccess = () => {
        db.close()
        resolve(r.result)
      }
    })
  })
  expect(record).toMatchObject({
    schemaVersion: 999,
    workspace: { marker: 'synthetic recovery data' },
  })
})
test('import cancel, invalid version and visible local-wins merge leave old records intact', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'New invoice', exact: true }).first().click()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByRole('button', { name: 'Company / From', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Name · English', exact: true })
    .first()
    .fill('Local synthetic seller')
  await page.getByRole('button', { name: 'Invoices', exact: true }).click()
  await page.getByRole('button', { name: 'Backups & settings', exact: true }).click()
  const workspace = emptyWorkspace()
  workspace.invoices = [newInvoice()]
  const backup = makeBackup(workspace, [])
  const restore = async (value: unknown) =>
    page.getByLabel('Restore backup', { exact: true }).setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(value)),
    })
  await restore(backup)
  page.once('dialog', (d) => d.dismiss())
  await page.getByRole('button', { name: 'Replace workspace', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Invoices 1', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await restore({ ...backup, schemaVersion: 2 })
  await expect(page.locator('.settings-message')).toContainText('Unsupported backup version')
  await expect(page.getByRole('button', { name: 'Replace workspace', exact: true })).toHaveCount(0)
  await restore(backup)
  await page.getByRole('button', { name: 'Merge · keep local records', exact: true }).click()
  await expect(page.locator('.settings-message')).toContainText('New records: 1')
  await expect(page.getByRole('button', { name: 'Invoices 2', exact: true })).toBeVisible()
  await restore(backup)
  await expect(page.locator('.import-plan')).toContainText('Identical records: 1')
  backup.invoices[0].number = 'CONFLICTING'
  await restore(backup)
  await expect(page.locator('.import-plan')).toContainText('Conflicting records skipped: 1')
  await page.getByRole('button', { name: 'Merge · keep local records', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Invoices 2', exact: true })).toBeVisible()
})
