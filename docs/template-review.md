# Composition review · 17 November 2026

The registry contains exactly 25 IDs/components. Reviews used real renderer captures
in English, Arabic and bilingual modes, not gallery recolors. The matrix runs short,
100-row and oversized content for each mode in Chromium and Firefox (225 renders per
browser). Contact sheets cover all 75 short cases. First/final Chromium print pages
were inspected for all 25 long bilingual compositions, with automated text/row/total
and page-bound checks on all pages. Arabic text is selectable, but linguistic approval
requires a native reader. These checks do not replace physical/Safari print review.

| Design         | Nearest comparison | Structural differences reviewed                                                                                              |
| -------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Pure           | Clean Line         | Stacked parties rather than paired columns; metadata beside title rather than a separate horizontal band                     |
| Clean Line     | Pure               | Separate ruled metadata band; summary precedes notes instead of sharing their closing row                                    |
| Monochrome     | Ledger             | Seller/title framed masthead; separate boxed end summary instead of full-width grid summary/tax sheet                        |
| Air            | Arabic Classic     | Narrow stacked metadata separated from buyer; centered detached totals instead of leading summary                            |
| Executive      | Gradient Edge      | Full-width buyer card and metadata strip; closing notes/summary rail instead of a separate outlined summary                  |
| Ledger         | Monochrome         | Metadata cells beside title; explicit tax breakdown table and broad grid summary                                             |
| Blue Office    | Color Block        | Full-width title band and three opening blocks; notes/summary split instead of broad closing box                             |
| Structured     | Arabic Formal      | Numbered modular party panels; banded table transition and distinct end-summary rules                                        |
| Formal         | Arabic Classic     | Title-only centered header before paired parties; two-column fact sheet and double-rule summary/signature flow               |
| Gradient Edge  | Executive          | Identity/title edge opening; buyer/metadata pair and outlined detached total                                                 |
| Bold Header    | Blue Office        | Oversized title above metadata strip; compact parties and full-width horizontal totals banner                                |
| Split Panel    | Gradient Edge      | Identity/title in one opening panel beside vertical facts; payment and total close side by side                              |
| Accent Bar     | Executive          | Title/metadata opening and asymmetric parties; underlined totals instead of bordered summary rail                            |
| Studio         | Signature          | Reference/project lead and spacious descriptive table; notes-first closing before separate signature/total row               |
| Geometric      | Gradient Edge      | Staggered identity/facts rather than aligned opening columns; angular divider and framed ending                              |
| Editorial      | Elegant Serif      | Narrow paired introductory parties; notes/signature before a separate final total                                            |
| Color Block    | Blue Office        | Segmented seller/title opening; two-block facts and grouped rows with a broad summary                                        |
| Signature      | Studio             | Personal letterhead and flowing buyer/facts; signature-led closing adjacent to totals                                        |
| Luxury Gold    | Arabic Classic     | Framed stationery masthead and thin grid; symmetric closing cards rather than leading-edge total                             |
| Elegant Serif  | Editorial          | Asymmetric seller/facts and separate buyer; borderless rows with typographic total before notes                              |
| Arabic Classic | Luxury Gold        | Ruled centered masthead; paired labeled facts and leading-edge totals without closing cards                                  |
| Arabic Modern  | Split Panel        | Asymmetric identity and separate metadata tiles; open buyer/table followed by split closing                                  |
| Arabic Formal  | Structured         | Framed title and stacked identifiers; formal fact grid and dedicated signature/terms band                                    |
| Dual Column    | Pure               | Paired language lanes in opening/closing; full-width facts and total rather than stacked language blocks throughout          |
| Saudi Business | Ledger             | Identifier-rich seller panel and buyer/facts grid; reserved QR/signature region alongside total after explicit tax breakdown |

Evidence is regenerated under ignored `output/playwright/matrix/`. The latest screenshot
writer may be either browser; the PDF fixtures are Chromium. `public/thumbnails/` holds
the committed synthetic English renderer captures used by the gallery.
