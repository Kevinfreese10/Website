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

def main():
    mail = imaplib.IMAP4_SSL(HOST, PORT)
    mail.login(USER, PASS)
    
    # List folders
    status, folder_list = mail.list()
    
    folders_to_check = ["INBOX.Sent", "INBOX", "INBOX.Archive", "INBOX.Trash"]
    
    queries = [
        '(TO "iggy")',
        '(TO "ignatius")',
        '(CC "iggy")',
        '(SUBJECT "iggy")',
        '(SUBJECT "payslip")',
        '(SUBJECT "payslips")',
        '(BODY "iggy")',
        '(BODY "ignatius")',
    ]
    
    for folder in folders_to_check:
        try:
            status, count = mail.select(f'"{folder}"')
            if status != "OK":
                continue
            
            all_ids = set()
            for q in queries:
                s, messages = mail.search(None, q)
                if s == "OK" and messages[0]:
                    all_ids.update(messages[0].split())
                    
            print(f"\nFolder '{folder}': found {len(all_ids)} messages matching queries.")
            
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
                        
                combined = (subject + " " + to_ + " " + from_ + " " + body).lower()
                if "iggy" in combined or "ignatius" in combined or "payslip" in subject.lower():
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
                    print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:20]))
                    print("="*70)
        except Exception as e:
            print(f"Error checking folder {folder}: {e}")

    mail.logout()

if __name__ == "__main__":
    main()
