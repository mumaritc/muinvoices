# muinvoice implementation rules

Read architecture.md, decisions.md and release.md before changing code. These rules constrain implementation; they are not permission to expand scope.

## Scope and simplicity

1. Use muinvoice consistently in UI, package metadata, documentation and `app` backup discriminator.
2. Keep changes within their requested scope and finish their verification before expanding.
3. Read existing code and find all callers before modifying shared functions. Update affected schemas, UI, fixtures, exports and docs in the same change.
4. Reuse existing components/functions. Prefer standard browser features, then already installed libraries. Add a dependency only when it removes real complexity and record why in decisions.md.
5. No service-class hierarchy, dependency injection, generic renderer DSL, generic repository, premature plugin architecture, duplicate models, or “future” flags. Extract a helper when actual repetition or a real domain boundary justifies it.
6. Keep public contracts small. Use Zod-derived types, discriminated unions and stable IDs. Avoid `any`, blanket casts, disabled type checks and silent catches. A one-line expression that needs decoding is not simpler.
7. No application backend, hosted database, authentication, telemetry, analytics, content uploads, remote QR/font services, accounting modules or compliance claims.

## Data and calculation invariants

8. Every financial result comes from `calculateInvoice`; templates/editor summaries/QR must consume that result. No ad hoc multiplication, rounding or tax recalculation in JSX.
9. decimal.js stays in the calculation module. Persist ASCII decimal strings, never Decimal instances or formatted currency. Implement the exact discount, inclusive-price, allocation and rounding policy in architecture.md.
10. Derived totals and QR are rebuilt after edits/import; imported totals never override the engine. Reject invalid input rather than clamp or substitute zero.
11. Profile/tax/default changes never mutate existing invoices. Copy snapshots on creation or explicit replacement. Presentation changes must not alter financial inputs.
12. Hiding a field/column/section only affects output. Never delete financial data merely because it is hidden.
13. Form buffers can be temporarily invalid. Last-valid preview must be visibly labeled; print/finalize are unavailable until fixed. RHF/Zustand may not form an uncontrolled reset/watch feedback loop.
14. Status and invoice number are local conveniences. Do not imply issuance, immutable finalization, tamper prevention, controlled sequencing or legal validity.

## Storage, import and security

15. Validate all import/upload boundaries with size limits, Zod and reference checks before mutation. Treat JSON/assets as untrusted; reject unknown schema versions and executable content.
16. Use atomic IndexedDB transactions, serialized saves and multi-tab conflict handling. Report “saved” only after success. Preserve in-memory work and offer export on failures.
17. Canonical settings belong in IndexedDB; localStorage is a mirror. Export includes all durable settings, profiles, invoices and referenced assets. Never export Blob URLs.
18. Keep merge deterministic, local-wins and visible. Skip dependents of conflicting references. Replace/delete-all require a clear destructive confirmation and backup opportunity. Cancel/error must leave stored data intact.
19. Migrations are pure, versioned and fixture-tested. A failed migration must not reset/clear storage. Database structure upgrades must be separate from backup schema versions.
20. Render user text through React escaping. No `dangerouslySetInnerHTML`, eval, scriptable templates, arbitrary inline CSS from imports or untrusted URL loading. Restrict style/color/font controls to validated values.
21. Allow verified PNG/JPEG/WebP only within byte/dimension limits. Revoke object URLs and keep shared assets while referenced. Never delete another application's storage keys/caches.
22. Do not log invoice contents, names, VAT identifiers, addresses, bank details or backup contents. Use synthetic fixture data only. Downloaded JSON is unencrypted; explain this in product help.

## UI, language and accessibility

23. Use shadcn Base UI components only as needed; inspect current generated APIs and composition. Do not mix Radix trigger patterns into Base UI components. Keep Tailwind v4 setup.
24. Editor UI uses semantic theme tokens. Printed invoice styles are scoped to the invoice root, independent of editor dark mode. Use CSS variables for validated invoice customization.
25. Every input has a label, linked error/help, usable keyboard focus and accessible name. Dialogs need titles and sensible focus restoration. No color-only errors or pointer-only reorder actions.
26. Keep UI and document languages independent. Localize labels, validation, buttons, empty/error states and help, not stored identifiers. Do not concatenate sentences across dictionary keys.
27. Arabic requires root direction, logical spacing, mixed-value isolation and appropriate fonts. Test mixed Arabic with `INV-2026/001`, email, phone, URL and bank reference. Do not reverse arrays/text to simulate RTL.
28. Plain-text bilingual names, addresses, item descriptions and custom sections share one LocalizedText policy. Missing translations fall back visibly and deterministically; no fabricated translations.
29. Provide usable mobile editing and a preview switch; desktop shows editor/preview side by side. Support keyboard workflow, 200% zoom and reduced motion. Narrow-screen preview may scale; form controls must remain readable.
30. All 25 designs must differ structurally and preserve the same feature coverage. Share printable behavior, not a single layout with different colors. Every design supports all three output modes.

## Preview, print and QR

31. A single InvoiceRenderer serves preview and print, backed by one calculation result. No screenshot-PDF or second financial renderer.
32. Use semantic tables, repeated headers and flowing content. Do not clip long invoices into fixed page heights or overlay totals/footer. Allow oversized rows to split instead of disappear.
33. Wait for form commit, font readiness, images and QR before print. Browser print cancel cannot finalize or mutate financial content. Empty/invalid drafts may preview; they cannot print as complete invoices.
34. Preserve readable output without background graphics. Verify Arabic text remains selectable in browser PDFs. Browser print preview controls final pagination.
35. QR uses current valid snapshot and engine totals, UTF-8 byte lengths and TLV tags 1–5 only. Unsupported/invalid enabled QR blocks print with an actionable error. Never silently reuse stale QR.
36. Keep the Phase 1-format-only and no-regulatory-compliance explanation near the option and in help/README. Never label muinvoice “ZATCA compliant,” certified, Phase 2 ready or a legal issuance system.

## Tests and completion

37. Nontrivial calculation, parsing, import/migration, persistence and QR logic need small meaningful tests. Test behavior and independent expected results, not a restatement of implementation.
38. Use unit tests for pure rules, integration tests for state/storage, and browser tests for end-to-end behavior/printing. Visual snapshots alone cannot prove totals or correct Arabic reading order.
39. Maintain fixtures for the monetary cases in architecture.md, malformed/future-version backups, corrupted/oversized images, storage failures, long content and mixed-direction data.
40. Run formatting/lint, typecheck, unit/integration tests and production build for relevant milestones. Run browser/print checks when those paths change. Do not invent passing results for unavailable browsers or manual review.
41. Review final changes for duplicated arithmetic, content loss, external network calls and scope creep. Remove dead code and unused dependencies introduced by the change.
42. Update release.md only after acceptance evidence exists. Record actual commands/results, manual browser review and remaining limitations. Do not mark all 25 templates complete based on gallery thumbnails.
43. Finish a change with a short result, relevant verification, and anything skipped/risky. If a known shortcut is necessary, write `shortcut: <limit>, <when to upgrade>` next to it and record it in release.md.
