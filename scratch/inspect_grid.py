import pymupdf

doc = pymupdf.open(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf")

for page_idx, page in enumerate(doc):
    print(f"\n================ PAGE {page_idx+1} ================")
    drawings = page.get_drawings()
    print(f"Total drawings (lines/rects): {len(drawings)}")
    rects = [d['rect'] for d in drawings if 'rect' in d]
    # Filter table row lines
    for r in sorted(rects, key=lambda x: (x.y0, x.x0)):
        if r.width > 100 or r.height > 10:
            print(f"  Rect: ({r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f}) - w={r.width:.1f}, h={r.height:.1f}")

