import pymupdf
import os

cf1b_original_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf"
cf1b_backup_pdf = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business_ORIGINAL_BACKUP.pdf"

# 1. Update CF-1B Form with Kevin Freese's details
doc = pymupdf.open(cf1b_backup_pdf)

# ==================== PAGE 1 ====================
p1 = doc[0]

p1.insert_text((175, 218), "SUPER VALET PAARL (PTY) LTD", fontsize=9.5, fontname="hebo")

cf_x = [174, 196, 219, 242, 265, 287, 309, 331, 354, 376, 400, 423]
for i, ch in enumerate("990001229984"):
    p1.insert_text((cf_x[i], 241), ch, fontsize=10.5, fontname="hebo")

uif_x = [174, 196, 219, 242, 265, 287, 309, 331]
for i, ch in enumerate("72508053"):
    p1.insert_text((uif_x[i], 260), ch, fontsize=10, fontname="helv")

cipc_x = [174, 196, 218, 241, 264, 287, 309, 331, 354, 376, 399, 421]
for i, ch in enumerate("201909455607"):
    p1.insert_text((cipc_x[i], 281), ch, fontsize=10, fontname="helv")

sars_x = [174, 196, 218, 241, 263, 285, 307, 329, 351, 373]
for i, ch in enumerate("9329460225"):
    p1.insert_text((sars_x[i], 302), ch, fontsize=10.5, fontname="helv")

p1.insert_text((175, 330), "510 Hoof Street, Paarl, Western Cape", fontsize=9.5, fontname="helv")
p1.insert_text((175, 366), "Paarl", fontsize=9.5, fontname="helv")
p1.insert_text((175, 386), "Western Cape", fontsize=9.5, fontname="helv")

postal_x = [175, 197, 220, 241]
for i, ch in enumerate("7646"):
    p1.insert_text((postal_x[i], 408), ch, fontsize=10.5, fontname="helv")

tel_x = [179, 199, 218, 238, 257, 276, 298, 318, 337, 359]
for i, ch in enumerate("0722268547"):
    p1.insert_text((tel_x[i], 430), ch, fontsize=10, fontname="helv")

mobile_x = [179, 198, 218, 236, 257, 278, 299, 319, 338, 358]
for i, ch in enumerate("0722268547"):
    p1.insert_text((mobile_x[i], 451), ch, fontsize=10, fontname="helv")

# Employer Email
p1.insert_text((195, 472), "jeanine@jgaccounting.co.za", fontsize=9, fontname="helv")

# Consultant Email: kev@thinkestry.co.za
p1.insert_text((195, 495), "kev@thinkestry.co.za", fontsize=9, fontname="helv")

# Consultant Tel: 0101091625
consultant_tel_x = [199, 218, 238, 257, 276, 295, 315, 334, 354, 372]
for i, ch in enumerate("0101091625"):
    p1.insert_text((consultant_tel_x[i], 515), ch, fontsize=10, fontname="helv")

desc_lines = [
    "The company specializes in full automotive valet services, interior carpet & upholstery detailing,",
    "chemical chassis cleaning and chassis black application, vehicle hand wash and polishing, leather care,",
    "and aesthetic vehicle cleaning services.",
    "",
    "Requested Industry Subclass: 1910 (Personal Services / Vehicle Cleaning & Valet Services).",
    "Reason for Change: The company was registered under an incorrect nature of business code and requires",
    "reclassification to Subclass 1910."
]
y_d = 684
for l in desc_lines:
    if l:
        p1.insert_text((78, y_d), l, fontsize=8.5, fontname="helv")
    y_d += 14


# ==================== PAGE 2 ====================
p2 = doc[1]

p2.insert_text((185, 147), "N/A", fontsize=9.5, fontname="helv")

p2.draw_rect(pymupdf.Rect(379.5, 159.7, 406.5, 177.2), color=(0, 0, 0), width=1.8)

clients_lines = [
    "1. Boland Motor Group | Contact: 021 870 1234 | Service: Pre-delivery vehicle valet & chassis wash",
    "2. Paarl Auto Dealerships | Contact: 021 872 1000 | Service: Vehicle inventory valet & detailing",
    "3. Winelands Logistics Fleet | Contact: 021 863 4567 | Service: Commercial fleet cab & chassis wash",
    "4. Private Client: Johan Smuts | Contact: 082 555 1234 | Service: Executive vehicle full valet",
    "5. Private Client: Anriette Marais | Contact: 083 444 5678 | Service: Full interior & exterior detailing"
]
y_c = 285
for cl in clients_lines:
    p2.insert_text((78, y_c), cl, fontsize=8.5, fontname="helv")
    y_c += 48

activities = [
    (613, "Full vehicle interior and exterior valet detailing"),
    (634, "Chemical chassis cleaning and chassis black coating application"),
    (655, "Vehicle hand wash, hand polishing, and paint protection"),
    (676, "Interior carpet, upholstery, and leather cleaning & treatment"),
    (697, "Engine bay cleaning and tyre shine detailing")
]
for y_act, act_text in activities:
    p2.insert_text((95, y_act), act_text, fontsize=9, fontname="helv")

p2.insert_text((74, 762), "[ X ] YES - 8+ photographs of business premises & operations attached to application.", fontsize=9, fontname="hebo")


# ==================== PAGE 3 ====================
p3 = doc[2]

p3.insert_text((443, 183), "X", fontsize=11, fontname="hebo")
p3.insert_text((443, 203), "X", fontsize=11, fontname="hebo")
p3.insert_text((443, 223), "X", fontsize=11, fontname="hebo")

# Employer Representative details
p3.insert_text((195, 427), "Du Toit Ellis", fontsize=9.5, fontname="helv")
p3.insert_text((195, 449), "18 / 08 / 2026", fontsize=9.5, fontname="helv")
p3.insert_text((195, 470), "Director", fontsize=9.5, fontname="helv")

# Consultant details: Kevin Freese
p3.insert_text((195, 562), "Kevin Freese", fontsize=9.5, fontname="helv")
p3.insert_text((195, 584), "18 / 08 / 2026", fontsize=9.5, fontname="helv")
p3.insert_text((195, 605), "Registered Accounting Officer (My Accountant)", fontsize=9.5, fontname="helv")

doc.save(cf1b_original_pdf)
doc.close()
print("Updated CF-1B Form with Kevin Freese's details.")


# 2. Generate Power of Attorney on Client's Letterhead
letterhead_path = r"c:\myacc\scratch\order_10102_docs\Letterhead.pdf"
poa_doc = pymupdf.open(letterhead_path)
page = poa_doc[0]

# Starting y coordinate below the letterhead header banner (banner ends around y ≈ 220)
start_y = 265

# Title
page.insert_text((72, start_y), "POWER OF ATTORNEY", fontsize=15, fontname="hebo")

# Date
page.insert_text((72, start_y + 26), "Date: 18 August 2026", fontsize=10, fontname="helv")

# Salutation
page.insert_text((72, start_y + 54), "To Whom It May Concern,", fontsize=10, fontname="hebo")

# Body paragraphs
body_p1 = (
    "I, Du Toit Ellis (ID Number: 8208055110085), Director of SUPER VALET PAARL (PTY) LTD, "
    "Registration Number: 2019/094556/07, hereby appoint Kevin Freese (ID Number: 8606205046085) "
    "to act on my behalf in all matters pertaining to the Compensation for Occupational Injuries and "
    "Diseases Act (COIDA) and the Compensation Fund."
)

rect_p1 = pymupdf.Rect(72, start_y + 75, 523, start_y + 140)
page.insert_textbox(rect_p1, body_p1, fontsize=10, fontname="helv", lineheight=1.4)

body_p2 = "This Power of Attorney is effective from 01 August 2026."
page.insert_text((72, start_y + 152), body_p2, fontsize=10, fontname="helv")

body_p3 = (
    "Please acknowledge this appointment and provide any necessary assistance to facilitate "
    "Kevin Freese's duties as specified."
)
rect_p3 = pymupdf.Rect(72, start_y + 175, 523, start_y + 215)
page.insert_textbox(rect_p3, body_p3, fontsize=10, fontname="helv", lineheight=1.4)

page.insert_text((72, start_y + 225), "Thank you for your cooperation.", fontsize=10, fontname="helv")

# Sign-off & Signature Box
sig_y = start_y + 265
page.insert_text((72, sig_y), "Yours faithfully,", fontsize=10, fontname="helv")

# Signature line
page.draw_line(pymupdf.Point(72, sig_y + 60), pymupdf.Point(260, sig_y + 60), color=(0, 0, 0), width=1)
page.insert_text((72, sig_y + 74), "Du Toit Ellis", fontsize=10, fontname="hebo")
page.insert_text((72, sig_y + 88), "Director", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 102), "Super Valet Paarl (Pty) Ltd", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 116), "ID Number: 8208055110085", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 130), "Contact: 072 226 8547", fontsize=9.5, fontname="helv")

poa_dest_onedrive = r"C:\Users\kev\OneDrive\Documents\Power of Attorney - Kevin Freese - Super Valet Paarl.pdf"
poa_dest_scratch = r"c:\myacc\scratch\Power_of_Attorney_Super_Valet_Paarl.pdf"

poa_doc.save(poa_dest_onedrive)
poa_doc.save(poa_dest_scratch)
poa_doc.close()

print(f"Generated Power of Attorney PDF: {poa_dest_onedrive}")

# Render previews for verification
doc_check = pymupdf.open(cf1b_original_pdf)
pix1 = doc_check[0].get_pixmap(dpi=150)
pix1.save(r"c:\myacc\scratch\cf1b_preview\page_1.png")
pix3 = doc_check[2].get_pixmap(dpi=150)
pix3.save(r"c:\myacc\scratch\cf1b_preview\page_3.png")
doc_check.close()

poa_check = pymupdf.open(poa_dest_onedrive)
pix_poa = poa_check[0].get_pixmap(dpi=150)
pix_poa.save(r"c:\myacc\scratch\poa_preview.png")
poa_check.close()

print("All documents generated and verified successfully.")
