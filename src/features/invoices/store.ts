import { create } from 'zustand'
import { emptyWorkspace } from './defaults'
import { type Workspace } from './schema'
import {
  openDatabase,
  readWorkspace,
  writeWorkspace,
  type StoredAsset,
  readAssets,
  WorkspaceConflictError,
} from '../../lib/storage'
import { assetReferences, makeBackup } from '../../lib/backup'
import { encodeAsset, decodeAsset } from '../../lib/assets'
type State = {
  workspace: Workspace
  assets: StoredAsset[]
  ready: boolean
  recovery: boolean
  status: 'loading' | 'saved' | 'unsaved' | 'saving' | 'error'
  error: string
  generation: number
  update: (workspace: Workspace, assets?: StoredAsset[]) => void
}
export const useWorkspace = create<State>((set) => ({
  workspace: emptyWorkspace(),
  assets: [],
  ready: false,
  recovery: false,
  status: 'loading',
  error: '',
  generation: 0,
  update: (workspace, assets) => {
    set((s) => ({
      workspace: {
        ...workspace,
        settings: {
          ...workspace.settings,
          lastChangedAt:
            workspace.settings.lastExportedAt !== s.workspace.settings.lastExportedAt
              ? s.workspace.settings.lastChangedAt
              : new Date().toISOString(),
        },
      },
      ...(assets ? { assets } : {}),
      status: 'unsaved',
      generation: s.generation + 1,
    }))
    scheduleSave()
  },
}))
let db: IDBDatabase | undefined
let revision = 0
let writable = false
let timer: ReturnType<typeof setTimeout> | undefined
let queue = Promise.resolve()
let startup: Promise<void> | undefined
let releaseLock: (() => void) | undefined
export function initializeWorkspace() {
  startup ??= (async () => {
    try {
      if (navigator.locks) {
        let acknowledge!: (acquired: boolean) => void
        let rejectLock!: (reason: unknown) => void
        const acquired = new Promise<boolean>((resolve, reject) => {
          acknowledge = resolve
          rejectLock = reject
        })
        void navigator.locks
          .request('muinvoice-writer', { ifAvailable: true }, async (lock) => {
            acknowledge(!!lock)
            if (lock)
              await new Promise<void>((resolve) => {
                releaseLock = resolve
              })
          })
          .catch(rejectLock)
        if (!(await acquired))
          throw new Error(
            'Another muinvoice tab is editing. Close that tab, then reload. Export remains available.',
          )
      }
      db = await openDatabase()
      const [stored, assets] = await Promise.all([readWorkspace(db), readAssets(db)])
      if (stored) {
        const encoded = await Promise.all(assets.map(encodeAsset))
        const backup = makeBackup(stored.workspace, encoded)
        await Promise.all(backup.assets.map(decodeAsset))
      }
      if (stored) revision = stored.revision
      writable = true
      useWorkspace.setState({
        workspace: stored?.workspace ?? emptyWorkspace(),
        assets,
        ready: true,
        status: 'saved',
      })
    } catch (error) {
      useWorkspace.setState({ ready: true, recovery: !!db })
      fail(error)
    }
  })()
  return startup
}
function fail(error: unknown) {
  useWorkspace.setState({
    status: 'error',
    error:
      error instanceof Error ? error.message : 'Storage unavailable. Export your unsaved work.',
  })
}
function scheduleSave() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    void flushSave().catch(() => {
      /* Error is displayed by the store. */
    })
  }, 500)
}
export function flushSave(): Promise<void> {
  clearTimeout(timer)
  const write = async () => {
    const snapshot = useWorkspace.getState()
    if (snapshot.status === 'saved') return
    if (!db || !writable) {
      const error = new Error(
        snapshot.error || 'Local storage unavailable. Export to keep your edits.',
      )
      fail(error)
      throw error
    }
    useWorkspace.setState({ status: 'saving' })
    try {
      const refs = assetReferences(snapshot.workspace)
      const retained = snapshot.assets.filter((a) => refs.has(a.id))
      revision = await writeWorkspace(db, snapshot.workspace, revision, retained)
      useWorkspace.setState((s) => ({
        status: s.generation === snapshot.generation ? 'saved' : 'unsaved',
        ...(s.generation === snapshot.generation && retained.length !== snapshot.assets.length
          ? { assets: retained }
          : {}),
        error: '',
      }))
      try {
        localStorage.setItem(
          'muinvoice:preferences',
          JSON.stringify({ language: snapshot.workspace.settings.uiLanguage }),
        )
      } catch {
        /* IndexedDB remains authoritative. */
      }
    } catch (error) {
      if (error instanceof WorkspaceConflictError) writable = false
      fail(error)
      throw error
    }
  }
  const result = queue.then(write)
  queue = result.catch(() => {})
  return result
}
export async function commitReplacement(workspace: Workspace, assets: StoredAsset[]) {
  await flushSave()
  if (!db || !writable) throw new Error('Storage is unavailable; import was not applied')
  revision = await writeWorkspace(db, workspace, revision, assets)
  useWorkspace.setState((s) => ({
    workspace,
    assets,
    status: 'saved',
    generation: s.generation + 1,
    error: '',
  }))
  try {
    localStorage.setItem(
      'muinvoice:preferences',
      JSON.stringify({ language: workspace.settings.uiLanguage }),
    )
  } catch {
    /* Optional mirror. */
  }
}
export function closeWorkspace() {
  releaseLock?.()
  db?.close()
}
