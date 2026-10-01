#!/usr/bin/env python3
"""
Brand Compilation Report Script
Applies My Accountant (Pty) Ltd official practice letterhead, redacts software draft placeholders
and legacy sign-off blocks, inserts Kevin Freese's verified digital signature, and exports both
the renamed complete AFS and the standalone 1-page Practitioner's Compilation Report.

Usage:
    uv run --with pymupdf python brand_compilation_report.py --pdf "<path_to_afs.pdf>" --entity "<Entity Name>" [--date "<Date>"] [--city "Johannesburg"]
"""

import argparse
import os
import re
import shutil
import sys
import pymupdf

def find_compilation_page(doc):
    """Locate the 0-indexed page number containing the Practitioner's Compilation Report."""
    # First pass: check for actual report content, avoiding table of contents/index
    for idx, page in enumerate(doc):
        text = page.get_text()
        if "index" in text.lower() or "contents" in text.lower():
            continue
        if ("Practitioner's Compilation Report" in text or "Compilation Engagements" in text or "ISRS 4410" in text) and \
           ("compiled the financial statements" in text or "To the Management" in text or "To the Director" in text or "Jude Capital" in text):
            return idx

    # Second pass: broader check excluding contents
    for idx, page in enumerate(doc):
        text = page.get_text()
        if "index" in text.lower() or "contents" in text.lower():
            continue
        if "Practitioner's Compilation Report" in text or "Compilation Engagements" in text or "ISRS 4410" in text:
            return idx

    # Fallback to page 4 (5th page) if not detected by text
    return 4 if len(doc) > 4 else 0

def brand_compilation_report(pdf_path, entity_name, date_str="29 September 2026", city="Johannesburg", output_dir=None, financial_year=None):
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    pdf_dir = os.path.dirname(os.path.abspath(pdf_path))
    pdf_filename = os.path.basename(pdf_path)

    # 1. Create safety backup
    base_name, ext = os.path.splitext(pdf_filename)
    backup_path = os.path.join(pdf_dir, f"{base_name}_ORIGINAL_BACKUP{ext}")
    if not os.path.exists(backup_path):
        shutil.copy2(pdf_path, backup_path)
        print(f"[OK] Safety backup created: {backup_path}")
    else:
        print(f"[OK] Safety backup already exists: {backup_path}")

    # Use backup as clean source
    doc = pymupdf.open(backup_path)
    page_idx = find_compilation_page(doc)
    print(f"[OK] Identified Practitioner's Compilation Report at Page {page_idx + 1}")
    page = doc[page_idx]

    # Find fonts
    arial = r"C:\Windows\Fonts\arial.ttf"
    arial_bold = r"C:\Windows\Fonts\arialbd.ttf"
    if not os.path.exists(arial) or not os.path.exists(arial_bold):
        font_regular = pymupdf.Font("helv")
        font_bold = pymupdf.Font("helv", bold=True)
        arial_path = None
        arial_bold_path = None
    else:
        font_regular = pymupdf.Font(fontfile=arial)
        font_bold = pymupdf.Font(fontfile=arial_bold)
        arial_path = arial
        arial_bold_path = arial_bold

    # 2. Redact Draft Artifacts & Legacy Blocks
    # Top placeholder image / logo icon
    page.add_redact_annot(pymupdf.Rect(230, 35, 370, 132), fill=(1, 1, 1))

    # Bottom placeholder logo / "Double click to insert your logo" box and horizontal line
    page.add_redact_annot(pymupdf.Rect(40, 700, 560, 780), fill=(1, 1, 1))

    # Old sign-off block (Jude Capital / Springs / BAP(SA) / old signatures)
    page.add_redact_annot(pymupdf.Rect(40, 430, 300, 570), fill=(1, 1, 1))

    # Apply redactions
    page.apply_redactions()

    # 3. Apply Official Letterhead
    left_x = 49.4
    right_x = 548.2

    navy = (15 / 255, 33 / 255, 55 / 255)      # #0F2137
    gold = (197 / 255, 160 / 255, 89 / 255)    # #C5A059
    slate = (100 / 255, 116 / 255, 139 / 255)  # #64748B
    body_color = (0, 0, 0)                     # Clean Black matching report typography

    # Left header block
    page.insert_text(pymupdf.Point(left_x, 40), "MY ACCOUNTANT (PTY) LTD", fontfile=arial_bold_path, fontsize=13.5, color=navy)
    page.insert_text(pymupdf.Point(left_x, 50.5), "REGISTRATION NUMBER: 2020 / 548105 / 07", fontfile=arial_bold_path, fontsize=6.5, color=slate)
    page.insert_text(pymupdf.Point(left_x, 59.5), "ACCOUNTING  •  PAYROLL  •  TAX  •  ADVISORY", fontfile=arial_bold_path, fontsize=6.5, color=gold)

    # Right header contact block
    c1 = "Ground Floor, Waterstone Building, Stonemill Office Park"
    c2 = "300 Acacia Road, Darrenwood, Johannesburg, 2195"
    c3 = "Tel: 010 109 1625 | Email: info@myacc.co.za | Web: www.myacc.co.za"

    w1 = font_regular.text_length(c1, fontsize=7.2)
    w2 = font_regular.text_length(c2, fontsize=7.2)
    w3 = font_regular.text_length(c3, fontsize=7.2)

    page.insert_text(pymupdf.Point(right_x - w1, 40), c1, fontfile=arial_path, fontsize=7.2, color=slate)
    page.insert_text(pymupdf.Point(right_x - w2, 49.5), c2, fontfile=arial_path, fontsize=7.2, color=slate)
    page.insert_text(pymupdf.Point(right_x - w3, 59), c3, fontfile=arial_path, fontsize=7.2, color=slate)

    # Divider line
    shape = page.new_shape()
    shape.draw_line(pymupdf.Point(left_x, 68), pymupdf.Point(right_x, 68))
    shape.finish(color=gold, width=1.5)
    shape.commit()

    # 4. Apply Correct Signature & Sign-Off Block
    sig_line_y = 465.0
    sig_line_len = 180.0

    # Draw signature line
    shape_sig = page.new_shape()
    shape_sig.draw_line(pymupdf.Point(left_x, sig_line_y), pymupdf.Point(left_x + sig_line_len, sig_line_y))
    shape_sig.finish(color=(0, 0, 0), width=0.75)
    shape_sig.commit()

    # Place Kevin Freese's verified digital signature
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    sig_paths = [
        os.path.join(repo_root, "public", "templates", "Signature_Kevin_New.png"),
        os.path.join(repo_root, "public", "templates", "Signature.png"),
        r"c:\myacc\public\templates\Signature_Kevin_New.png",
    ]
    sig_path = next((p for p in sig_paths if os.path.exists(p)), None)

    if sig_path:
        sig_w = 80.0
        sig_h = (726.0 / 1130.0) * sig_w  # ~51.4
        sig_rect = pymupdf.Rect(left_x + 5.0, sig_line_y - sig_h + 5.0, left_x + 5.0 + sig_w, sig_line_y + 5.0)
        page.insert_image(sig_rect, filename=sig_path)

    # Sign-off text details
    y_pos = sig_line_y + 15.0
    page.insert_text(pymupdf.Point(left_x, y_pos), "My Accountant (Pty) Ltd", fontfile=arial_bold_path, fontsize=9.0, color=body_color)
    y_pos += 12.0
    page.insert_text(pymupdf.Point(left_x, y_pos), "Kevin Freese", fontfile=arial_bold_path, fontsize=9.0, color=body_color)
    y_pos += 11.5
    page.insert_text(pymupdf.Point(left_x, y_pos), "Director", fontfile=arial_path, fontsize=9.0, color=body_color)
    y_pos += 11.5
    page.insert_text(pymupdf.Point(left_x, y_pos), "Chartered Business Accountant in Practice (SA)", fontfile=arial_path, fontsize=9.0, color=body_color)
    y_pos += 11.5
    page.insert_text(pymupdf.Point(left_x, y_pos), "CIBA CBAP (SA) #3561 | SARS PR-0098553", fontfile=arial_path, fontsize=9.0, color=body_color)

    y_pos += 18.0
    page.insert_text(pymupdf.Point(left_x, y_pos), date_str, fontfile=arial_path, fontsize=9.0, color=body_color)
    y_pos += 11.5
    page.insert_text(pymupdf.Point(left_x, y_pos), city, fontfile=arial_path, fontsize=9.0, color=body_color)

    # 5. Determine Canonical Output Filenames
    clean_entity = re.sub(r'[\/:*?"<>|]', "", entity_name).strip()
    
    year_str = financial_year
    if not year_str:
        # Inspect cover page and page 2 for financial year (e.g. 'for the year ended 28 February 2025')
        full_search_text = doc[0].get_text() + " " + (doc[1].get_text() if len(doc) > 1 else "")
        m_fy = re.search(r'(?:year\s+ended|as\s+at)\s+\d{1,2}\s+[A-Za-z]+\s+(20\d\d)', full_search_text, re.IGNORECASE)
        if m_fy:
            year_str = m_fy.group(1)
        else:
            match_year = re.search(r'20\d\d', date_str)
            year_str = match_year.group(0) if match_year else "2026"

    clean_afs_filename = f"{clean_entity} - Annual Financial Statements {year_str}.pdf"
    standalone_filename = f"Practitioners_Compilation_Report_{clean_entity.replace(' ', '_')}_{year_str}.pdf"

    target_dir = output_dir or pdf_dir
    full_afs_path = os.path.join(target_dir, clean_afs_filename)
    standalone_path = os.path.join(target_dir, standalone_filename)

    # Save standalone report (1 page)
    standalone_doc = pymupdf.open()
    standalone_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
    standalone_doc.save(standalone_path)
    standalone_doc.close()
    print(f"[OK] Standalone Practitioner's Compilation Report saved: {standalone_path}")

    # Save updated full AFS PDF
    doc.save(full_afs_path, incremental=False, deflate=True)
    doc.close()
    print(f"[OK] Branded Annual Financial Statements saved: {full_afs_path}")

    # Also sync to Downloads if available
    downloads_dir = os.path.expanduser(r"~\Downloads")
    if os.path.exists(downloads_dir) and target_dir != downloads_dir:
        try:
            shutil.copy2(full_afs_path, os.path.join(downloads_dir, clean_afs_filename))
            shutil.copy2(standalone_path, os.path.join(downloads_dir, standalone_filename))
            print(f"[OK] Synced copies to Downloads folder")
        except Exception as e:
            print(f"[WARN] Could not copy to Downloads: {e}")

    return full_afs_path, standalone_path

def main():
    parser = argparse.ArgumentParser(description="Brand Annual Financial Statements with My Accountant letterhead and signature.")
    parser.add_argument("--pdf", required=True, help="Path to input Financial Statements PDF")
    parser.add_argument("--entity", required=True, help="Entity name (e.g. 'Vicuna Investments (Pty) Ltd')")
    parser.add_argument("--date", default="29 September 2026", help="Report date (e.g. '29 September 2026')")
    parser.add_argument("--city", default="Johannesburg", help="Practice city (default: 'Johannesburg')")
    parser.add_argument("--output-dir", default=None, help="Optional output directory")
    parser.add_argument("--year", default=None, help="Financial year for the statements (e.g. '2025')")

    args = parser.parse_args()
    brand_compilation_report(args.pdf, args.entity, args.date, args.city, args.output_dir, args.year)

if __name__ == "__main__":
    main()
