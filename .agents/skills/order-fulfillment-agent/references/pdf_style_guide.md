# Practice PDF Style Guide (Executive Navy & Gold Trim)

Load this only when building or fixing a PDF generator in `src/lib/pdf/template-generators.ts` or `src/lib/documents/renderers/`. Practice identity strings come from `src/lib/documents/helpers.ts` — never retype them.

## Output format
- Client-facing statutory instruments, engagement letters and proposals are delivered as **PDF only** (`pdf-lib` / ReportLab), with vector letterhead and the transparent signature stamp.
- `.docx` files (e.g. `public/templates/LIQUIDATION_APPLICATION_MASTER.docx`) are **source templates only**: convert to PDF before anything reaches the client.

## Letterhead (page 1)
- Left: `My Accountant (Pty) Ltd` (16.5pt bold Deep Navy `#0f2137`) | `Registration: 2020 / 548105 / 07 • Practice No: PR-0098553` (Warm Gold `#c5a059`).
- Right: `Ground Floor, Waterstone Building, Stonemill Office Park` | `300 Acacia Road, Darrenwood, Johannesburg, 2195` | `Tel: +27 10 109 1625 • Email: info@myacc.co.za • Web: www.myacc.co.za`.
- Divider: horizontal trim bar, Navy 70% / Gold 30%.
- Pages 2+: no repeated client details; only `• Page X of Y` top right with a gold bullet and slate border.
- Palette: Deep Navy `#0f2137`, Warm Gold `#c5a059`, Charcoal `#1e293b`, Slate `#e2e8f0` / `#cbd5e1`.

## Signature stamp
- Always embed `public/templates/Signature_Kevin_New.png` with `pdf.embedPng`. It must be a 4-channel RGBA PNG with true alpha (no white rectangle over tinted cards).
- Signature card: ice-blue fill `rgb(0.97, 0.98, 1.0)`, ink-blue left accent bar (`width: 3.5`, `COLORS.ink`).
- Card text:
  ```text
  FOR MY ACCOUNTANT (PTY) LTD (REGISTRATION NO: 2020 / 548105 / 07):

  [ TRANSPARENT SIGNATURE STAMP ]

  DIGITALLY SIGNED - CBA (SA) #3561 - Date: <Date>
  Chartered Business Accountant in Practice (CBAP SA #3561) - PR-0098553
  ```

## Layout rules
1. **Single-page instruments** (Consent Letter, Special POA, Director Resolutions, Fee Annexures, Accountant's Letter, BEE Affidavit, etc.) must render to exactly 1 page (`pdfDoc.getPageCount() === 1`); signatures never overflow to page 2.
2. **Word wrapping** on word boundaries only (`wrapText`).
3. **Fixed amount column**: currency figures align on one X coordinate (`x: 380` on A4).
4. **Entity detail cards**: Col 1 labels `MARGIN + 12`, values `MARGIN + 88`; Col 2 labels `MARGIN + 260`, values `MARGIN + 346`; keep 30–40pt clearance before the right border.
5. **Dynamic box heights**: `boxHeight = (totalWrappedLines * lineHeight) + padding`; never hardcode `cardH` for multi-paragraph cards.
6. **Narrative over callouts**: settlement offers, motivations and legal clauses are body text, not tinted boxes. Reserve bordered cards for metadata summaries and the signature block.
7. **Typography rhythm**: body 8.0–8.5pt with 11.0–11.5pt leading; 10–14pt above a heading; 15–16pt below a heading; 4–5pt between paragraphs.
8. **Page flow**: keep headings with their text; never page-break between paired sections while `y > 100pt` remains; avoid 200–350pt blank voids.
9. **Accounting retainer clause** (VAT included but client not yet VAT-registered): *"Please note that our monthly retainer fee will be reviewed and adjusted accordingly once the company is formally registered for VAT."*

## Accountant's Letter specifics
- Scope limited to verified bank statements and invoices; never claim unperformed reviews.
- Structure: Part A Net Personal Drawings / Direct Remuneration; Part B Company-Paid Living & Operating Subsidies.

## Windows file locks (`EBUSY`)
If a target PDF is open in a viewer, write to a new filename (e.g. append `_v2`) and tell Kevin. Never kill the user's applications (`taskkill`).
