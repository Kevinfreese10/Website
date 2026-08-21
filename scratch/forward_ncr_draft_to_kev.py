import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SMTP_HOST = "mail.myacc.co.za"
SMTP_PORT = 465
SMTP_USER = "winifred@myacc.co.za"
SMTP_PASS = "vcG%4&Qr,_W{W6M)"

TO_EMAIL = "kev@thinkestry.co.za"
SUBJECT = "FW: Proof of Payment & Renewal Certificate: FABONACCI TRADES (PTY) LTD - NCRCP21645 | INVCP005313"

body_html = """
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">
    <p>Hi Kevin,</p>
    <p>Please find below the drafted renewal follow-up for <strong>FABONACCI TRADES (PTY) LTD</strong> along with the attached NCR Invoice and Client Proof of Payment.</p>
    <hr style="border: none; border-top: 1px solid #cccccc; margin: 20px 0;" />
    
    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0284c7; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0;"><strong>Proposed NCR Recipients:</strong></p>
        <p style="margin: 0;"><strong>To:</strong> fees@ncr.org.za, txhati@ncr.org.za, dndaba@ncr.org.za<br>
        <strong>Cc:</strong> emoleko@ncr.org.za, sinayoholland26@gmail.com, kev@thinkestry.co.za</p>
    </div>

    <p>Good day NCR Renewals Team,</p>

    <p><strong>RE: ANNUAL REGISTRATION RENEWAL &amp; CERTIFICATE REQUEST</strong><br>
    &bull; <strong>Registrant Name:</strong> FABONACCI TRADES (PTY) LTD<br>
    &bull; <strong>NCR Registration Number:</strong> NCRCP21645<br>
    &bull; <strong>Renewal Invoice Number:</strong> INVCP005313<br>
    &bull; <strong>Director Contact:</strong> Sinayo Holland (076 670 7349 | sinayoholland26@gmail.com)</p>

    <p>Please find attached the renewal invoice (INVCP005313) along with the proof of payment of R1,250.00 paid on 24 July 2026 using reference <strong>NCRCP21645</strong>.</p>

    <p>Kindly confirm allocation of the renewal fee and issue the renewed 2026/2027 NCR Registration Certificate.</p>

    <p>Please also ensure the certificate and all future correspondence are sent directly to the director at <a href="mailto:sinayoholland26@gmail.com">sinayoholland26@gmail.com</a> (cc: <a href="mailto:winifred@myacc.co.za">winifred@myacc.co.za</a>).</p>

    <p>Thank you for your assistance.</p>

    <p>Kind regards,</p>
    <p>
        <strong>Winifred Beukes</strong><br>
        Executive Assistant to Kevin Freese | My Accountant<br>
        <strong>Landline:</strong> 010 109 1625<br>
        <strong>Email:</strong> winifred@myacc.co.za<br>
        <strong>Website:</strong> <a href="https://www.myacc.co.za/">www.myacc.co.za</a>
    </p>
</body>
</html>
"""

msg = MIMEMultipart()
msg['From'] = f"Winifred Beukes <{SMTP_USER}>"
msg['To'] = TO_EMAIL
msg['Subject'] = SUBJECT

msg.attach(MIMEText(body_html, 'html'))

# Attachments
att_files = [
    r"c:\myacc\scratch\ncr_fabonacci_docs\NATIONAL CREDIT REGULATOR_INVCP005313(1).pdf",
    r"c:\myacc\scratch\ncr_fabonacci_docs\Proof of payment Fabonacci Trades.pdf"
]

for file_path in att_files:
    if os.path.exists(file_path):
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            part = MIMEApplication(f.read(), Name=filename)
            part['Content-Disposition'] = f'attachment; filename="{filename}"'
            msg.attach(part)
            print(f"Attached: {filename}")
    else:
        print(f"Warning: File not found {file_path}")

try:
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
    print(f"SUCCESS: Forwarded email with attachments to {TO_EMAIL}")
except Exception as e:
    print(f"ERROR: Failed to send email: {e}")

