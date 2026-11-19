# muinvoice

A free, open-source invoice designer that runs in your browser. Create an invoice,
choose from 25 layouts, customize English, Arabic or bilingual output, and print or
save as PDF.

**Public beta · MIT licensed.** Production URL: **https://invoices.mumaritc.com**
(deployment pending). See [release status](docs/release.md) for verification and known limits.

## Features

- English and Arabic interface, with independent document language and RTL support.
- 25 invoice layouts, three bundled fonts, logos, signatures, custom labels and columns.
- Seller/customer details, company profiles, notes, custom header/footer and sections.
- Inclusive/exclusive prices, named taxes, discounts and decimal-based calculations.
- Browser-local autosave, JSON backup/restore, and offline use after the first complete load.
- Optional locally generated ZATCA Phase 1-format QR with configurable placement.

Invoice content stays in your browser. There are no accounts, analytics, cloud sync
or application backend. Browser storage and downloaded backups are unencrypted;
keep backups somewhere safe. Tax calculations and QR formatting do not establish
regulatory compliance or Phase 2 support.

## Run locally

Use Node.js 24 LTS and npm:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. No credentials or environment variables are required.

```sh
npm run build
npm run preview
```

The static production files are in `dist/`. GitHub Actions verifies the app;
a manually triggered workflow releases it to GitHub Pages.

## Documentation

- [User guide](docs/guide.md): editing, backups, rounding, printing and offline use.
- [Contributing](CONTRIBUTING.md): setup and verification commands.
- [Architecture](docs/architecture.md) and [design decisions](docs/decisions.md).
- [Release status](docs/release.md): automated evidence and outstanding manual checks.

## License

muinvoice is [MIT licensed](LICENSE). Fonts and dependencies retain their own
licenses; see [third-party notices](THIRD_PARTY_NOTICES.md). Required license texts
ship with every production build under `licenses/`.
