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

def search_account(user, password, host="mail.myacc.co.za"):
    print(f"\n==================== SEARCHING {user} ====================")
    mail = imaplib.IMAP4_SSL(host, 993)
    mail.login(user, password)
    
    for folder in ["INBOX", "INBOX.Sent"]:
        try:
            s, c = mail.select(f'"{folder}"')
            if s != "OK":
                continue
            
            queries = [
                '(BODY "share certificate")',
                '(BODY "share certificates")',
                '(SUBJECT "share certificate")',
                '(SUBJECT "share certificates")',
            ]
            
            all_ids = set()
            for q in queries:
                s_res, msgs = mail.search(None, q)
                if s_res == "OK" and msgs[0]:
                    all_ids.update(msgs[0].split())
                    
            print(f"Folder '{folder}': found {len(all_ids)} messages matching 'share certificate'.")
            
            for mid in sorted(list(all_ids), key=lambda x: int(x), reverse=True)[:15]:
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
                
                # Check if NCR is mentioned in subject or body
                combined = (subj + " " + body).lower()
                if "ncr" in combined or "registration" in combined or "order" in combined:
                    print("-" * 60)
                    print(f"[{folder}] ID: {mid.decode()} | Date: {date_}")
                    print(f"From: {from_} | To: {to_} | Subj: {subj}")
                    if atts:
                        print(f"Attachments: {atts}")
                    print("Body snippet:")
                    print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:20]))
        except Exception as e:
            print(f"Error in folder {folder}: {e}")
            
    mail.logout()

search_account("winifred@myacc.co.za", "vcG%4&Qr,_W{W6M)")
search_account("kev@thinkestry.co.za", "7In~K;EF}?7E_7p4")
