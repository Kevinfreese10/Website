import pymupdf
import os

letterhead_path = r"c:\myacc\scratch\order_10102_docs\Letterhead.pdf"
doc = pymupdf.open(letterhead_path)
print("Letterhead pages:", len(doc))
p = doc[0]
print("Rect:", p.rect)
print("Text:", p.get_text())

# Render preview
pix = p.get_pixmap(dpi=150)
preview_path = r"c:\myacc\scratch\letterhead_preview.png"
pix.save(preview_path)
print("Saved preview to:", preview_path)
doc.close()

