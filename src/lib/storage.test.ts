import 'fake-indexeddb/auto'
import { expect, it, vi } from 'vitest'
import { emptyWorkspace, newInvoice, uuid } from '../features/invoices/defaults'
import {
  openDatabase,
  readWorkspace,
  writeWorkspace,
  readAssets,
  type StoredAsset,
} from './storage'
it('hydrates canonical snapshots and rejects stale writers without overwriting', async () => {
  const db = await openDatabase()
  const workspace = emptyWorkspace()
  workspace.invoices.push(newInvoice())
  expect(await writeWorkspace(db, workspace, 0)).toBe(1)
  expect((await readWorkspace(db))?.workspace).toEqual(workspace)
  await expect(writeWorkspace(db, emptyWorkspace(), 0)).rejects.toThrow('Another tab')
  expect((await readWorkspace(db))?.workspace.invoices).toHaveLength(1)
  db.close()
})
it('rolls back both stores when an image write fails after changing the workspace', async () => {
  const db = await openDatabase()
  const current = await readWorkspace(db)
  const asset: StoredAsset = {
    id: uuid(),
    mime: 'image/png',
    blob: new Blob(['synthetic']),
    byteLength: 9,
    width: 1,
    height: 1,
  }
  const revision = await writeWorkspace(db, current!.workspace, current!.revision, [asset])
  const originalPut = IDBObjectStore.prototype.put
  const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
    this: IDBObjectStore,
    value: unknown,
    key?: IDBValidKey,
  ) {
    if (this.name === 'assets') throw new DOMException('Asset quota denied', 'QuotaExceededError')
    return originalPut.call(this, value, key)
  })
  try {
    await expect(writeWorkspace(db, emptyWorkspace(), revision, [asset])).rejects.toThrow(
      'Asset quota denied',
    )
  } finally {
    put.mockRestore()
  }
  expect((await readWorkspace(db))?.workspace).toEqual(current!.workspace)
  expect((await readAssets(db)).map((a) => a.id)).toEqual([asset.id])
  db.close()
})
it('preserves the last saved workspace after quota or clone failure', async () => {
  const db = await openDatabase()
  const before = await readWorkspace(db)
  const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new DOMException('Quota denied', 'QuotaExceededError')
  })
  await expect(writeWorkspace(db, emptyWorkspace(), before!.revision)).rejects.toThrow(
    'Quota denied',
  )
  put.mockRestore()
  expect(await readWorkspace(db)).toEqual(before)
  db.close()
})
it('serializes simultaneous revision claims so only one writer can commit', async () => {
  const db = await openDatabase()
  const before = await readWorkspace(db)
  const results = await Promise.allSettled([
    writeWorkspace(db, before!.workspace, before!.revision),
    writeWorkspace(db, emptyWorkspace(), before!.revision),
  ])
  expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected'])
  expect((await readWorkspace(db))?.workspace).toEqual(before!.workspace)
  db.close()
})
