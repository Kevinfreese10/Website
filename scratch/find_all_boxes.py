import pymupdf

doc = pymupdf.open(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf")
p1 = doc[0]

drawings = p1.get_drawings()
boxes_by_y = {}

for d in drawings:
    r = d['rect']
    # Check if it's a small box (width around 10-30, height around 10-30) or a line/rect
    if 10 <= r.width <= 40 and 10 <= r.height <= 30:
        y_approx = round(r.y0 / 5) * 5
        if y_approx not in boxes_by_y:
            boxes_by_y[y_approx] = []
        boxes_by_y[y_approx].append(r)

print("Small boxes found by Y approx:")
for y, boxes in sorted(boxes_by_y.items()):
    boxes_sorted = sorted(boxes, key=lambda b: b.x0)
    print(f"Y ~ {y} ({len(boxes_sorted)} boxes):")
    for b in boxes_sorted:
        print(f"   ({b.x0:.1f}, {b.y0:.1f}, {b.x1:.1f}, {b.y1:.1f})")

# Check all other rectangles / lines for text inputs
print("\nLarge input boxes on Page 1:")
for d in drawings:
    r = d['rect']
    if r.width > 50 and r.height > 8:
        print(f"  Large Rect: ({r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f})")

