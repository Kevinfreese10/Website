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

def get_body(msg):
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype in ['text/plain'] and 'attachment' not in cdispo:
                payload = part.get_payload(decode=True)
                if payload:
                    body += payload.decode('utf-8', errors='replace') + "\n"
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode('utf-8', errors='replace')
    return body

mail = imaplib.IMAP4_SSL(HOST, PORT)
mail.login(USER, PASS)

for folder in ["INBOX.Sent", "INBOX"]:
    mail.select(f'"{folder}"')
    for q in ['(TO "ignatious5480@gmail.com")', '(CC "ignatious5480@gmail.com")', '(TO "iggy@maleha.co.za")', '(CC "iggy@maleha.co.za")']:
        s, msgs = mail.search(None, q)
        if s == "OK" and msgs[0]:
            for mid in msgs[0].split():
                res, data = mail.fetch(mid, "(RFC822)")
                if not data or not isinstance(data[0], tuple):
                    continue
                msg = email.message_from_bytes(data[0][1])
                subj = decode_str(msg.get("Subject", ""))
                date_ = decode_str(msg.get("Date", ""))
                to_ = decode_str(msg.get("To", ""))
                from_ = decode_str(msg.get("From", ""))
                body = get_body(msg)
                atts = [part.get_filename() for part in msg.walk() if part.get_filename()]
                print(f"[{folder}] ID: {mid.decode()} | Date: {date_} | From: {from_} | To: {to_} | Subj: {subj}")
                if atts:
                    print(f"   Attachments: {atts}")
                print(f"   Body: {body.strip()[:200]}")
                print("-" * 50)

mail.logout()
