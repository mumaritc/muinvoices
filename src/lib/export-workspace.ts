import { useWorkspace } from '../features/invoices/store'
import { downloadBackup, makeBackup } from './backup'
import { encodeAsset } from './assets'
export async function exportWorkspace() {
  const { workspace, assets, update } = useWorkspace.getState()
  const exportedAt = new Date().toISOString()
  const next = { ...workspace, settings: { ...workspace.settings, lastExportedAt: exportedAt } }
  downloadBackup(makeBackup(next, await Promise.all(assets.map(encodeAsset))))
  const latest = useWorkspace.getState().workspace
  update({ ...latest, settings: { ...latest.settings, lastExportedAt: exportedAt } })
}
