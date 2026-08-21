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

print("--- Inspecting INBOX.NCR Renewal fees ---")
mail.select('"INBOX.NCR Renewal fees"')
s, msgs = mail.search(None, 'ALL')
if s == "OK" and msgs[0]:
    for mid in msgs[0].split():
        res, data = mail.fetch(mid, "(RFC822)")
        if data and isinstance(data[0], tuple):
            msg = email.message_from_bytes(data[0][1])
            subj = decode_str(msg.get("Subject", ""))
            from_ = decode_str(msg.get("From", ""))
            to_ = decode_str(msg.get("To", ""))
            date_ = decode_str(msg.get("Date", ""))
            body = get_body(msg)
            print(f"Date: {date_} | From: {from_} | To: {to_} | Subject: {subj}")
            print("Body snippet:\n", "\n".join([l.strip() for l in body.splitlines() if l.strip()][:10]))
            print("-" * 50)

print("\n--- Inspecting Sent emails to @ncr.org.za ---")
mail.select('"INBOX.Sent"')
s, msgs = mail.search(None, '(TO "ncr.org.za")')
if s == "OK" and msgs[0]:
    print(f"Found {len(msgs[0].split())} sent emails to @ncr.org.za")
    for mid in msgs[0].split()[-10:]:
        res, data = mail.fetch(mid, "(RFC822)")
        if data and isinstance(data[0], tuple):
            msg = email.message_from_bytes(data[0][1])
            subj = decode_str(msg.get("Subject", ""))
            to_ = decode_str(msg.get("To", ""))
            date_ = decode_str(msg.get("Date", ""))
            print(f"Date: {date_} | To: {to_} | Subject: {subj}")

mail.logout()
