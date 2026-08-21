import pymupdf

doc = pymupdf.open(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf")
p2 = doc[1]

blocks = p2.get_text("words")
for w in blocks:
    if w[1] > 700:
        print(f"Word at ({w[0]:.1f}, {w[1]:.1f}, {w[2]:.1f}, {w[3]:.1f}): '{w[4]}'")

drawings = p2.get_drawings()
for d in drawings:
    r = d['rect']
    if r.y0 > 700:
        print(f"Drawing rect at: ({r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f})")

