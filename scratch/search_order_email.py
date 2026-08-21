import imaplib
import email
from email.header import decode_header
import sys

sys.stdout.reconfigure(encoding='utf-8')

HOST = "mail.myacc.co.za"
PORT = 993
USER = "winifred@myacc.co.za"
PASS = "vcG%4&Qr,_W{W6M)"

def decode_str(val):
    if not val:
        return ""
    decoded_parts = decode_header(val)
    res = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            res.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            res.append(str(part))
    return "".join(res)

def main():
    mail = imaplib.IMAP4_SSL(HOST, PORT)
    mail.login(USER, PASS)
    
    queries = [
        '(SUBJECT "990001229984")',
        '(SUBJECT "Super Valet")',
        '(SUBJECT "10102")',
        '(BODY "990001229984")',
        '(FROM "jeanine@jgaccounting.co.za")',
        '(TO "jeanine@jgaccounting.co.za")',
    ]
    
    for f in ["INBOX.Sent", "INBOX"]:
        mail.select(f'"{f}"')
        all_ids = set()
        for q in queries:
            status, msgs = mail.search(None, q)
            if status == "OK" and msgs[0]:
                all_ids.update(msgs[0].split())
        print(f"Folder {f}: found {len(all_ids)} messages matching 10102 / 990001229984")
        for mid in all_ids:
            res, data = mail.fetch(mid, "(BODY[HEADER.FIELDS (SUBJECT FROM TO DATE)])")
            hdr = email.message_from_bytes(data[0][1])
            print(f"- Date: {decode_str(hdr.get('Date', ''))} | From: {decode_str(hdr.get('From', ''))} | Subject: {decode_str(hdr.get('Subject', ''))}")

    mail.logout()

if __name__ == "__main__":
    main()
