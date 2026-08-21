import imaplib
import email
from email.header import decode_header
import re
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

folders = [
    "INBOX",
    "INBOX.NCR Renewal fees",
    "INBOX.Tax Reps  - Darryl",
    "INBOX.Website chat",
    "INBOX.CV's",
    "INBOX.To Do",
    "INBOX.Archive",
    "INBOX.Sent",
    "INBOX.Drafts",
    "INBOX.Trash",
    "INBOX.spam"
]

search_terms = ["21645", "NCRCP21645", "Fabonacci", "Fibonacci", "0766707349", "076 670 7349", "ncr.org.za", "NCRCP"]

for folder in folders:
    try:
        s, count = mail.select(f'"{folder}"')
        if s != "OK":
            print(f"Failed to select {folder}: {s}")
            continue
        
        found_ids = set()
        for term in search_terms:
            for field in ['SUBJECT', 'BODY', 'FROM', 'TO', 'CC']:
                try:
                    s_search, msgs = mail.search(None, f'({field} "{term}")')
                    if s_search == "OK" and msgs[0]:
                        found_ids.update(msgs[0].split())
                except Exception as e:
                    pass
                    
        print(f"Folder '{folder}': found {len(found_ids)} candidate messages.")
        for mid in sorted(list(found_ids), key=lambda x: int(x), reverse=True):
            res, data = mail.fetch(mid, "(RFC822)")
            if not data or not isinstance(data[0], tuple):
                continue
            msg = email.message_from_bytes(data[0][1])
            subj = decode_str(msg.get("Subject", ""))
            date_ = decode_str(msg.get("Date", ""))
            to_ = decode_str(msg.get("To", ""))
            from_ = decode_str(msg.get("From", ""))
            cc_ = decode_str(msg.get("Cc", ""))
            body = get_body(msg)
            atts = [decode_str(part.get_filename()) for part in msg.walk() if part.get_filename()]
            
            combined = (subj + " " + date_ + " " + to_ + " " + from_ + " " + body).lower()
            if any(k.lower() in combined for k in ["21645", "fabonacci", "fibonacci", "0766707349"]):
                print("\n" + "="*70)
                print(f"*** DIRECT MATCH *** [{folder}] ID: {mid.decode()}")
                print(f"Date:        {date_}")
                print(f"From:        {from_}")
                print(f"To:          {to_}")
                if cc_:
                    print(f"Cc:          {cc_}")
                print(f"Subject:     {subj}")
                if atts:
                    print(f"Attachments: {atts}")
                print("-" * 40)
                print("Body snippet:")
                print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:30]))
                print("="*70)
            elif "ncrcp" in combined or "ncr" in subj.lower():
                # print recent 10 NCR emails just in case
                pass
    except Exception as e:
        print(f"Error in {folder}: {e}")

mail.logout()
