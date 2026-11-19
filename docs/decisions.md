# muinvoice decisions

Status: implementation baseline · 16 November 2026.

These are the product and engineering defaults for v1. They are engineering/product policies, not legal guidance. Change a decision only for a concrete problem; update this file, affected schemas, fixtures and documentation together.

## Confirmed product decisions

| ID  | Decision                                                                                                               | Reason / consequence                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| D01 | Name is always muinvoice; free and open source, MIT license                                                            | Consistent package metadata, UI, backup discriminator and docs; preserve third-party notices       |
| D02 | Invoice designer with local document management                                                                        | No accounting ledger, inventory, payment tracking, sending, recurring billing or customer balances |
| D03 | Client-only static application; no accounts/server/remote database                                                     | IndexedDB and localStorage are local browser APIs; backups belong to the user                      |
| D04 | React/Vite/TypeScript, Tailwind v4, shadcn/ui Base UI, Zustand, RHF/Zod                                                | One small SPA; no Next.js/SSR or parallel UI primitive system                                      |
| D05 | 25 structural designs, every design supports en/ar/bilingual                                                           | Color variants cannot satisfy the count; preserve the agreed catalog                               |
| D06 | Shared data model, calculation engine and printable renderer                                                           | Templates are presentation only; preview and browser PDF/print use the same invoice DOM            |
| D07 | Flexible bilingual fields, local logos/signatures, custom labels/sections                                              | No imposed legal invoice schema, automatic translation, or arbitrary HTML                          |
| D08 | Multiple company profiles and invoice-local snapshots                                                                  | Editing defaults/profile data cannot rewrite an existing document                                  |
| D09 | User-defined percentage taxes; per-item fixed/percent discounts; optional overall discount; inclusive/exclusive prices | One explicit arithmetic policy and real regression fixtures required                               |
| D10 | Versioned JSON backs up the whole workspace, including settings and embedded assets; merge and replace                 | Portable restore without an account; validate before committing                                    |
| D11 | Optional five-field ZATCA Phase 1-format QR only                                                                       | No regulatory-compliance/certification claim; no Phase 2 work                                      |
| D12 | UI language independent of document language; self-hosted Arabic-capable fonts                                         | Arabic is a layout/reading-order requirement, not only translated labels                           |

## Implementation defaults

| ID  | Choice                                                                                                 | Alternative intentionally omitted                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| D13 | npm, one package/lockfile, strict TS; resolve current compatible versions at scaffold                  | Monorepo, library packaging, speculative version pinning in planning docs                |
| D14 | decimal.js; canonical decimal strings; half-up rounding per line/tax at currency scale                 | Floating-point money, per-template rounding, statutory correctness claims                |
| D15 | Additive taxes, net-base discounts, proportional overall discount with largest-remainder allocation    | Compounding, withholding, negative credits, order-dependent discount allocation          |
| D16 | Tax-inclusive input is converted to net before discount; fixed discounts are explicitly net            | Ambiguous “fixed discount on gross” behavior; see architecture.md for minor-unit effects |
| D17 | ISO currency codes, one currency/invoice, Gregorian dates, explicit issue instant and display timezone | Currency conversion, arbitrary currency precision, Hijri calendar in v1                  |
| D18 | RHF buffers active invalid input; Zustand holds only valid committed snapshots                         | Two independent durable forms of the same invoice; silent zero substitution              |
| D19 | Whole-workspace canonical record + asset store in IndexedDB; localStorage is a preference mirror       | Parallel authoritative settings stores, SQL-like query/repository architecture           |
| D20 | Autosave at 500 ms, serialized writes, truthful save status, conflict protection for multiple tabs     | Blind last-writer wins and reliance on unload handlers                                   |
| D21 | Merge is local-wins with visible skips; replace is atomic and explicitly confirmed                     | Timestamp-based overwrite, hidden conflict resolution or automatic ID remapping          |
| D22 | Complete backups always embed referenced user assets; 25 MiB import cap                                | “Portable” exports that refer to inaccessible Blob URLs or remote images                 |
| D23 | Raster uploads only; 2 MiB/image, decoded size limits; bundled font allowlist                          | SVG sanitization pipeline, arbitrary font upload or remote asset fetching                |
| D24 | Finalized is an editable local status via explicit return to draft                                     | An immutable audit log, government issuance workflow or legally controlled numbering     |
| D25 | Column reorder via accessible move controls; controlled style tokens                                   | Drag framework, arbitrary CSS editor, freeform canvas/page designer                      |
| D26 | A4 portrait; flowing screen preview; native print pagination is authoritative                          | Separate PDF renderer, exact screen page-count promise or custom pagination engine       |
| D27 | Three bundled font choices; EN/AR dictionaries; locale-aware display with canonical inputs             | Remote Google Fonts, full i18n framework or unreviewed automatic translations            |
| D28 | QR limited to supported SAR/VAT-only configurations; totals always derived                             | Mislabeling a sum of arbitrary taxes as VAT; manual QR totals                            |
| D29 | App works without network after load; final release includes app-shell cache for offline reopen        | Backend, background sync, installation workflow, invoice data in service-worker cache    |
| D30 | Short vertical slice first, then capability completion, then template batches                          | Building 25 weak templates before calculations/storage/print are proven                  |

## Scope retained for v1

Local invoice list; create/open/duplicate/delete; reusable company profiles; seller/customer fields; invoice metadata and draft/finalized status; item description/SKU/unit/quantity/price; custom named taxes and breakdown; inclusive/exclusive pricing; line and overall discounts; terms/payment/notes/key-value sections; all table column controls; fonts/colors/spacing/borders/logo/signature; gallery; UI settings; autosave; reminders; merge/replace backup; optional QR; A4 live preview and browser printing; offline reopen.

## Deferred scope

Quotation conversion, credit notes, receipts, inventory, customer database/CRM, actual payment statuses, bank connections, exchange rates, online invoice links, email sending, recurring invoices, backend/auth, cloud sync, arbitrary page sizes, template marketplace/editor, remote fonts, uploaded fonts, arbitrary rich text, standalone PDF download engine, Phase 2/XML/signing/clearance/reporting, and any guarantee of regulatory compliance. Do not implement these as stubs or feature flags.

## Risks and release evidence

1. Browser data can be lost or read on a shared device. Clear local-storage messaging, backup/restore testing and honest save errors are mandatory; browser persistence is not a guarantee.
2. Native browser pagination differs. Print CSS and automated PDFs need visual review, particularly on Safari and physical printers. Known gaps go in release notes.
3. Arabic shaping, mixed identifiers and bilingual density need native-reader review. Fonts need redistribution licenses and shaping coverage checks.
4. Tax and rounding semantics vary by jurisdiction. The arithmetic policy is deterministic design behavior, not a tax compliance engine. Never preselect a tax solely from a user's language/location.
5. Official ZATCA documentation can change or move. The QR gate requires current source verification, known-answer byte tests and scanner checks; no feature completion can turn this product into a compliant issuance system.
6. JSON limits bound accidental resource exhaustion, not encryption or access control. Users must protect downloaded files and their browser/device.

## Implementation notes · 17 November 2026

- Node 24 LTS is the documented/tested baseline (24.22.0, npm 12.2.1). The engine range
  permits Node 24 or 26+ because the current test stack excludes older releases.
  Stable resolved versions are recorded in package-lock.json; TypeScript ESLint was
  updated to 8.73.0 to remove a minimatch advisory. No dependency override remains.
- Native IndexedDB transactions were kept; no repository layer or IndexedDB wrapper
  dependency was needed. A full workspace plus images is committed atomically.
- Settings add optional `lastChangedAt` for the seven-day backup reminder. A successful
  export updates `lastExportedAt` without treating the export itself as a content edit.
- Unreadable/future local records open a read-only recovery screen. The separate
  `app: "muinvoice-recovery", recoveryVersion: 1` download preserves the raw record and
  images for troubleshooting; it is explicitly not an ordinary import format.
- Template switching preserves all existing design values. Explicit Reset design
  applies the selected composition's defaults. This avoids inferring whether a
  persisted value was an intentional override.
- The production app shell is generated from the completed build's content hash.
  Its allowlisted public files use cache matching that ignores host Vary headers;
  Vite preview's Vary behavior otherwise prevented script/style reuse offline.
  No workspace, upload Blob or backup request is cached by the worker.
- Editor and QR code are loaded only when used; all emitted chunks are included in
  the offline shell. QR was added after the Pure print foundation was exercised.
- PyMuPDF, pngjs/jsQR and axe are development verification tools. They are not app
  services or alternative invoice/PDF rendering paths. Public thumbnails are real
  synthetic InvoiceRenderer captures. Runtime and development dependencies are separated in package.json.

The original scope and monetary policy remain unchanged. See [release status](release.md)
for verification and the remaining reviews.

## Editor extension · 18 November 2026

The requested navigation changes reuse the house button/field components. The sidebar
is hidden automatically while an invoice is open, instead of adding a collapse control.
Header/footer text belongs to invoice content and survives a design reset. Seller-caption
visibility and QR layout belong to design snapshots. Schema defaults accept existing v1
records/backups. QR layout is centralized in InvoiceRenderer so every composition prints
exactly one QR at the selected position; encoding/calculations are unchanged.
See the [user guide](guide.md) for behavior and [release status](release.md) for verification.

## Source notes

Technical references: [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite), [W3C bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/), [ZATCA QR structure](https://zatca1.discourse.group/t/structure-of-the-qr-code-for-electronic-tax-invoices/483). These support integration/encoding guidance, not the product-specific policies above. Direct official PDF retrieval was unreliable during planning; current regulatory applicability remains unassessed.
