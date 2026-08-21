import imaplib
import email
from email.header import decode_header
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

save_dir = r"c:\myacc\scratch\ncr_draft_examples"
os.makedirs(save_dir, exist_ok=True)

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

mail = imaplib.IMAP4_SSL("169.239.218.67", 993)
mail.login("winifred@myacc.co.za", "vcG%4&Qr,_W{W6M)")
mail.select('"INBOX.Sent"')

# We know sent message 5652 (NEDCASH) and 5678 (MOOLA HUB) and 5637 (ALTAIR NEXUS) have these attachments
targets = ["5678", "5652", "5637"]

extracted = {}

for mid in targets:
    res, data = mail.fetch(mid, "(RFC822)")
    if not data or not isinstance(data[0], tuple):
        continue
    msg = email.message_from_bytes(data[0][1])
    subj = decode_str(msg.get("Subject", ""))
    print(f"Checking Msg {mid}: {subj}")
    
    for part in msg.walk():
        fn = part.get_filename()
        if fn:
            fn_clean = decode_str(fn)
            fn_lower = fn_clean.lower()
            if any(k in fn_lower for k in ["share", "resolution", "annex"]):
                out_name = f"{mid}_{fn_clean}"
                out_path = os.path.join(save_dir, out_name)
                payload = part.get_payload(decode=True)
                with open(out_path, "wb") as f:
                    f.write(payload)
                print(f"  -> Saved {out_name} ({len(payload)} bytes)")
                extracted[fn_clean] = out_path

mail.logout()
print("\nExtracted files summary:", list(extracted.keys()))
