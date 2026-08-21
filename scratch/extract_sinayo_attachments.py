import imaplib
import email
from email.header import decode_header
import os
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

save_dir = r"c:\myacc\scratch\ncr_fabonacci_docs"
os.makedirs(save_dir, exist_ok=True)

mail = imaplib.IMAP4_SSL(HOST, PORT)
mail.login(USER, PASS)
mail.select('"INBOX"')

res, data = mail.fetch("13992", "(RFC822)")
if data and isinstance(data[0], tuple):
    msg = email.message_from_bytes(data[0][1])
    for part in msg.walk():
        fn = part.get_filename()
        if fn:
            fn_clean = decode_str(fn)
            file_data = part.get_payload(decode=True)
            out_path = os.path.join(save_dir, fn_clean)
            with open(out_path, "wb") as f:
                f.write(file_data)
            print(f"Saved attachment: {out_path} ({len(file_data)} bytes)")

mail.logout()
