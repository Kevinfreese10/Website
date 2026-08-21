import imaplib
import email
from email.header import decode_header
import sys

sys.stdout.reconfigure(encoding='utf-8')

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
            if ctype in ['text/plain', 'text/html'] and 'attachment' not in cdispo:
                payload = part.get_payload(decode=True)
                if payload:
                    body += payload.decode('utf-8', errors='replace') + "\n"
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            body = payload.decode('utf-8', errors='replace')
    return body

mail = imaplib.IMAP4_SSL("169.239.218.67", 993)
mail.login("winifred@myacc.co.za", "vcG%4&Qr,_W{W6M)")

for folder in ["INBOX.Sent", "INBOX"]:
    mail.select(f'"{folder}"')
    s, msgs = mail.search(None, '(BODY "share certificate")')
    if s == "OK" and msgs[0]:
        print(f"\n[{folder}] Found {len(msgs[0].split())} messages with 'share certificate':")
        for mid in msgs[0].split()[-10:]:
            res, data = mail.fetch(mid, "(RFC822)")
            if not data or not isinstance(data[0], tuple):
                continue
            msg = email.message_from_bytes(data[0][1])
            subj = decode_str(msg.get("Subject", ""))
            date_ = decode_str(msg.get("Date", ""))
            to_ = decode_str(msg.get("To", ""))
            from_ = decode_str(msg.get("From", ""))
            body = get_body(msg)
            atts = [decode_str(part.get_filename()) for part in msg.walk() if part.get_filename()]
            
            print("="*60)
            print(f"ID: {mid.decode()} | Date: {date_} | To: {to_} | From: {from_} | Subj: {subj}")
            if atts:
                print(f"Attachments: {atts}")
            print("Snippet:")
            print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:15]))

mail.logout()
