import { backupSchema, type Backup, type Workspace, type Asset } from '../features/invoices/schema'
import { calculateInvoice } from './calculations'
export const MAX_BACKUP = 25 * 1024 * 1024
export function assetReferences(workspace: Workspace) {
  const refs = new Set<string>()
  for (const i of workspace.invoices) {
    if (i.seller.logoAssetId) refs.add(i.seller.logoAssetId)
    if (i.customer.logoAssetId) refs.add(i.customer.logoAssetId)
    if (i.signatureAssetId) refs.add(i.signatureAssetId)
  }
  for (const c of workspace.companies) if (c.party.logoAssetId) refs.add(c.party.logoAssetId)
  return refs
}
export function parseBackup(source: string): Backup {
  if (new TextEncoder().encode(source).length > MAX_BACKUP) throw new Error('Backup exceeds 25 MiB')
  const value: unknown = JSON.parse(source)
  if (
    typeof value !== 'object' ||
    !value ||
    !('schemaVersion' in value) ||
    value.schemaVersion !== 1
  )
    throw new Error('Unsupported backup version. Original data was preserved.')
  const backup = backupSchema.parse(value)
  for (const entities of [backup.invoices, backup.companies, backup.assets])
    if (new Set(entities.map((e) => e.id)).size !== entities.length)
      throw new Error('Duplicate entity IDs')
  if (
    backup.settings.defaultCompanyId &&
    !backup.companies.some((c) => c.id === backup.settings.defaultCompanyId)
  )
    throw new Error('Missing default company')
  for (const ref of assetReferences(backup))
    if (!backup.assets.some((a) => a.id === ref)) throw new Error('Missing image asset')
  for (const invoice of backup.invoices) {
    const calculation = calculateInvoice(invoice)
    if (!calculation.ok) throw new Error(calculation.errors[0].message)
  }
  for (const asset of backup.assets)
    if (atob(asset.base64).length !== asset.byteLength) throw new Error('Invalid asset length')
  return backup
}
function semantic(value: unknown): string {
  return JSON.stringify(value, (key, v: unknown) => {
    if (['createdAt', 'updatedAt', 'filename'].includes(key)) return undefined
    return v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  })
}
export function mergeBackup(local: Workspace, assets: Asset[], incoming: Backup) {
  const conflicts = new Set<string>()
  let identical = 0
  let added = 0
  let skipped = 0
  function merge<T extends { id: string }>(
    existing: T[],
    imported: T[],
    dependencies: (entity: T) => string[] = () => [],
  ) {
    const result = [...existing]
    for (const entity of imported) {
      if (dependencies(entity).some((id) => conflicts.has(id))) {
        conflicts.add(entity.id)
        skipped++
        continue
      }
      const found = existing.find((e) => e.id === entity.id)
      if (found) {
        if (semantic(found) === semantic(entity)) identical++
        else {
          conflicts.add(entity.id)
          skipped++
        }
      } else {
        result.push(entity)
        added++
      }
    }
    return result
  }
  const mergedAssets = merge(assets, incoming.assets)
  const companies = merge(local.companies, incoming.companies, (c) =>
    c.party.logoAssetId ? [c.party.logoAssetId] : [],
  )
  const invoices = merge(local.invoices, incoming.invoices, (i) =>
    [i.seller.logoAssetId, i.customer.logoAssetId, i.signatureAssetId].filter(
      (id): id is string => !!id,
    ),
  )
  return {
    workspace: { settings: local.settings, companies, invoices },
    assets: mergedAssets,
    added,
    identical,
    skipped,
    conflicts: [...conflicts],
  }
}
export function makeBackup(workspace: Workspace, assets: Asset[]): Backup {
  const refs = assetReferences(workspace)
  return parseBackup(
    JSON.stringify({
      ...workspace,
      app: 'muinvoice',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      assets: assets.filter((a) => refs.has(a.id)),
    }),
  )
}
export function downloadBackup(backup: Backup) {
  downloadJson(backup, `muinvoice-${new Date().toISOString().slice(0, 10)}.json`)
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
