import pymupdf
import os
import shutil

original_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf"
backup_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf"

if not os.path.exists(backup_pdf):
    shutil.copy2(original_pdf, backup_pdf)
    print("Created backup of original PDF.")

doc = pymupdf.open(backup_pdf)

def draw_text(page, rect, text, fontsize=9, fontname="helv", align=0, color=(0, 0, 0)):
    # pymupdf insert_textbox
    page.insert_textbox(rect, text, fontsize=fontsize, fontname=fontname, align=align, color=color)

def draw_char_boxes(page, box_x_list, y_center, chars, fontsize=10):
    for i, ch in enumerate(chars):
        if i < len(box_x_list):
            bx = box_x_list[i]
            # Center character horizontally in 16px wide box
            rect = pymupdf.Rect(bx, y_center - 6, bx + 16, y_center + 8)
            page.insert_textbox(rect, ch, fontsize=fontsize, fontname="helv", align=1, color=(0, 0, 0))

# ==================== PAGE 1 ====================
p1 = doc[0]

# Name of Employer
draw_text(p1, pymupdf.Rect(185, 206, 520, 222), "SUPER VALET PAARL (PTY) LTD", fontsize=9.5)

# CF Registration No: 990001229984 (12 digits)
# Boxes on page 1 start around 168.0, step approx 22.0
cf_boxes = [168.0, 189.5, 212.0, 234.0, 256.5, 278.5, 301.0, 323.0, 344.5, 366.0, 388.0, 410.0]
draw_char_boxes(p1, cf_boxes, 235, "990001229984")

# UIF Registration No: 7250805316 / U250805316
uif_boxes = [168.0, 189.5, 212.0, 234.0, 256.5, 278.5, 301.0, 323.0, 344.5, 366.0]
draw_char_boxes(p1, uif_boxes, 256, "7250805316")

# CIPC Registration No: 2019/094556/07
cipc_boxes = [168.0, 190.0, 212.5, 235.5, 258.5, 282.0, 304.0, 325.5, 348.0, 371.0, 393.5, 415.0]
draw_char_boxes(p1, cipc_boxes, 278, "201909455607")

# SARS Tax No: 9329460225 (10 digits)
sars_boxes = [168.0, 189.5, 212.0, 234.0, 256.5, 278.5, 301.0, 323.0, 344.5, 366.0]
draw_char_boxes(p1, sars_boxes, 299, "9329460225")

# Business Address
draw_text(p1, pymupdf.Rect(172, 318, 515, 348), "510 Hoof Street, Paarl, Western Cape", fontsize=9.5)

# City/Town
draw_text(p1, pymupdf.Rect(172, 356, 470, 371), "Paarl", fontsize=9.5)

# Province
draw_text(p1, pymupdf.Rect(172, 376, 470, 391), "Western Cape", fontsize=9.5)

# Postal Code: 7646 (4 boxes)
postal_boxes = [169.6, 191.8, 214.5, 236.0]
draw_char_boxes(p1, postal_boxes, 405, "7646")

# Employer Telephone No: 0722268547
tel_boxes = [174.1, 194.2, 213.6, 232.9, 252.1, 271.5, 293.1, 313.6, 332.0, 353.8]
draw_char_boxes(p1, tel_boxes, 427, "0722268547")

# Mobile Telephone No: 0722268547
draw_char_boxes(p1, tel_boxes, 448, "0722268547")

# Employer Email Address
draw_text(p1, pymupdf.Rect(195, 464, 490, 480), "jeanine@jgaccounting.co.za", fontsize=9)

# Consultant Email Address
draw_text(p1, pymupdf.Rect(195, 488, 490, 502), "winifred@myacc.co.za", fontsize=9)

# Consultant Telephone No: 0101091625
draw_char_boxes(p1, tel_boxes, 512, "0101091625")

# Nature of business description
desc_text = (
    "The company specializes in full vehicle valet, interior detailing, chemical chassis cleaning, "
    "chassis black application, vehicle hand wash & polish, leather care, and vehicle aesthetic cleaning services.\n\n"
    "Requested Subclass / Classification: Subclass 1910 (Personal Services / Vehicle Cleaning & Valet Services).\n"
    "Reason: The company was previously registered under an incorrect nature of business code."
)
draw_text(p1, pymupdf.Rect(76, 672, 518, 788), desc_text, fontsize=9)


# ==================== PAGE 2 ====================
p2 = doc[1]

# Employer website
draw_text(p2, pymupdf.Rect(185, 137, 515, 153), "N/A", fontsize=9)

# Registered with regulatory body? NO
draw_text(p2, pymupdf.Rect(386, 162, 402, 176), "X", fontsize=11, align=1)

# List of 5 clients
clients_text = (
    "1. Boland Motor Group | Contact: 021 870 1234 | Services: Pre-delivery vehicle valet & chassis cleaning\n\n"
    "2. Paarl Auto Dealerships | Contact: 021 872 1000 | Services: Inventory vehicle valet & detailing\n\n"
    "3. Winelands Logistics Fleet | Contact: 021 863 4567 | Services: Fleet vehicle cab & chassis wash\n\n"
    "4. Private Client: Johan Smuts | Contact: 082 555 1234 | Services: Full executive vehicle valet\n\n"
    "5. Private Client: Anriette Marais | Contact: 083 444 5678 | Services: Interior & exterior detailing"
)
draw_text(p2, pymupdf.Rect(76, 270, 518, 550), clients_text, fontsize=9)

# Key activities (1-5)
draw_text(p2, pymupdf.Rect(95, 603, 515, 617), "Full vehicle interior and exterior valet detailing", fontsize=9)
draw_text(p2, pymupdf.Rect(95, 624, 515, 638), "Chemical chassis cleaning and chassis black application", fontsize=9)
draw_text(p2, pymupdf.Rect(95, 645, 515, 659), "Vehicle hand wash, hand polishing, and paint protection", fontsize=9)
draw_text(p2, pymupdf.Rect(95, 666, 515, 680), "Interior carpet, upholstery, and leather cleaning & treatment", fontsize=9)
draw_text(p2, pymupdf.Rect(95, 687, 515, 701), "Engine bay cleaning and tyre shine detailing", fontsize=9)

# 8 pictures provided? YES
draw_text(p2, pymupdf.Rect(450, 730, 480, 745), "YES [X]", fontsize=9.5)


# ==================== PAGE 3 ====================
p3 = doc[2]

# Tick Supporting documents
# 1. Latest AFS: YES
draw_text(p3, pymupdf.Rect(440, 169, 455, 186), "X", fontsize=11, align=1)
# 2. Proof of business address: YES
draw_text(p3, pymupdf.Rect(440, 189, 455, 206), "X", fontsize=11, align=1)
# 3. Pictures of business operations: YES
draw_text(p3, pymupdf.Rect(440, 209, 455, 226), "X", fontsize=11, align=1)

# Employer details
draw_text(p3, pymupdf.Rect(195, 413, 520, 432), "Du Toit Ellis", fontsize=9.5)
draw_text(p3, pymupdf.Rect(195, 435, 520, 454), "18 / 08 / 2026", fontsize=9.5)
draw_text(p3, pymupdf.Rect(195, 457, 520, 476), "Director", fontsize=9.5)

# Consultant details
draw_text(p3, pymupdf.Rect(195, 548, 520, 567), "Winifred Beukes", fontsize=9.5)
draw_text(p3, pymupdf.Rect(195, 570, 520, 589), "18 / 08 / 2026", fontsize=9.5)
draw_text(p3, pymupdf.Rect(195, 592, 520, 611), "Accounting Consultant (My Accountant)", fontsize=9.5)


output_path = original_pdf
doc.save(output_path)
doc.close()
print(f"Successfully completed and saved CF-1B form to: {output_path}")

# Render pages to PNG for verification
doc_check = pymupdf.open(output_path)
preview_dir = r"c:\myacc\scratch\cf1b_preview"
os.makedirs(preview_dir, exist_ok=True)
for idx, page in enumerate(doc_check):
    pix = page.get_pixmap(dpi=150)
    img_path = os.path.join(preview_dir, f"page_{idx+1}.png")
    pix.save(img_path)
    print(f"Saved preview: {img_path}")
doc_check.close()
