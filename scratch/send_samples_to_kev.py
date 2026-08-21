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
SUBJECT = "Examples of NCR Drafting: Share Certificates, Resolutions & Annexures"

body_html = """
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">
    <p>Hi Kevin,</p>
    <p>As requested, please find attached examples of previous drafted documents prepared for NCR registration applications (from recent submissions for <strong>MOOLA HUB</strong> and <strong>NEDCASH</strong>):</p>
    
    <ol style="margin-bottom: 20px;">
        <li style="margin-bottom: 8px;"><strong>Share Certificate Drafting:</strong>
            <ul>
                <li><code>Example - Share Certificate (MOOLA HUB).pdf</code></li>
                <li><code>Example - Share Certificate (NEDCASH).pdf</code></li>
            </ul>
        </li>
        <li style="margin-bottom: 8px;"><strong>Director Resolution Drafting:</strong>
            <ul>
                <li><code>Example - Director Resolution (MOOLA HUB).pdf</code></li>
                <li><code>Example - Director Resolution (NEDCASH).pdf</code></li>
            </ul>
        </li>
        <li style="margin-bottom: 8px;"><strong>Annexure Drafting (Confirmation of Payment of Fees):</strong>
            <ul>
                <li><code>Example - Annexure Confirmation of Fees (MOOLA HUB).pdf</code></li>
                <li><code>Example - Annexure Confirmation of Fees (NEDCASH).pdf</code></li>
            </ul>
        </li>
    </ol>

    <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0284c7; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #475569;">
            <strong>Note on Standard Practice:</strong> These 3 documents (along with the Power of Attorney and pre-filled NCR Form 2) form our standard drafted pack that Winifred prepares for clients to sign as part of the R1,400 NCR registration service.
        </p>
    </div>

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

attachments = [
    (r"c:\myacc\scratch\ncr_draft_examples\5678_Share certificate.pdf", "Example - Share Certificate (MOOLA HUB).pdf"),
    (r"c:\myacc\scratch\ncr_draft_examples\5678_Resolution.pdf", "Example - Director Resolution (MOOLA HUB).pdf"),
    (r"c:\myacc\scratch\ncr_draft_examples\5678_Annex.pdf", "Example - Annexure Confirmation of Fees (MOOLA HUB).pdf"),
    (r"c:\myacc\scratch\ncr_draft_examples\5652_Share certificate.pdf", "Example - Share Certificate (NEDCASH).pdf"),
    (r"c:\myacc\scratch\ncr_draft_examples\5652_Resolution.pdf", "Example - Director Resolution (NEDCASH).pdf"),
    (r"c:\myacc\scratch\ncr_draft_examples\5652_Annexure.pdf", "Example - Annexure Confirmation of Fees (NEDCASH).pdf"),
]

for src_path, display_name in attachments:
    if os.path.exists(src_path):
        with open(src_path, "rb") as f:
            part = MIMEApplication(f.read(), Name=display_name)
            part['Content-Disposition'] = f'attachment; filename="{display_name}"'
            msg.attach(part)
            print(f"Attached: {display_name}")

try:
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
    print(f"\nSUCCESS: Emailed all 6 sample documents to {TO_EMAIL}")
except Exception as e:
    print(f"\nERROR: Failed to send email: {e}")

