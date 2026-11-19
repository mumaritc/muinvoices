import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type Plugin } from 'vite'
export function appShell(): Plugin {
  let output = ''
  return {
    name: 'muinvoice-app-shell',
    apply: 'build',
    configResolved(config) {
      output = config.build.outDir
    },
    async closeBundle() {
      const paths: string[] = []
      async function walk(directory: string) {
        for (const entry of await readdir(join(output, directory), { withFileTypes: true })) {
          const path = directory ? directory + '/' + entry.name : entry.name
          if (entry.isDirectory()) await walk(path)
          else if (path !== 'sw.js') paths.push(path)
        }
      }
      await walk('')
      paths.sort()
      const hash = createHash('sha256')
      for (const path of paths) hash.update(path).update(await readFile(join(output, path)))
      const cache = 'muinvoice-shell-' + hash.digest('hex').slice(0, 16)
      // Only public app-shell URLs are cached; ignore host Vary headers for these static files.
      const source = `const CACHE=${JSON.stringify(cache)};
const ASSETS=${JSON.stringify(paths.map((path) => './' + path))};
const URLS=new Set(ASSETS.map(path=>new URL(path,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('muinvoice-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const navigation=request.mode==='navigate'&&url.pathname.startsWith(new URL('./',self.location.href).pathname);
 if(!URLS.has(url.href)&&!navigation)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(navigation?'./index.html':request,{ignoreVary:true});return cached||fetch(request)})());
});`
      await writeFile(join(output, 'sw.js'), source)
    },
  }
}
