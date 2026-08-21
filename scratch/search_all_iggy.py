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

def main():
    mail = imaplib.IMAP4_SSL(HOST, PORT)
    mail.login(USER, PASS)
    
    addresses = ["iggy@maleha.co.za", "ignatious5480@gmail.com", "maleha.co.za"]
    
    for folder in ["INBOX.Sent", "INBOX"]:
        mail.select(f'"{folder}"')
        all_ids = set()
        for addr in addresses:
            for field in ['TO', 'CC', 'FROM', 'BODY']:
                s, msgs = mail.search(None, f'({field} "{addr}")')
                if s == "OK" and msgs[0]:
                    all_ids.update(msgs[0].split())
                    
        print(f"Folder '{folder}': found {len(all_ids)} messages for {addresses}")
        sorted_ids = sorted(list(all_ids), key=lambda x: int(x), reverse=True)
        
        for mid in sorted_ids:
            res, data = mail.fetch(mid, "(RFC822)")
            if not data or not isinstance(data[0], tuple):
                continue
            msg = email.message_from_bytes(data[0][1])
            subject = decode_str(msg.get("Subject", ""))
            from_ = decode_str(msg.get("From", ""))
            to_ = decode_str(msg.get("To", ""))
            cc_ = decode_str(msg.get("Cc", ""))
            date_ = decode_str(msg.get("Date", ""))
            body = get_body(msg)
            
            attachments = []
            for part in msg.walk():
                fn = part.get_filename()
                if fn:
                    attachments.append(decode_str(fn))
                    
            print("\n" + "="*70)
            print(f"[{folder}] ID: {mid.decode()}")
            print(f"Date:        {date_}")
            print(f"From:        {from_}")
            print(f"To:          {to_}")
            if cc_:
                print(f"Cc:          {cc_}")
            print(f"Subject:     {subject}")
            if attachments:
                print(f"Attachments: {attachments}")
            print("-" * 40)
            print("Body:")
            print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:25]))
            print("="*70)

    mail.logout()

if __name__ == "__main__":
    main()
