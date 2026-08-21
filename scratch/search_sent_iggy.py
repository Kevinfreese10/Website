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
    
    mail.select('"INBOX.Sent"')
    status, msgs = mail.search(None, 'ALL')
    msg_ids = msgs[0].split()
    print(f"Total Sent messages: {len(msg_ids)}")
    
    matched = []
    for mid in msg_ids:
        res, data = mail.fetch(mid, "(BODY[HEADER.FIELDS (SUBJECT TO CC DATE)])")
        if not data or not isinstance(data[0], tuple):
            continue
        hdr = email.message_from_bytes(data[0][1])
        to_ = decode_str(hdr.get("To", "")).lower()
        cc_ = decode_str(hdr.get("Cc", "")).lower()
        subj = decode_str(hdr.get("Subject", "")).lower()
        
        if "iggy" in to_ or "iggy" in cc_ or "ignatious" in to_ or "ignatious" in cc_ or "maleha" in to_ or "maleha" in cc_ or "ignatious" in subj or "maswanganyi" in subj:
            matched.append(mid)
            
    print(f"Found {len(matched)} sent messages matching Iggy / Ignatious / Maleha:")
    for mid in matched:
        res, data = mail.fetch(mid, "(RFC822)")
        msg = email.message_from_bytes(data[0][1])
        subject = decode_str(msg.get("Subject", ""))
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
        print(f"Sent Message ID: {mid.decode()}")
        print(f"Date:        {date_}")
        print(f"To:          {to_}")
        if cc_:
            print(f"Cc:          {cc_}")
        print(f"Subject:     {subject}")
        if attachments:
            print(f"Attachments: {attachments}")
        print("Body snippet:")
        print("\n".join([l.strip() for l in body.splitlines() if l.strip()][:15]))
        print("="*70)

    mail.logout()

if __name__ == "__main__":
    main()
