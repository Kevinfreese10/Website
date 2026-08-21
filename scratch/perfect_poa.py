import pymupdf
import os

letterhead_path = r"c:\myacc\scratch\order_10102_docs\Letterhead.pdf"
poa_doc = pymupdf.open(letterhead_path)
page = poa_doc[0]

# Banner extends down to y ≈ 305. Start cleanly at y = 335
start_y = 335

# Title
page.insert_text((72, start_y), "POWER OF ATTORNEY", fontsize=14, fontname="hebo")

# Date
page.insert_text((72, start_y + 22), "Date: 18 August 2026", fontsize=10, fontname="helv")

# Salutation
page.insert_text((72, start_y + 46), "To Whom It May Concern,", fontsize=10, fontname="hebo")

# Body paragraphs
body_p1 = (
    "I, Du Toit Ellis (ID Number: 8208055110085), Director of SUPER VALET PAARL (PTY) LTD, "
    "Registration Number: 2019/094556/07, hereby appoint Kevin Freese (ID Number: 8606205046085) "
    "to act on my behalf in all matters pertaining to the Compensation for Occupational Injuries and "
    "Diseases Act (COIDA) and the Compensation Fund."
)

rect_p1 = pymupdf.Rect(72, start_y + 64, 523, start_y + 125)
page.insert_textbox(rect_p1, body_p1, fontsize=10, fontname="helv", lineheight=1.35)

body_p2 = "This Power of Attorney is effective from 01 August 2026."
page.insert_text((72, start_y + 134), body_p2, fontsize=10, fontname="helv")

body_p3 = (
    "Please acknowledge this appointment and provide any necessary assistance to facilitate "
    "Kevin Freese's duties as specified."
)
rect_p3 = pymupdf.Rect(72, start_y + 154, 523, start_y + 195)
page.insert_textbox(rect_p3, body_p3, fontsize=10, fontname="helv", lineheight=1.35)

page.insert_text((72, start_y + 204), "Thank you for your cooperation.", fontsize=10, fontname="helv")

# Sign-off & Signature Box
sig_y = start_y + 238
page.insert_text((72, sig_y), "Yours faithfully,", fontsize=10, fontname="helv")

# Signature line
page.draw_line(pymupdf.Point(72, sig_y + 55), pymupdf.Point(260, sig_y + 55), color=(0, 0, 0), width=1)
page.insert_text((72, sig_y + 68), "Du Toit Ellis", fontsize=10, fontname="hebo")
page.insert_text((72, sig_y + 82), "Director", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 96), "Super Valet Paarl (Pty) Ltd", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 110), "ID Number: 8208055110085", fontsize=9.5, fontname="helv")
page.insert_text((72, sig_y + 124), "Contact: 072 226 8547", fontsize=9.5, fontname="helv")

poa_dest_onedrive = r"C:\Users\kev\OneDrive\Documents\Power of Attorney - Kevin Freese - Super Valet Paarl.pdf"
poa_dest_scratch = r"c:\myacc\scratch\Power_of_Attorney_Super_Valet_Paarl.pdf"

poa_doc.save(poa_dest_onedrive)
poa_doc.save(poa_dest_scratch)
poa_doc.close()

# Re-render POA preview
poa_check = pymupdf.open(poa_dest_onedrive)
pix_poa = poa_check[0].get_pixmap(dpi=150)
pix_poa.save(r"c:\myacc\scratch\poa_preview.png")
poa_check.close()
print("Perfected POA PDF generated.")
