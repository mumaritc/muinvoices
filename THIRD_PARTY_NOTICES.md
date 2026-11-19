# Third-party notices

muinvoice's own code is MIT licensed; third-party code and fonts keep their original
licenses. Production builds include the following complete texts under `licenses/`:

- `muinvoice.txt`: the project's MIT license.
- `dependencies.txt`: package names, locked versions and complete installed license/notice
  files for the production dependency closure, plus Vite, Rolldown and Tailwind output.
  This deliberately includes packages that may be removed by browser tree-shaking.
- `shadcn-ui.txt`: MIT license for the adapted shadcn UI controls in `src/components/ui/`.
- The three individual font licenses listed below.

`npm run licenses` regenerates package notices from the lockfile and the installed
packages; `npm run build` runs it automatically before Vite copies public files.
It rejects missing licenses and installed/locked version mismatches. Regenerate and
commit notices when dependencies change. All upstream copyright, additional license
sections and bundled third-party notices are retained.

## Fonts

All fonts are bundled by Vite from npm, with no remote font requests. Complete
redistribution licenses are in `public/licenses/` and ship with the application.

- Noto Sans Arabic: Copyright 2022 The Noto Project Authors. SIL Open Font License 1.1.
- Cairo: Copyright 2009 The Cairo Project Authors. SIL Open Font License 1.1.
- IBM Plex Sans Arabic: Copyright 2019 IBM Corp. SIL Open Font License 1.1.

Fontsource packages retain upstream attribution. Their licenses are also included
in the generated dependency notices. Source: [shadcn UI license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).
