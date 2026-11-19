import { assetSchema, type Asset } from '../features/invoices/schema'
import { type StoredAsset } from './storage'
export function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}
export async function encodeAsset(asset: StoredAsset): Promise<Asset> {
  const { blob, ...metadata } = asset
  return { ...metadata, base64: bytesToBase64(new Uint8Array(await blob.arrayBuffer())) }
}
export async function decodeAsset(asset: Asset): Promise<StoredAsset> {
  assetSchema.parse(asset)
  const bytes = Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0))
  const result = await verifyImage(
    new Blob([bytes], { type: asset.mime }),
    asset.id,
    asset.filename,
  )
  if (
    result.width !== asset.width ||
    result.height !== asset.height ||
    result.byteLength !== asset.byteLength
  )
    throw new Error('Image metadata does not match decoded image')
  return result
}
export async function verifyImage(blob: Blob, id: string, filename?: string): Promise<StoredAsset> {
  if (!blob.size || blob.size > 2 * 1024 * 1024) throw new Error('Image must be at most 2 MiB')
  const header = new Uint8Array(await blob.arrayBuffer())
  const mime =
    header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71
      ? 'image/png'
      : header[0] === 255 && header[1] === 216 && header[2] === 255
        ? 'image/jpeg'
        : String.fromCharCode(...header.slice(0, 4)) === 'RIFF' &&
            String.fromCharCode(...header.slice(8, 12)) === 'WEBP'
          ? 'image/webp'
          : null
  if (!mime || mime !== blob.type)
    throw new Error('Only genuine PNG, JPEG or WebP images are supported')
  const declared = imageDimensions(header, mime)
  if (!declared || declared.some((v) => v < 1 || v > 4096) || declared[0] * declared[1] > 16000000)
    throw new Error('Invalid image header or dimensions exceed limits')
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  bitmap.close()
  if (width > 4096 || height > 4096 || width * height > 16000000)
    throw new Error('Image dimensions exceed 4096 px or 16 megapixels')
  return { id, mime, blob, width, height, byteLength: blob.size, ...(filename ? { filename } : {}) }
}
export function imageDimensions(bytes: Uint8Array, mime: string): [number, number] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (
    mime === 'image/png' &&
    bytes.length >= 24 &&
    String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR'
  )
    return [view.getUint32(16), view.getUint32(20)]
  if (mime === 'image/jpeg') {
    for (let offset = 2; offset + 9 < bytes.length;) {
      if (bytes[offset] !== 255) return null
      const marker = bytes[offset + 1]
      if (marker === 255) {
        offset++
        continue
      }
      if (marker === 216 || marker === 1 || (marker >= 208 && marker <= 215)) {
        offset += 2
        continue
      }
      if (marker === 218 || marker === 217) return null
      const length = view.getUint16(offset + 2)
      if (length < 2 || offset + 2 + length > bytes.length) return null
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker))
        return [view.getUint16(offset + 7), view.getUint16(offset + 5)]
      offset += length + 2
    }
  }
  if (mime === 'image/webp' && bytes.length >= 30) {
    const type = String.fromCharCode(...bytes.slice(12, 16))
    const le24 = (offset: number) =>
      bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536
    if (type === 'VP8X') return [le24(24) + 1, le24(27) + 1]
    if (type === 'VP8 ' && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42)
      return [view.getUint16(26, true) & 16383, view.getUint16(28, true) & 16383]
    if (type === 'VP8L' && bytes[20] === 47)
      return [
        1 + ((bytes[21] | (bytes[22] << 8)) & 16383),
        1 + (((bytes[22] >> 6) | (bytes[23] << 2) | (bytes[24] << 10)) & 16383),
      ]
  }
  return null
}
