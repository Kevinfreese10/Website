import imaplib
import email
from email.header import decode_header
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Check Kev's mailbox
HOST = "mail.myacc.co.za"
PORT = 993
USER = "kev@thinkestry.co.za"
PASS = "7In~K;EF}?7E_7p4"

try:
    mail = imaplib.IMAP4_SSL(HOST, PORT)
    mail.login(USER, PASS)
    status, folders = mail.list()
    print("SUCCESS: Logged in to kev@thinkestry.co.za successfully!")
    print("\nMailbox Folders for kev@thinkestry.co.za:")
    for f in folders:
        print(" -", f.decode())
        
    mail.select('"INBOX"')
    status, msgs = mail.search(None, 'ALL')
    all_ids = msgs[0].split()
    print(f"\nTotal messages in INBOX: {len(all_ids)}")
    
    # Show 5 latest messages
    latest_5 = all_ids[-5:] if len(all_ids) >= 5 else all_ids
    print("\n5 Most Recent Emails:")
    for mid in reversed(latest_5):
        res, data = mail.fetch(mid, "(BODY[HEADER.FIELDS (SUBJECT FROM DATE)])")
        if data and isinstance(data[0], tuple):
            hdr = email.message_from_bytes(data[0][1])
            subj = hdr.get("Subject", "(no subject)")
            from_ = hdr.get("From", "(unknown)")
            date_ = hdr.get("Date", "(unknown)")
            print(f" • [{date_}] From: {from_} | Subject: {subj}")
            
    mail.logout()
except Exception as e:
    print(f"ERROR logging into kev@thinkestry.co.za: {e}")

