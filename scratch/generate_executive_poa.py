import pymupdf
import os

letterhead_path = r"c:\myacc\scratch\order_10102_docs\Letterhead.pdf"
poa_doc = pymupdf.open(letterhead_path)
page = poa_doc[0]

# Page dimensions: 595.3 x 841.9
# Letterhead banner ends at y ≈ 305

# 1. HEADER SECTION
# Main Title
page.insert_text((185, 335), "SPECIAL POWER OF ATTORNEY", fontsize=14, fontname="hebo", color=(0.06, 0.09, 0.16))
page.insert_text((120, 348), "COMPENSATION FOR OCCUPATIONAL INJURIES AND DISEASES ACT, 1993 (ACT 130 OF 1993)", fontsize=7.5, fontname="helv", color=(0.35, 0.4, 0.45))

# Subtle blue divider rule
page.draw_line(pymupdf.Point(54, 354), pymupdf.Point(541, 354), color=(0.08, 0.45, 0.75), width=1.5)

# 2. PARTICULAR SUMMARY TABLE
box_y = 364
box_rect = pymupdf.Rect(54, box_y, 541, box_y + 70)
page.draw_rect(box_rect, color=(0.78, 0.82, 0.88), fill=(0.97, 0.985, 1.0), width=0.8)

# Table Details
page.insert_text((66, box_y + 17), "Employer / Principal:", fontsize=8.5, fontname="hebo", color=(0.1, 0.15, 0.25))
page.insert_text((185, box_y + 17), "SUPER VALET PAARL (PTY) LTD", fontsize=8.5, fontname="hebo", color=(0.06, 0.09, 0.16))

page.insert_text((66, box_y + 32), "Registration No / Tax No:", fontsize=8, fontname="helv", color=(0.35, 0.4, 0.45))
page.insert_text((185, box_y + 32), "2019 / 094556 / 07   |   SARS Income Tax: 9329460225", fontsize=8, fontname="helv", color=(0.1, 0.15, 0.25))

page.insert_text((66, box_y + 47), "COIDA Reference Number:", fontsize=8, fontname="helv", color=(0.35, 0.4, 0.45))
page.insert_text((185, box_y + 47), "990001229984", fontsize=8.5, fontname="hebo", color=(0.06, 0.09, 0.16))

page.insert_text((66, box_y + 61), "Appointed Representative:", fontsize=8.5, fontname="hebo", color=(0.1, 0.15, 0.25))
page.insert_text((185, box_y + 61), "KEVIN FREESE (ID: 8606205046085)  —  My Accountant", fontsize=8.5, fontname="hebo", color=(0.02, 0.4, 0.7))

# 3. OPERATIVE APPOINTMENT CLAUSE
clause_lines = [
    "I, the undersigned, Du Toit Ellis (ID Number: 8208055110085), in my capacity as Director of",
    "SUPER VALET PAARL (PTY) LTD (Registration Number: 2019/094556/07), hereby nominate, constitute,",
    "and appoint Kevin Freese (ID Number: 8606205046085) of My Accountant to act as the company's lawful",
    "representative and agent in all matters pertaining to the Compensation Fund (COIDA)."
]

cy = 452
for line in clause_lines:
    page.insert_text((54, cy), line, fontsize=8.8, fontname="helv", color=(0.1, 0.15, 0.2))
    cy += 13

# 4. SCOPE OF POWERS
cy += 6
page.insert_text((54, cy), "The Appointed Representative is hereby authorised and empowered to:", fontsize=8.8, fontname="hebo", color=(0.08, 0.15, 0.25))
cy += 14

bullets = [
    ("•", "Sign, prepare, and lodge the CF-1B Application for Change of Nature of Business (Subclass 1910)."),
    ("•", "Liaise directly with officials of the Department of Employment and Labour and Compensation Commissioner."),
    ("•", "Request, access, and receive statements of account, assessment notices, and official Letters of Good Standing (LOGS)."),
    ("•", "Execute all lawful acts, documents, and representations necessary to finalize compliance for the company.")
]

for bullet, text in bullets:
    page.insert_text((62, cy), bullet, fontsize=9, fontname="hebo", color=(0.08, 0.45, 0.75))
    page.insert_text((74, cy), text, fontsize=8.2, fontname="helv", color=(0.18, 0.22, 0.28))
    cy += 14

# 5. RATIFICATION & COMMENCEMENT
cy += 6
page.insert_text((54, cy), "This Power of Attorney is effective from 01 August 2026 and shall remain in force until revoked in writing.", fontsize=8.5, fontname="helv", color=(0.18, 0.22, 0.28))
cy += 12
page.insert_text((54, cy), "I hereby ratify and confirm all lawful acts performed by the appointed representative under this mandate.", fontsize=8.5, fontname="helv", color=(0.18, 0.22, 0.28))
cy += 12
page.insert_text((54, cy), "Please acknowledge this appointment and provide any necessary assistance to facilitate Kevin Freese's duties.", fontsize=8.5, fontname="helv", color=(0.18, 0.22, 0.28))

# 6. SIGNATURE BLOCK BOX
sig_box_y = cy + 16
sig_box = pymupdf.Rect(54, sig_box_y, 541, sig_box_y + 80)
page.draw_rect(sig_box, color=(0.8, 0.84, 0.88), fill=(0.99, 0.995, 1.0), width=0.8)

# Left Column: Execution Details
page.insert_text((68, sig_box_y + 22), "Signed at:", fontsize=8.5, fontname="hebo", color=(0.3, 0.35, 0.42))
page.insert_text((120, sig_box_y + 22), "Paarl, Western Cape", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.2))

page.insert_text((68, sig_box_y + 40), "Date:", fontsize=8.5, fontname="hebo", color=(0.3, 0.35, 0.42))
page.insert_text((120, sig_box_y + 40), "18 August 2026", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.2))

page.insert_text((68, sig_box_y + 58), "Capacity:", fontsize=8.5, fontname="hebo", color=(0.3, 0.35, 0.42))
page.insert_text((120, sig_box_y + 58), "Director (Authorised Signatory)", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.2))

# Right Column: Signature Line
page.draw_line(pymupdf.Point(315, sig_box_y + 45), pymupdf.Point(525, sig_box_y + 45), color=(0.3, 0.35, 0.4), width=1)
page.insert_text((315, sig_box_y + 58), "DU TOIT ELLIS", fontsize=9, fontname="hebo", color=(0.06, 0.09, 0.16))
page.insert_text((315, sig_box_y + 70), "Director  |  Super Valet Paarl (Pty) Ltd", fontsize=7.8, fontname="helv", color=(0.35, 0.4, 0.45))

output_onedrive = r"C:\Users\kev\OneDrive\Documents\Power of Attorney - Kevin Freese - Super Valet Paarl.pdf"
output_scratch = r"c:\myacc\scratch\Power_of_Attorney_Super_Valet_Paarl.pdf"

poa_doc.save(output_onedrive)
poa_doc.save(output_scratch)
poa_doc.close()

# Preview
preview_doc = pymupdf.open(output_onedrive)
pix = preview_doc[0].get_pixmap(dpi=150)
preview_path = r"c:\myacc\scratch\poa_professional_preview.png"
pix.save(preview_path)
preview_doc.close()

print("Regenerated perfected executive Power of Attorney.")
