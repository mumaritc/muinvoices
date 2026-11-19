# muinvoice architecture

Application contracts and implementation boundaries. See [release status](release.md)
for verification and remaining reviews, and the [user guide](guide.md) for behavior.

## Product boundary

muinvoice is a free, MIT-licensed, open-source invoice designer running entirely in the user's browser. Enter information once, select a template, customize it, preview A4 output, and print or save PDF through the browser. Multiple local invoices and reusable company profiles are in scope. There is no server application, remote database, account, sign-in, cloud sync, payment processing, or accounting ledger. IndexedDB is browser-local storage; “no database” means no hosted database or database server.

All 25 templates support English, Arabic, and bilingual Arabic/English output. UI language is independent of document language. Tax settings are user-supplied design/calculation inputs, not jurisdictional tax advice. Optional ZATCA Phase 1-format QR generation does not establish regulatory compliance.

## Stack and dependency budget

| Concern         | Choice and boundary                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| App             | React, Vite, TypeScript strict mode; static SPA                                                                |
| Styling         | Tailwind v4 with its Vite plugin; semantic editor tokens and separate invoice CSS tokens                       |
| Editor controls | shadcn/ui with Base UI primitives, only components actually used; Lucide icons                                 |
| State           | Zustand for workspace/session state; React Hook Form for active editing; Zod schemas and inferred domain types |
| Calculation     | decimal.js, confined to one pure calculation module                                                            |
| Persistence     | IndexedDB for canonical workspace and binary assets; localStorage for a tiny preference mirror                 |
| QR              | One maintained local QR encoder/rendering dependency, provisionally qrcode; custom small pure TLV encoder      |
| Language        | Typed English/Arabic dictionaries, Intl for presentation; no translation framework initially                   |
| Tests           | Vitest, React Testing Library, Playwright; test libraries are development-only                                 |

Use npm and commit one lockfile. Resolve compatible stable versions during implementation and record the required Node version. Do not copy speculative versions from this document. A small IndexedDB helper such as idb is allowed only if native transaction handling becomes less clear; record the reason. No router is required for four local views, no general PDF engine, canvas screenshot library, rich text editor, drag-and-drop framework, or generic form builder.

Official setup references: [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [Base UI default announcement](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-07-base-ui-default.mdx), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite). Verify actual CLI options and component APIs when scaffolding; explicitly select Base UI.

## Structure and dependency direction

```text
src/
  app/                 App, local view switching, startup/hydration
  components/ui/       generated shadcn controls
  components/editor/   details, items, design and section forms
  components/invoice/  InvoiceRenderer and shared printable blocks
  features/invoices/   schema, defaults, workspace store, editor orchestration
  features/companies/  profile editing and snapshot creation
  features/templates/ registry and presentational layout compositions
  features/settings/  preferences and reusable defaults
  lib/                 calculations, currency, storage, backup, printing, zatca-qr
  locales/             en and ar dictionaries
  styles/              globals.css, invoice.css, print.css
tests/                 fixtures and cross-module/browser scenarios
public/                bundled licensed fonts and app-shell assets
```

Create directories as needed, not empty placeholders. Tests may live beside their modules. Schemas define types once; avoid separate interfaces that drift from Zod. Domain modules never import React, Zustand, DOM, or storage. Templates depend on printable data and shared blocks, never on editor controls or stores.

```text
RHF edits -> valid invoice snapshot -> Zustand workspace -> debounced IndexedDB
                     |
                     v
              calculateInvoice
                     |
                     v
            printable view model + validated QR payload
                     |
                     v
             InvoiceRenderer(templateId)
                     |
           live preview / same DOM in browser print
```

## Domain and serialization contract

All IDs are opaque UUIDs from crypto.randomUUID; array order is explicit display order. Text is Unicode plain text. Store decimal inputs as canonical ASCII decimal strings, dates as ISO date strings, timestamps as ISO 8601 with explicit offset or Z. Display formatting never becomes stored financial input. Blob URLs, computed totals, QR images, errors, form buffers, and transient view state are not authoritative backup data.

| Entity         | Required shape and semantics                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| LocalizedText  | `{ en?: string, ar?: string }`; blank permitted in drafts; no automatic translation                                                                   |
| CustomField    | `id`, localized `label` and `value`, `visible`; ordered array                                                                                         |
| PartySnapshot  | localized name/address, VAT/registration identifiers, phone/email/website, custom fields, optional logo asset ID; fields optional in drafts           |
| CompanyProfile | ID, profile label, party data, default currency/taxes/design/sections, timestamps                                                                     |
| TaxDefinition  | ID, localized name, decimal percentage, `kind: vat                                                                                                    | other`; invoice-local snapshot                                                                                                                   |
| Tax treatment  | Item `taxed                                                                                                                                           | zeroRated                                                                                                                                        | exempt                                                              | none`; taxed references one or more invoice-local tax IDs; zero/exempt may carry localized explanation and a zero-rate tax reference                                                                                                           |
| Discount       | `type: percent                                                                                                                                        | fixed`, decimal `value`; fixed is in invoice currency, on the net base defined below                                                             |
| InvoiceItem    | ID, localized description, optional SKU/unit, quantity, unit price, optional discount, tax treatment and tax IDs                                      |
| InvoiceSection | ID, localized title, `kind: text                                                                                                                      | keyValue`, localized text or ordered custom fields, `visible`, `position: beforeItems                                                            | afterItems                                                          | footer`                                                                                                                                                                                                                                        |
| InvoiceDesign  | template ID; document mode; bilingual order `en-first                                                                                                 | ar-first`; font IDs, accent/text colors, font size/spacing presets, logo placement/size, border preset, column configuration and label overrides |
| Column config  | Ordered list of known column IDs, `visible`, localized label, alignment, width weight; never executable CSS                                           |
| Invoice        | ID, invoice number, `type: invoice                                                                                                                    | tax-invoice                                                                                                                                      | simplified-tax`, `status: draft                                     | finalized`, issuedAt, display timezone, dueDate, PO/reference, currency code, price mode, seller/customer snapshots, tax definitions, items, optional overall discount, sections, design, optional signature asset ID, QR settings, timestamps |
| AppSettings    | UI language, default currency/document language, default design/taxes, default company ID, backup reminder preference and last successful export time |
| Asset          | ID, `mime: image/png                                                                                                                                  | image/jpeg                                                                                                                                       | image/webp`, Blob, byte size, decoded dimensions, optional filename |

Use three bundled font choices with Arabic coverage (for example Noto Sans Arabic, Cairo, IBM Plex Sans Arabic) and compatible Latin fallbacks. Verify font licenses, redistribute notices, and ensure subsets retain shaping coverage. Arbitrary uploaded fonts are outside v1. Logo and signature image uploads are included. Terms, notes, payment details and bank information use the same section model. No special parallel notes/terms data store.

Invoice seller, taxes, sections and design are snapshots copied from defaults at creation. Editing a profile/default never changes existing invoices. Selecting a replacement profile on an invoice is an explicit action. Finalized is a local UI status: require an explicit “Edit finalized invoice” action to return to draft; it is editable and deletable, not legally immutable. Invoice numbers are user-editable with a duplicate warning, without a legal sequencing promise. Duplicate creates new IDs/timestamps, draft status and a new suggested number; it retains content, design and asset references.

## Form and state ownership

RHF owns the active form values, including temporarily blank or invalid decimal inputs. On valid changes, publish a complete normalized invoice snapshot to Zustand; selectors calculate the preview from that snapshot. Invalid changes remain visible in the editor, with a clear “preview shows last valid values” state, and disable print/finalize. No reciprocal watch/reset loop: reset RHF only on switching invoices, successful import, or explicit replace/revert. Before leaving an invalid form, warn that invalid edits are not saved and allow staying or discarding them.

Zustand owns the valid workspace, active ID, save state and revision. It does not duplicate derived totals. Read storage before enabling edits, so defaults cannot overwrite saved data. A serialized write queue saves the newest workspace after a 500 ms debounce; explicit save, navigation and print flush queued changes. Show saving/saved/error truthfully only after transaction completion. Do not rely on asynchronous unload writes. For v1, allow one writer tab per origin using a browser lock where supported; otherwise detect competing revisions and stop autosave with a conflict message instead of silently overwriting.

## One calculation engine

`calculateInvoice(invoice)` is pure: returns line results, discounts, taxable bases, tax breakdowns and totals as decimal strings, or structured errors. Decimal precision is 40 significant digits with ROUND_HALF_UP. Accept at most 6 decimal places for quantity and unit price, 4 for percentages; bound magnitudes to 12 integer digits and reject results exceeding configured decimal capacity. Currency scale comes from a committed currency metadata table/Intl-resolved fixture for supported ISO codes; test SAR/USD (2), JPY (0), KWD (3). No currency conversion or mixed currencies.

V1 calculation policy is a product decision, not a claim about statutory rounding:

1. Prices are tax-exclusive by default; price mode is invoice-wide. Multiple taxes on one item are additive percentages on the same net base, never compounded.
2. For each item compute quantity × unit price. For inclusive mode divide that amount by `1 + sum(applicable rates)/100` to recover net. Zero-rated, exempt and untaxed have zero rate. Round the resulting net line base to currency scale.
3. Apply item discount to that net line base; percentage discounts round to currency scale and fixed discounts must already fit that scale. Subtract to get discounted net. Fixed discounts always mean net discount, even for inclusive prices; explain this next to the field.
4. Compute the optional overall discount on the sum of discounted net lines. Allocate its rounded amount proportionally across positive discounted net lines in currency minor units: floor each share, then distribute remaining units by descending fractional remainder, stable item order for ties. Zero lines get zero. Overall discount cannot exceed that subtotal; a zero subtotal permits only zero discount.
5. Each line's taxable base is discounted net minus allocated overall discount. Calculate and round each applicable tax separately per line at currency scale. Sum rounded tax amounts by tax snapshot ID/rate/treatment; zero/exempt categories stay distinguishable.
6. Sum line bases and line taxes. `grandTotal = netTotal + taxTotal`; gross subtotal, item discounts and overall discount are available for transparent display. Do not calculate taxes a second time at invoice summary level.

Validate nonnegative finite inputs, percentages 0–100, unique tax references, positive quantities for printable items, discounts within the available base, and valid currency scale. No negative/credit invoices, tax-on-tax, fees, withholding, deposits or partial payments in v1. Never silently clamp bad inputs or turn blank input into zero. Drafts may be incomplete; print/finalize require an invoice number, issue timestamp, seller name, currency and at least one valid described item. Customer fields remain optional; type labels do not enforce legal schemas.

Golden fixtures include: 1 × 1000 exclusive, 10% line discount, 15% VAT => base 900, VAT 135, total 1035; 1 × 115 inclusive at 15% => 100/15/115; two net lines 100 at 15% and 100 untaxed, overall fixed discount 20 => bases 90/90, VAT 13.50, total 193.50; three one-cent untaxed lines with overall one-cent discount => allocations .01/.00/.00 and total .02. Inclusive multi-tax totals can differ by a minor unit from entered gross after the specified per-tax rounding; show the calculated totals and document this policy rather than introduce hidden balancing amounts.

## Template system and localization

A static registry maps stable template IDs to metadata, defaults, thumbnail, and composition component. `InvoiceRenderer` creates one validated printable view model (including calculated values) and selects the composition. Shared PartyDetails, InvoiceMetadata, ItemsTable, Totals, Sections, QR and Footer own field visibility, formatting and accessibility. Templates arrange these blocks and supply bounded style tokens. Do not invent a template DSL, layout interpreter, or one renderer per output target.

Twenty-five means 25 distinct compositions, not 25 colors. The [composition review](template-review.md) records their structural differences. Each design differs from its nearest sibling on at least two structural axes: header/party placement, metadata hierarchy, table treatment, totals placement, section/footer arrangement. Font/color changes alone do not qualify. Keep shared blocks reusable without forcing all templates into identical geometry.

All modes render every field when present and visible. Single-language mode prefers that language and falls back to the other with correct direction; bilingual mode shows both if present, once if identical, without blank placeholders. Show missing translations in the editor, never fabricate them. Labels follow the same rule after overrides. UI dictionaries are independent. Use logical CSS properties, root `lang`/`dir`, field-level direction and `bdi` isolation for invoice numbers, emails, URLs, bank references and mixed user text. Arabic forms support Arabic-Indic digits by normalizing to ASCII at input parsing; reject ambiguous mixed separators. Provide an explicit decimal separator rule per UI locale, never guess grouping. Store ISO identifiers unchanged. Document numeral preference affects amounts only. Use a Gregorian date policy and an explicit document display timezone; changing a device timezone must not alter the stored issue instant.

For bidi implementation follow [W3C inline guidance](https://www.w3.org/International/articles/inline-bidi-markup/). Arabic text and UI copy need native-speaker review before release; no native translation review or legal correctness is implied.

Columns: row number, SKU, description, quantity, unit, unit price, discount, tax, line total. All can be hidden/reordered/renamed and have alignment/width weights changed, but keep at least one visible column. Hiding a value never removes it from calculation. Protect readable column widths and warn on impractical combinations; use move-up/down controls rather than a drag library. Switching templates changes the composition and template ID; preserve explicit user overrides, content, taxes, sections and hidden-column choices. A separate “Reset design to template defaults” action resets design only.

## A4 preview and printing

Use one semantic invoice DOM with real text and table elements. Preview is a scaled 210 mm-wide flowing A4 document surface; print removes transforms/editor chrome and uses `@page { size: A4 portrait; margin: 12mm; }`. A four-page invoice may flow continuously on screen: do not promise exact screen page boundaries. Browser print preview is the pagination authority. Do not build a custom pagination engine initially.

Repeated `thead`, normal document flow, break avoidance for ordinary rows and totals/signature groups, wrapping long words, and unconstrained content height prevent clipping. Exception: a row or section taller than one page must be allowed to split. No fixed-height A4 containers with hidden overflow, absolute footer overlays, or fixed bottom totals. Footer means end of document, not repeated page footer. No page-number promise in v1. Structural template decoration must tolerate continuation pages and backgrounds disabled.

Print action validates form, flushes valid state, waits for fonts (`document.fonts.ready`), uploaded images and QR, then calls window.print. Handle failures visibly; canceling print does not change invoice status. Offer instructions: A4, 100% scale, disable browser headers/footers, optional background graphics. Save PDF is the browser print destination, not a separate export renderer. Automate Chromium PDF inspection and manually inspect Firefox and Safari output; browser pagination and physical printers can vary.

## Persistence, backup and recovery

IndexedDB contains `workspace` (one versioned canonical record including invoices/profiles/settings) and `assets` (Blobs by ID). Saving a workspace with asset changes uses one transaction across both stores. This simple shape is sufficient for local invoice collections; no repository hierarchy or query engine. localStorage mirrors UI language/theme for early paint only; authoritative exported settings remain in IndexedDB, and a stale/missing mirror cannot change the workspace.

Backup envelope v1 has exactly: `app: "muinvoice"`, `schemaVersion: 1`, `exportedAt` (UTC), `settings`, `companies`, `invoices`, `assets`. Export a complete workspace: each asset entry carries `id`, `mime`, `base64`, `byteLength`, `width`, `height`, optional `filename`. Base64 is raw content, not an arbitrary URL. Include every referenced user asset; bundled fonts/templates ship with the app and are referenced by stable IDs. Backups are plain, unencrypted JSON; disclose that they contain personal/business information.

Import pipeline: size precheck -> JSON parse -> envelope version gate -> pure migration if supported -> strict Zod validation -> reference/uniqueness checks -> asset decoding/dimension verification -> dry-run summary -> user selects merge/replace -> atomic IndexedDB commit -> publish new state -> refresh preference mirror. No mutation before full validation/confirmation. Reject unsupported future versions; preserve old local data and the original import file. Schema version and IndexedDB version are separate. Never erase data after a migration error; show recovery/export options.

Merge keeps existing settings, adds absent IDs, skips semantically identical records, and preserves local records for differing same-ID collisions with a visible conflict count. Compare entities without timestamps; compare assets by bytes/type/dimensions. If any reference from a would-be imported record points to a conflicting ID, skip that dependent record too (including transitive dependencies); do not silently attach a different logo/company. No heuristic overwrite by timestamp. Replace uses imported settings and workspace, clears prior records only inside the successful transaction, and requires an explicit destructive confirmation plus a recommended pre-replace backup. Inform the user that skipped conflicting records require a separate replace/import workflow; do not silently remap IDs.

Safety limits for v1: import file <= 25 MiB, <= 1000 invoices, <= 1000 items/invoice, <= 100 profiles, <= 100 assets; image <= 2 MiB, <= 4096 px each side and <= 16 megapixels decoded; plain text <= 10,000 characters/field, custom arrays <= 100 entries/entity. Enforce limits on editing/uploads and import. Reject SVG, HTML, remote asset URLs, invalid base64 and unknown code-bearing fields. Decode image bytes and verify actual type/dimensions, not only extension/MIME. Revoke temporary object URLs. Use React text escaping; no arbitrary HTML, CSS, or scripts from backups. Store only known bounded style tokens/validated hex colors and font IDs.

Handle quota, denied storage and private-mode failures: keep current in-memory work, show “not saved,” allow export, and never falsely report success. Request persistent storage opportunistically with explanation, never promise it. Delete invoice/profile requires confirmation; profile deletion cannot delete invoice snapshots. Delete-all is scoped to muinvoice's own stores/keys, confirms scope and offers backup. Garbage-collect assets only after successful writes and only when no invoice/profile/settings reference remains.

Origin storage is not encrypted and can be cleared or evicted. A different origin/device is a separate workspace; JSON backup is the transfer mechanism. Include a dismissible backup reminder after seven days of changed data since export. The reminder is informational, never an online service.

## Optional ZATCA Phase 1-format QR

This is a narrowly scoped local encoding feature. Off by default. No XML, clearance/reporting, certificates, signing, hash chains, Phase 2, API calls, or certification assertions.

Encoder fields, in order: 1 seller name, 2 seller VAT number, 3 invoice timestamp, 4 invoice total including VAT, 5 VAT total. Encode UTF-8 bytes for each value; prepend one tag byte and one byte containing the UTF-8 byte length; concatenate the five fields with no separators; Base64-encode the entire byte array. Render that Base64 text using the local QR library. Never use JavaScript string length for Arabic byte lengths or btoa directly on Unicode. Reject empty required fields or any value exceeding 255 encoded bytes.

Explicit QR settings select seller language/name from the snapshot, seller VAT identifier, and which tax IDs count as VAT. Tags 4/5 come from the shared engine, not user-entered totals. Restrict this v1 option to SAR invoices whose active nonzero taxes are all marked VAT; otherwise explain unsupported configuration and leave ordinary print available with QR disabled. Use ASCII fixed two-decimal totals and an ISO UTC timestamp converted from the stored issue instant. VAT format checks are input checks, not registration verification. QR generation errors block printing while QR remains enabled; never print a stale QR or silently drop it.

Required explanatory copy beside the toggle and in product help: “Generates a ZATCA Phase 1-format QR code only. muinvoice does not claim regulatory compliance, certification, or Phase 2 support. You are responsible for checking applicable invoicing requirements.” No compliance badge in any template. Tax-invoice labels are user-selected labels, not validation results.

Source basis: [ZATCA detailed technical guideline](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-invoicing-Detailed-Technical-Guideline.pdf) and [official developer community QR structure](https://zatca1.discourse.group/t/structure-of-the-qr-code-for-electronic-tax-invoices/483). Official indexed material confirms the five fields and UTF-8 TLV structure; the successful PDF review is recorded in the QR source notes. Known-answer fixtures cover byte-level encoding; see [QR source notes](qr-source-notes.md) for the reviewed guideline and limitations. Regulatory suitability is unassessed; correct encoding is not compliance.

## Static delivery and offline behavior

Bundle all fonts, icons and QR computation; no analytics, telemetry, remote fonts, QR services or content uploads. Static hosting still receives ordinary requests for application files; do not promise zero network traffic or that downloaded backups are encrypted. A small versioned same-origin app-shell service worker enables offline reopen after one complete online load. Cache application resources only, never invoice/backup contents; handle updates at an explicit reload boundary after save/export. No install prompt or background sync is needed. Test root and subpath hosting, service-worker scope, stale-version recovery and migrations. Network requests with invoice content must be zero.

## Verification strategy

Unit-test calculations, canonical decimal parsing, language fallback, snapshots, backup validation/migration/merge planning, QR byte encoding and asset references. Integration-test storage transactions, failed writes, hydration order, import rollback and form/preview synchronization. Browser-test creation/reload/duplicate/profile isolation, customization, backup restoration into a clean context, RTL keyboard use and print readiness. Use named golden fixtures, not snapshots as the only correctness evidence.

The template acceptance matrix is 25 designs × 3 language modes, with short, 100-item and pathological long-text cases. Render checks may run across the full matrix; visual approval must include each design in each mode plus long-content coverage of every composition. Test Chromium and Firefox current stable, WebKit automation plus real Safari print where available. Missing browser/manual checks remain explicit release risks, not implied passes. Current release checks are in [release status](release.md).
