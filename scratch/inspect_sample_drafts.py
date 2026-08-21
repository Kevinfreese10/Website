import pymupdf

files = [
    r"c:\myacc\scratch\ncr_draft_examples\5678_Share certificate.pdf",
    r"c:\myacc\scratch\ncr_draft_examples\5678_Resolution.pdf",
    r"c:\myacc\scratch\ncr_draft_examples\5678_Annex.pdf"
]

for f in files:
    print(f"=== {f} ===")
    doc = pymupdf.open(f)
    for i, page in enumerate(doc):
        print(f"--- Page {i+1} ---")
        print(page.get_text()[:400])
    doc.close()
