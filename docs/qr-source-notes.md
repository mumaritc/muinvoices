# QR source review · 16 November 2026

Scope: five-field Phase 1-format encoding only. No legal applicability assessment,
certification, issuance, signing, XML, clearance, reporting or Phase 2 integration.

Only synthetic data is used for verification; no tax documents are submitted.

The [official educational library](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Pages/default.aspx)
(page updated 10 August 2026) still links the
[Detailed Technical Guideline](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-invoicing-Detailed-Technical-Guideline.pdf).
Web retrieval timed out, but PowerShell Invoke-WebRequest successfully retrieved the
81-page Version 2, November 2022 PDF on 16 November 2026. Section 6, printed pages 58–59, specifies the field
order and one-byte UTF-8 lengths. Its Phase 2 fields are deliberately excluded.
The [official developer community explanation](https://zatca1.discourse.group/t/structure-of-the-qr-code-for-electronic-tax-invoices/483)
(12 August 2023) corroborates TLV and Base64. Its example tables contain inconsistent
length/value entries; independent synthetic fixtures, rather than copying those
typographical examples, define the tests. This does not assess regulatory suitability.

Release gates: independent offline decode of rendered and printed QR; actual scanner
and applicable requirements review. Byte encoding alone establishes no compliance.
