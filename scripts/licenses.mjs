import assert from 'node:assert/strict'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
// Include the production dependency closure, plus tools whose code/CSS can reach the build.
const bundledTools = new Set([
  'node_modules/tailwindcss',
  'node_modules/vite',
  'node_modules/rolldown',
])
const sections = [
  'muinvoice third-party licenses\nGenerated from package-lock.json and installed package license files.\nIncludes production dependencies, even when tree-shaken from the browser build.',
]
for (const [path, entry] of Object.entries(lock.packages).sort(([a], [b]) =>
  a.localeCompare(b, 'en'),
)) {
  if (!path || (entry.dev && !bundledTools.has(path))) continue
  const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'))
  assert.equal(pkg.version, entry.version, `Run npm ci: installed version differs at ${path}`)
  const files = (await readdir(path))
    .filter((name) => /^(licen[sc]e|copying|notice|third-party-license)([.-]|$)/i.test(name))
    .sort()
  assert(
    files.some((name) => /^(licen[sc]e|copying)([.-]|$)/i.test(name)),
    `Missing license: ${pkg.name}`,
  )
  sections.push(
    `${pkg.name}@${pkg.version}\nLicense: ${entry.license ?? pkg.license}\n${(await Promise.all(files.map(async (name) => `${name}\n${(await readFile(join(path, name), 'utf8')).trim()}`))).join('\n\n')}`,
  )
}
assert(sections.length > 1, 'No dependency licenses collected')
await writeFile(
  'public/licenses/dependencies.txt',
  sections.join('\n\n' + '='.repeat(72) + '\n\n') + '\n',
)
await writeFile('public/licenses/muinvoice.txt', await readFile('LICENSE'))
console.log(`Collected ${sections.length - 1} package license notices`)
