import { openDatabase, readAssets } from './storage'
import { encodeAsset } from './assets'
import { downloadJson } from './backup'
export async function exportRawRecovery() {
  const db = await openDatabase()
  try {
    const record: unknown = await new Promise((resolve, reject) => {
      const request = db.transaction('workspace').objectStore('workspace').get('current')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const assets = await Promise.all((await readAssets(db)).map(encodeAsset))
    downloadJson(
      {
        app: 'muinvoice-recovery',
        recoveryVersion: 1,
        exportedAt: new Date().toISOString(),
        record,
        assets,
      },
      'muinvoice-local-recovery.json',
    )
  } finally {
    db.close()
  }
}
