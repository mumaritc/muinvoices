# User guide

A free, MIT-licensed, open-source invoice designer that runs in your browser. Edit an invoice, choose one of 25 compositions, customize English/Arabic/bilingual output, and print or save PDF through the browser.

muinvoice is public beta. See [release status](release.md) for verified behavior and remaining compatibility reviews.

## Run locally

Use **Node 24 LTS** (tested with 24.22.0) and npm. The package supports Node 24 or 26+; older Node versions are intentionally excluded by the current test tooling.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. No environment variables, credentials, backend, accounts or remote database are needed.

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium firefox
npm run test:e2e
npm run test:offline
npm run preview
```

Use `npm ci` with the committed lockfile for reproducible setup.

## What works

- Local invoice list: create, open, duplicate and delete; reversible draft/finalized editing state.
- Invoice-local seller/customer, taxes, design and sections; reusable company profiles/defaults never rewrite existing invoices.
- Named additive taxes, inclusive/exclusive prices, line and overall fixed/percentage discounts, zero/exempt/untaxed treatments, and one decimal calculation engine.
- Independent interface/document language, bilingual order/fallback, three bundled Arabic-capable fonts, colors, bounded typography/spacing, logo/signature and all table column controls.
- Text or key/value sections before items, after items or at the end of the document.
- Exactly 25 structural compositions. Gallery thumbnails are generated from the real renderer using synthetic data.
- IndexedDB autosave, explicit save, truthful failures, writer-tab protection, full asset-inclusive JSON backup merge/replace, and raw recovery for unsupported/damaged local schemas.
- One live/print invoice DOM, A4 flowing output, current-value local QR generation, and production app-shell caching for offline reopening.

The document timezone is explicit and Gregorian. Arabic-Indic decimal input is normalized to ASCII; use a decimal point or Arabic decimal separator, without grouping separators. Stored identifiers are never localized or translated. Enter your own content translations; missing content falls back to the available language.

Changing a template preserves the current design controls. **Reset design** applies that template's defaults and leaves invoice content intact. Too many columns or extreme width choices can be difficult to read; inspect browser print preview.

While editing, the workspace sidebar is hidden to give the form and preview more room;
use **Invoices** in the toolbar to return. **Details** has Invoice details,
Company / From, Bill to and ZATCA subtabs.
**Items & taxes** separates line items (including their tax selection) from named tax
definitions. **Design** has Appearance, Table columns and Labels subtabs.
Company / From includes saved profiles and a switch to hide only
the seller's “From” label. Appearance provides bilingual custom header/footer text;
that content survives a design reset. ZATCA places the QR at the top or bottom and
physically left, center or right, independently of document reading direction.

Existing v1 records/backups load with the seller label visible, empty custom text and
a bottom-right QR. Newly customized backups require the current application build;
older strict readers may reject the added fields while preserving their local data.

## Save, back up and recover

IndexedDB holds the canonical workspace and raster images. localStorage mirrors only a small language preference; it never hydrates invoice data. Valid changes autosave after 500 ms through serialized transactions. Saved is reported only after transaction completion.

RHF keeps invalid edits in the form. A clearly labeled preview continues to show the last valid snapshot; invalid buffers are not saved or exported, and print/finalize are disabled. Navigation asks before discarding invalid edits.

Keep unencrypted JSON backups. Browser storage is not encrypted, can be cleared/evicted, and does not sync between devices or origins. Static hosting receives ordinary application-file requests; invoice content is not uploaded. A writer lock prevents concurrent editing where available, with transactional revision checks as a fallback.

**Backups & settings** validates a complete file before showing the import plan. Merge keeps local settings and records, reports identical/conflicting records, and skips records that depend on conflicting images. Replace requires explicit destructive confirmation and commits the whole workspace/images atomically. Unsupported versions reject without clearing storage. The initial format is `app: "muinvoice", schemaVersion: 1`; no historical migration format is invented.

Limits: 25 MiB JSON, 1000 invoices, 1000 items/invoice, 100 company profiles, 100 images, 100 custom entries/entity and 10,000 characters/text field. PNG/JPEG/WebP uploads must be at most 2 MiB, 4096 px per side and 16 megapixels; their type, headers and decoded dimensions are checked. SVG, remote image URLs and executable HTML/CSS are not supported.

If local schema validation fails, editing opens a recovery screen and preserves the stored record. Download the **raw recovery file** before troubleshooting. Raw recovery files are diagnostic data, not ordinary importable backups. When storage is denied, current in-memory work remains exportable; no saved guarantee is shown.

## Rounding policy

Financial inputs are canonical decimal strings. decimal.js uses 40-digit precision and half-up rounding at the currency scale. The committed currency table includes SAR/USD (2), JPY (0) and KWD (3).

Recover inclusive net before applying discounts. Round the line net base; line fixed discounts are net amounts and must fit the currency scale. Allocate the rounded overall discount proportionally in minor units, using largest remainders with stable row-order ties. Round each additive tax on each line, then sum the rounded results. Hiding/reordering columns changes no arithmetic. Imported totals have no authority and are rejected as unknown fields.

Examples: 1000 less 10% plus 15% VAT = **1035.00**; 115 inclusive at 15% = net 100.00 + tax 15.00. Inclusive multi-tax results can differ by a minor unit from entered gross under this policy. This deterministic design policy does not establish tax-law correctness.

## Printing and offline use

Use A4 portrait, 100% scale, and disable browser headers/footers. Background graphics are optional. The screen shows a continuous document, not an exact page-count promise; browser print preview determines actual pagination. Printing waits for save, fonts, images and the current QR. Canceling print does not finalize the invoice.

Chromium PDF text/bounds checks and visual contact sheets cover short, 100-row and oversized content. Firefox automated rendering/core flows also run. Real Safari, native Firefox print preview and physical printer differences remain release gates.

The production build caches its static app shell, fonts, QR chunk and template resources after a complete load. The development server does not install a service worker. Updates are explicit: return to the invoice list, then save and update. Invoice data/backups are never placed in the service-worker cache.

Deploy the static `dist/` directory over HTTPS (localhost is suitable for development), with a trailing slash at the application URL. Relative Vite assets and the worker scope support root or subpath hosting; both are covered by production tests. See [deployment](deployment.md). Serve `sw.js` with revalidation rather than immutable long-term caching. If an app cache breaks, reconnect, unregister only the muinvoice worker and remove its `muinvoice-shell-` caches; do not clear IndexedDB. Reloading then rebuilds the shell cache.

## Optional QR

Generates a ZATCA Phase 1-format QR code only. muinvoice does not claim regulatory compliance, certification, or Phase 2 support. You are responsible for checking applicable invoicing requirements.

The option is off by default, supports the specified SAR/VAT-only configuration and requires an explicit seller-language/VAT mapping. Five UTF-8 TLV fields are encoded locally into Base64. Totals and time come from the current valid invoice. Unsupported enabled configurations block printing until corrected or disabled. There is no XML issuance, signing, clearance or reporting. [Source review and limits](qr-source-notes.md).

## Contributing and evidence

Read [CONTRIBUTING](../CONTRIBUTING.md), [decisions](decisions.md), [architecture](architecture.md) and [rules](rules.md). Preserve one schema-derived model, engine and renderer.

Browser artifacts are generated under ignored `output/playwright/`. Optional PDF inspection uses Python/PyMuPDF:

```sh
python -m pip install pymupdf
python scripts/check-pdfs.py
python scripts/review-matrix.py
node scripts/check-printed-qr.mjs
```

PyMuPDF is a development inspection tool, not part of the browser app or a second invoice/PDF renderer. See [third-party notices](../THIRD_PARTY_NOTICES.md) and [MIT license](../LICENSE).
