import pymupdf
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

src_dir = r"c:\myacc\scratch\test_generated_templates"
out_dir = r"C:\Users\kev\.gemini\antigravity\brain\8bfae2bb-b83d-41e7-866c-67c65c5548ba"

for f in os.listdir(src_dir):
    if f.endswith(".pdf"):
        pdf_path = os.path.join(src_dir, f)
        doc = pymupdf.open(pdf_path)
        base_name = f.replace(".pdf", "")
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)
            img_name = f"preview_{base_name}_p{page_num+1}.png"
            img_path = os.path.join(out_dir, img_name)
            pix.save(img_path)
            print(f"Saved: {img_name}")
        doc.close()
