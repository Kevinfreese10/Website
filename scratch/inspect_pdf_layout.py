import fitz # PyMuPDF
import sys

doc = fitz.open(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf")
print("Number of pages:", len(doc))

for page_num in range(len(doc)):
    page = doc[page_num]
    print(f"\n--- PAGE {page_num+1} RECT: {page.rect} ---")
    blocks = page.get_text("blocks")
    for b in blocks:
        print(f"BBox: ({b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}) -> {b[4].strip()}")

