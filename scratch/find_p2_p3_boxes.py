import pymupdf

doc = pymupdf.open(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf")

for p_idx in [1, 2]:
    p = doc[p_idx]
    drawings = p.get_drawings()
    print(f"\n================ PAGE {p_idx+1} ================")
    for d in drawings:
        r = d['rect']
        print(f"  Rect: ({r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f}) - w={r.width:.1f}, h={r.height:.1f}")

