import imaplib
import email
from email.header import decode_header
import sys

sys.stdout.reconfigure(encoding='utf-8')

mail = imaplib.IMAP4_SSL("169.239.218.67", 993)
mail.login("kev@thinkestry.co.za", "7In~K;EF}?7E_7p4")
mail.select('"INBOX"')

s, msgs = mail.search(None, '(SUBJECT "Examples of NCR Drafting")')
if s == "OK" and msgs[0]:
    for mid in msgs[0].split():
        res, data = mail.fetch(mid, "(BODY[HEADER.FIELDS (SUBJECT FROM DATE)])")
        if data and isinstance(data[0], tuple):
            hdr = email.message_from_bytes(data[0][1])
            print("Found in Kev's INBOX:", hdr.get("Subject"), "Date:", hdr.get("Date"))

mail.logout()
