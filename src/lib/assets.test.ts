import { expect, it, vi } from 'vitest'
import { imageDimensions, verifyImage } from './assets'
import { uuid } from '../features/invoices/defaults'
it('reads bounded raster headers before decoding pixels', () => {
  const png = new Uint8Array(24)
  png.set([73, 72, 68, 82], 12)
  const view = new DataView(png.buffer)
  view.setUint32(16, 4096)
  view.setUint32(20, 32)
  expect(imageDimensions(png, 'image/png')).toEqual([4096, 32])
  expect(imageDimensions(new Uint8Array([255, 216, 255, 0]), 'image/jpeg')).toBeNull()
  const webp = new Uint8Array(30)
  webp.set([86, 80, 56, 88], 12)
  webp[24] = 9
  webp[27] = 19
  expect(imageDimensions(webp, 'image/webp')).toEqual([10, 20])
})
it('rejects an SVG or an image bomb before invoking the decoder', async () => {
  const decode = vi.fn()
  vi.stubGlobal('createImageBitmap', decode)
  const blob = {
    size: 20,
    type: 'image/png',
    arrayBuffer: async () => new TextEncoder().encode('<svg><script/></svg>').buffer,
  } as Blob
  await expect(verifyImage(blob, uuid())).rejects.toThrow('genuine')
  const png = new Uint8Array(24)
  png.set([137, 80, 78, 71])
  png.set([73, 72, 68, 82], 12)
  new DataView(png.buffer).setUint32(16, 100000)
  await expect(
    verifyImage({ ...blob, arrayBuffer: async () => png.buffer }, uuid()),
  ).rejects.toThrow('dimensions')
  expect(decode).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})
