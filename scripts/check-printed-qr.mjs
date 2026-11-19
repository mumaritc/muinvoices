import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import assert from 'node:assert/strict'
const png = PNG.sync.read(readFileSync('output/playwright/pure-qr-scan.png'))
const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
assert.ok(result, 'No QR found in rasterized browser PDF')
const bytes = Buffer.from(result.data, 'base64')
const fields = []
for (let offset = 0; offset < bytes.length;) {
  const tag = bytes[offset++]
  const length = bytes[offset++]
  fields.push({ tag, value: bytes.subarray(offset, offset + length).toString('utf8') })
  offset += length
}
assert.deepEqual(
  fields.map((f) => f.tag),
  [1, 2, 3, 4, 5],
)
assert.equal(fields[0].value, 'Synthetic QR Seller')
assert.equal(fields[1].value, '300000000000003')
assert.equal(fields[3].value, '115.00')
assert.equal(fields[4].value, '15.00')
console.log(
  'Rasterized browser PDF: independent QR decode matches seller, VAT, field order and totals.',
)
