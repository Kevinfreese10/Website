import pymupdf
import os

original_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf"
backup_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf"

doc = pymupdf.open(backup_pdf)

def draw_in_rect(page, rect, text, fontsize=9.5, fontname="helv", align=0, color=(0, 0, 0)):
    # Add slight vertical padding
    r = pymupdf.Rect(rect[0] + 3, rect[1] + 1, rect[2] - 3, rect[3] - 1)
    page.insert_textbox(r, text, fontsize=fontsize, fontname=fontname, align=align, color=color)

def fill_box_sequence(page, box_rects, chars, fontsize=10):
    for i, ch in enumerate(chars):
        if i < len(box_rects):
            r = box_rects[i]
            # Center character horizontally and vertically
            page.insert_textbox(r, ch, fontsize=fontsize, fontname="helv", align=1, color=(0, 0, 0))

# ==================== PAGE 1 ====================
p1 = doc[0]

# Name of Employer
draw_in_rect(p1, (168, 208, 521, 222), "SUPER VALET PAARL (PTY) LTD", fontsize=9)

# CF Registration No (12 boxes)
cf_boxes = [
    pymupdf.Rect(168.6, 229.8, 187.2, 245.7),
    pymupdf.Rect(190.9, 229.8, 210.0, 245.7),
    pymupdf.Rect(214.6, 229.8, 232.8, 244.8),
    pymupdf.Rect(237.4, 229.8, 256.0, 244.8),
    pymupdf.Rect(260.6, 229.8, 278.4, 244.8),
    pymupdf.Rect(282.5, 229.8, 300.0, 244.8),
    pymupdf.Rect(303.9, 229.8, 322.1, 244.8),
    pymupdf.Rect(325.8, 229.8, 344.9, 244.8),
    pymupdf.Rect(349.0, 229.8, 367.2, 244.8),
    pymupdf.Rect(371.8, 229.8, 390.0, 244.8),
    pymupdf.Rect(395.0, 229.8, 413.2, 244.8),
    pymupdf.Rect(417.4, 229.8, 437.4, 244.8),
]
fill_box_sequence(p1, cf_boxes, "990001229984", fontsize=10)

# UIF Registration No (8 boxes)
uif_boxes = [
    pymupdf.Rect(168.0, 250.9, 185.5, 263.9),
    pymupdf.Rect(191.0, 251.0, 208.5, 264.0),
    pymupdf.Rect(214.0, 251.0, 231.5, 264.0),
    pymupdf.Rect(237.5, 251.0, 255.0, 264.0),
    pymupdf.Rect(260.0, 251.0, 277.5, 264.0),
    pymupdf.Rect(283.0, 251.0, 300.5, 264.0),
    pymupdf.Rect(304.0, 251.0, 321.5, 264.0),
    pymupdf.Rect(326.0, 251.0, 343.5, 264.0),
]
fill_box_sequence(p1, uif_boxes, "25080531", fontsize=9.5)

# CIPC Registration No (12 boxes)
cipc_boxes = [
    pymupdf.Rect(168.0, 272.1, 185.5, 285.1),
    pymupdf.Rect(190.0, 272.0, 207.5, 285.0),
    pymupdf.Rect(212.5, 272.0, 230.0, 285.0),
    pymupdf.Rect(235.5, 272.0, 253.0, 285.0),
    pymupdf.Rect(258.5, 272.0, 276.0, 285.0),
    pymupdf.Rect(282.0, 272.0, 299.5, 285.0),
    pymupdf.Rect(304.0, 272.0, 321.5, 285.0),
    pymupdf.Rect(325.5, 272.0, 343.0, 285.0),
    pymupdf.Rect(348.0, 272.0, 365.5, 285.0),
    pymupdf.Rect(371.0, 272.0, 388.5, 285.0),
    pymupdf.Rect(393.5, 272.0, 411.0, 285.0),
    pymupdf.Rect(415.0, 272.0, 432.5, 285.0),
]
fill_box_sequence(p1, cipc_boxes, "201909455607", fontsize=9.5)

# SARS Tax No (10 boxes)
sars_boxes = [
    pymupdf.Rect(168.0, 293.3, 185.5, 306.3),
    pymupdf.Rect(189.5, 293.5, 207.0, 306.5),
    pymupdf.Rect(212.0, 293.5, 229.5, 306.5),
    pymupdf.Rect(234.0, 293.5, 251.5, 306.5),
    pymupdf.Rect(256.5, 293.5, 274.0, 306.5),
    pymupdf.Rect(278.5, 293.5, 296.0, 306.5),
    pymupdf.Rect(301.0, 293.5, 318.5, 306.5),
    pymupdf.Rect(323.0, 293.5, 340.5, 306.5),
    pymupdf.Rect(344.5, 293.5, 362.0, 306.5),
    pymupdf.Rect(366.0, 293.5, 383.5, 306.5),
]
fill_box_sequence(p1, sars_boxes, "9329460225", fontsize=9.5)

# Business Address
draw_in_rect(p1, (168, 316, 521, 348), "510 Hoof Street, Paarl, Western Cape", fontsize=9.5)

# City/Town
draw_in_rect(p1, (168, 357, 477, 371), "Paarl", fontsize=9)

# Province
draw_in_rect(p1, (168, 377, 477, 391), "Western Cape", fontsize=9)

# Postal Code (4 boxes)
postal_boxes = [
    pymupdf.Rect(169.6, 399.0, 185.6, 413.5),
    pymupdf.Rect(191.8, 399.0, 207.8, 413.5),
    pymupdf.Rect(214.5, 399.0, 230.5, 413.5),
    pymupdf.Rect(236.0, 399.2, 252.0, 413.7),
]
fill_box_sequence(p1, postal_boxes, "7646", fontsize=9.5)

# Employer Telephone No (10 boxes)
tel_boxes = [
    pymupdf.Rect(174.1, 420.3, 190.1, 434.8),
    pymupdf.Rect(194.2, 420.4, 210.2, 434.9),
    pymupdf.Rect(213.6, 420.4, 229.6, 434.9),
    pymupdf.Rect(232.9, 420.4, 248.9, 434.9),
    pymupdf.Rect(252.1, 420.4, 268.1, 434.9),
    pymupdf.Rect(271.5, 420.4, 287.5, 434.9),
    pymupdf.Rect(293.1, 420.4, 309.1, 434.9),
    pymupdf.Rect(313.6, 420.4, 329.6, 434.9),
    pymupdf.Rect(332.0, 420.4, 348.0, 434.9),
    pymupdf.Rect(353.8, 420.4, 369.8, 434.9),
]
fill_box_sequence(p1, tel_boxes, "0722268547", fontsize=9.5)

# Mobile Telephone No (10 boxes)
mobile_boxes = [
    pymupdf.Rect(174.0, 441.8, 189.0, 456.3),
    pymupdf.Rect(193.2, 441.5, 209.2, 456.0),
    pymupdf.Rect(213.0, 441.5, 229.0, 456.0),
    pymupdf.Rect(231.0, 441.5, 247.0, 456.0),
    pymupdf.Rect(251.8, 441.5, 267.8, 456.0),
    pymupdf.Rect(273.2, 441.5, 289.2, 456.0),
    pymupdf.Rect(293.8, 441.5, 309.8, 456.0),
    pymupdf.Rect(313.5, 441.5, 329.5, 456.0),
    pymupdf.Rect(333.0, 441.8, 348.8, 456.3),
    pymupdf.Rect(353.0, 441.5, 369.0, 456.0),
]
fill_box_sequence(p1, mobile_boxes, "0722268547", fontsize=9.5)

# Employer email address
draw_in_rect(p1, (189.0, 460.5, 494.3, 480.0), "jeanine@jgaccounting.co.za", fontsize=9)

# Consultant email address
draw_in_rect(p1, (190.5, 485.6, 494.3, 502.1), "winifred@myacc.co.za", fontsize=9)

# Consultant Telephone No (10 boxes)
consultant_tel_boxes = [
    pymupdf.Rect(194.2, 505.1, 210.2, 519.6),
    pymupdf.Rect(213.6, 505.1, 229.6, 519.6),
    pymupdf.Rect(232.9, 505.1, 248.9, 519.6),
    pymupdf.Rect(252.1, 505.1, 268.1, 519.6),
    pymupdf.Rect(271.5, 505.1, 287.5, 519.6),
    pymupdf.Rect(290.1, 505.1, 306.1, 519.6),
    pymupdf.Rect(310.1, 505.1, 326.1, 519.6),
    pymupdf.Rect(329.2, 505.1, 345.2, 519.6),
    pymupdf.Rect(349.1, 505.1, 365.1, 519.6),
    pymupdf.Rect(367.5, 505.0, 383.5, 519.5),
]
fill_box_sequence(p1, consultant_tel_boxes, "0101091625", fontsize=9.5)

# Detailed description of nature of business
desc = (
    "The company specializes in full automotive valet services, interior carpet & upholstery detailing, "
    "chemical chassis cleaning and chassis black application, vehicle hand wash and polishing, leather care, "
    "and aesthetic vehicle cleaning.\n\n"
    "Requested Industry Subclass: 1910 (Personal Services / Vehicle Cleaning & Valet Services).\n"
    "Reason for Change: The company was registered under an incorrect nature of business code and requires "
    "reclassification to Subclass 1910."
)
draw_in_rect(p1, (72.0, 669.0, 521.0, 792.0), desc, fontsize=8.8)


# ==================== PAGE 2 ====================
p2 = doc[1]

# Employer website
draw_in_rect(p2, (178.3, 138.2, 522.3, 152.7), "N/A", fontsize=9)

# Registered with regulatory body? Tick NO (Rect: (379.5, 159.7, 406.5, 177.2))
draw_in_rect(p2, (379.5, 159.7, 406.5, 177.2), "X", fontsize=11, align=1)

# List of at least 5 clients
clients = (
    "1. Boland Motor Group | Contact: 021 870 1234 | Service: Pre-delivery vehicle valet & chassis wash\n\n"
    "2. Paarl Auto Dealerships | Contact: 021 872 1000 | Service: Vehicle inventory valet & detailing\n\n"
    "3. Winelands Logistics Fleet | Contact: 021 863 4567 | Service: Commercial fleet cab & chassis wash\n\n"
    "4. Private Client: Johan Smuts | Contact: 082 555 1234 | Service: Executive vehicle full valet\n\n"
    "5. Private Client: Anriette Marais | Contact: 083 444 5678 | Service: Full interior & exterior detailing"
)
draw_in_rect(p2, (74.0, 266.0, 520.0, 555.0), clients, fontsize=8.8)

# Key activities (1 to 5)
draw_in_rect(p2, (95.0, 603.0, 520.0, 618.0), "Full vehicle interior and exterior valet detailing", fontsize=9)
draw_in_rect(p2, (95.0, 624.0, 520.0, 639.0), "Chemical chassis cleaning and chassis black coating application", fontsize=9)
draw_in_rect(p2, (95.0, 645.0, 520.0, 660.0), "Vehicle hand wash, hand polishing, and paint protection", fontsize=9)
draw_in_rect(p2, (95.0, 666.0, 520.0, 681.0), "Interior carpet, upholstery, and leather cleaning & treatment", fontsize=9)
draw_in_rect(p2, (95.0, 687.0, 520.0, 702.0), "Engine bay cleaning and tyre shine detailing", fontsize=9)

# 8 pictures provided? (Text: YES NO at y ≈ 730)
# Draw tick in YES
draw_in_rect(p2, (440.0, 726.0, 480.0, 744.0), "YES [X]", fontsize=9, align=1)


# ==================== PAGE 3 ====================
p3 = doc[2]

# Checklist on Page 3
# Box for Yes 1 (AFS): (435.8, 169.3, 457.1, 188.9)
draw_in_rect(p3, (435.8, 169.3, 457.1, 188.9), "X", fontsize=11, align=1)

# Box for Yes 2 (Proof of address): (435.8, 189.4, 457.1, 209.0)
draw_in_rect(p3, (435.8, 189.4, 457.1, 209.0), "X", fontsize=11, align=1)

# Box for Yes 3 (Pictures): (435.8, 209.5, 457.1, 229.2)
draw_in_rect(p3, (435.8, 209.5, 457.1, 229.2), "X", fontsize=11, align=1)

# Employer Representative details
# Name: (185.6, 413.2, 532.4, 434.4)
draw_in_rect(p3, (185.6, 413.2, 532.4, 434.4), "Du Toit Ellis", fontsize=9.5)
# Date: (185.6, 434.9, 532.4, 456.0)
draw_in_rect(p3, (185.6, 434.9, 532.4, 456.0), "18 / 08 / 2026", fontsize=9.5)
# Capacity: (185.6, 456.5, 532.4, 477.7)
draw_in_rect(p3, (185.6, 456.5, 532.4, 477.7), "Director", fontsize=9.5)

# Consultant details
# Name: (185.6, 548.0, 532.4, 569.2)
draw_in_rect(p3, (185.6, 548.0, 532.4, 569.2), "Winifred Beukes", fontsize=9.5)
# Date: (185.6, 569.6, 532.4, 590.9)
draw_in_rect(p3, (185.6, 569.6, 532.4, 590.9), "18 / 08 / 2026", fontsize=9.5)
# Capacity: (185.6, 591.4, 532.4, 612.6)
draw_in_rect(p3, (185.6, 591.4, 532.4, 612.6), "Accounting Consultant (My Accountant)", fontsize=9.5)

doc.save(original_pdf)
doc.close()
print("Saved finalized PDF successfully.")

# Re-render PNG previews
doc_check = pymupdf.open(original_pdf)
preview_dir = r"c:\myacc\scratch\cf1b_preview"
for idx, page in enumerate(doc_check):
    pix = page.get_pixmap(dpi=150)
    img_path = os.path.join(preview_dir, f"page_{idx+1}.png")
    pix.save(img_path)
doc_check.close()
print("Previews updated.")

