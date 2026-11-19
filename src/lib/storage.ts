import { workspaceSchema, type Workspace, type Asset } from '../features/invoices/schema'
export class WorkspaceConflictError extends Error {}
export type StoredWorkspace = { schemaVersion: 1; revision: number; workspace: Workspace }
export type StoredAsset = Omit<Asset, 'base64'> & { blob: Blob }
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('muinvoice', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('workspace')
      db.createObjectStore('assets', { keyPath: 'id' })
    }
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error ?? new Error('Browser storage unavailable'))
    request.onblocked = () =>
      reject(new Error('Storage upgrade blocked. Close other muinvoice tabs and reload.'))
  })
}
export async function readWorkspace(db: IDBDatabase): Promise<StoredWorkspace | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly')
    const req = tx.objectStore('workspace').get('current')
    req.onsuccess = () => {
      const value: unknown = req.result
      if (value === undefined) {
        resolve(undefined)
        return
      }
      if (
        typeof value !== 'object' ||
        value === null ||
        !('schemaVersion' in value) ||
        value.schemaVersion !== 1 ||
        !('revision' in value) ||
        !Number.isSafeInteger(value.revision) ||
        !('workspace' in value)
      ) {
        reject(new Error('Unsupported or damaged local workspace. Existing data was preserved.'))
        return
      }
      const parsed = workspaceSchema.safeParse(value.workspace)
      if (!parsed.success)
        reject(new Error('Local workspace validation failed. Existing data was preserved.'))
      else resolve({ schemaVersion: 1, revision: value.revision as number, workspace: parsed.data })
    }
    req.onerror = () => reject(req.error)
  })
}
export function readAssets(db: IDBDatabase): Promise<StoredAsset[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction('assets').objectStore('assets').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
export function writeWorkspace(
  db: IDBDatabase,
  workspace: Workspace,
  expectedRevision: number,
  assets?: StoredAsset[],
): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['workspace', 'assets'], 'readwrite')
    let failure: Error | null = null
    const store = tx.objectStore('workspace')
    const req = store.get('current')
    req.onsuccess = () => {
      try {
        const current = req.result as StoredWorkspace | undefined
        if ((current?.revision ?? 0) !== expectedRevision) {
          failure = new WorkspaceConflictError(
            'Another tab changed this workspace. Export your edits, then reload.',
          )
          tx.abort()
          return
        }
        store.put({ schemaVersion: 1, revision: expectedRevision + 1, workspace }, 'current')
        if (assets) {
          const assetStore = tx.objectStore('assets')
          assetStore.clear()
          for (const asset of assets) assetStore.put(asset)
        }
      } catch (error) {
        failure =
          error instanceof Error || error instanceof DOMException
            ? new Error(error.message)
            : new Error('Storage write failed')
        tx.abort()
      }
    }
    tx.oncomplete = () => resolve(expectedRevision + 1)
    tx.onabort = () =>
      reject(failure ?? tx.error ?? new Error('Storage transaction aborted; edits are not saved'))
    tx.onerror = () => {
      failure ??= tx.error
    }
  })
}
