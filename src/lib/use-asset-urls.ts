import { useEffect, useState } from 'react'
import { type StoredAsset } from './storage'
export function useAssetUrls(assets: StoredAsset[]) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    const next = Object.fromEntries(
      assets.map((asset) => [asset.id, URL.createObjectURL(asset.blob)]),
    )
    // Object URLs must share the effect lifetime, including StrictMode's restart.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next)
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [assets])
  return urls
}
