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
            if ctype in ['text/plain', 'text/html'] and 'attachment' not in cdispo:
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

# Check INBOX.NCR Renewal fees first
print("Checking INBOX.NCR Renewal fees...")
s, c = mail.select('"INBOX.NCR Renewal fees"')
if s == "OK":
    s_all, msgs = mail.search(None, 'ALL')
    ids = msgs[0].split()
    print(f"Total messages in NCR Renewal fees: {len(ids)}")
    for mid in reversed(ids):
        res, data = mail.fetch(mid, "(RFC822)")
        if not data or not isinstance(data[0], tuple):
            continue
        msg = email.message_from_bytes(data[0][1])
        subj = decode_str(msg.get("Subject", ""))
        date_ = decode_str(msg.get("Date", ""))
        from_ = decode_str(msg.get("From", ""))
        to_ = decode_str(msg.get("To", ""))
        body = get_body(msg)
        atts = [decode_str(part.get_filename()) for part in msg.walk() if part.get_filename()]
        print(f"ID: {mid.decode()} | Date: {date_} | From: {from_} | Subj: {subj}")
        if any(k in (subj + body).lower() for k in ["21645", "fabonacci", "fibonacci"]):
            print(">>> FOUND MATCH IN NCR RENEWAL FEES! <<<")
            print(f"Attachments: {atts}")
            print(f"Body:\n{body[:500]}")
            print("="*60)

# Check INBOX with SUBJECT/FROM search
print("\nChecking INBOX...")
mail.select('"INBOX"')
for term in ["21645", "Fabonacci", "Fibonacci", "0766707349"]:
    for field in ['SUBJECT', 'BODY']:
        s_res, m_res = mail.search(None, f'({field} "{term}")')
        if s_res == "OK" and m_res[0]:
            print(f"Matches for {field} {term}: {m_res[0].decode()}")
            for mid in m_res[0].split():
                res, data = mail.fetch(mid, "(RFC822)")
                msg = email.message_from_bytes(data[0][1])
                subj = decode_str(msg.get("Subject", ""))
                date_ = decode_str(msg.get("Date", ""))
                from_ = decode_str(msg.get("From", ""))
                body = get_body(msg)
                atts = [decode_str(part.get_filename()) for part in msg.walk() if part.get_filename()]
                print(f"ID: {mid.decode()} | Date: {date_} | From: {from_} | Subj: {subj}")
                print(f"Attachments: {atts}")
                print(f"Body snippet:\n{body[:400]}")
                print("="*60)

# Check INBOX.Sent
print("\nChecking INBOX.Sent...")
mail.select('"INBOX.Sent"')
for term in ["21645", "Fabonacci", "Fibonacci", "0766707349"]:
    for field in ['SUBJECT', 'BODY', 'TO']:
        s_res, m_res = mail.search(None, f'({field} "{term}")')
        if s_res == "OK" and m_res[0]:
            print(f"Sent matches for {field} {term}: {m_res[0].decode()}")
            for mid in m_res[0].split():
                res, data = mail.fetch(mid, "(RFC822)")
                msg = email.message_from_bytes(data[0][1])
                subj = decode_str(msg.get("Subject", ""))
                date_ = decode_str(msg.get("Date", ""))
                to_ = decode_str(msg.get("To", ""))
                body = get_body(msg)
                atts = [decode_str(part.get_filename()) for part in msg.walk() if part.get_filename()]
                print(f"ID: {mid.decode()} | Date: {date_} | To: {to_} | Subj: {subj}")
                print(f"Attachments: {atts}")
                print(f"Body snippet:\n{body[:400]}")
                print("="*60)

mail.logout()
