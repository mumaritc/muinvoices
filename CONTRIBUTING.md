# Contributing to muinvoice

Use Node 24 LTS and npm with the committed lockfile. Run `npm ci`, then `npm run dev`.
Read `docs/architecture.md`, `docs/decisions.md` and `docs/rules.md` first.
See `docs/release.md` for verification and outstanding reviews.

Keep domain types inferred from Zod. Money belongs in `src/lib/calculations.ts`;
templates only arrange the shared printable blocks. RHF owns invalid edits and
Zustand owns valid snapshots. Do not add persistence or arithmetic to a template.
Never reset storage to recover from a schema/migration error.

Use synthetic fixtures. Do not commit invoice/customer data, backups, credentials,
browser traces, `dist/`, `node_modules/`, `.tools/` or `output/`.
No server, remote database, sign-in, analytics, remote font/QR services or Phase 2
integration is in scope.

Before submitting a change, run format check, lint, typecheck, unit/integration
tests and build. Run the browser suite for editor/renderer/storage changes and
the production offline suite for build/cache changes. Install Chromium and Firefox
with `npx playwright install chromium firefox`. Tests use native browser print;
no standalone PDF renderer is shipped.

For template changes, run `npm run test:e2e -- --project=chromium --grep "batch "`,
inspect all language modes and long print flow. In PowerShell, set
`$env:UPDATE_THUMBNAILS='1'` for that command to regenerate the real gallery thumbnails,
then remove that environment variable. Preserve explicit invoice design controls.

Record actual commands/results and manual review in docs/release.md. Do not
mark native Arabic, physical printing/scanning, Safari or hosted CI checks passed
without that evidence. Automated accessibility/RTL checks are not native-reader
or full assistive-technology approval.

Production builds regenerate `public/licenses/dependencies.txt` from locked package
licenses. Commit regenerated notices with dependency changes; preserve upstream
copyright and license text. `npm run licenses` regenerates them without building.
Publishing the source does not require removing `private: true` from package.json;
that flag prevents accidental npm publication. See [deployment](docs/deployment.md).
