import urllib.request
import os

url = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FhCTT7dPOdbX3Y0ExvLWRwL6sujM2%2Forders%2F10138%2F1787237824919_0_DISCLOSR__014_.pdf?alt=media&token=be832cbc-c62c-458a-95b8-7bd964bc97ff"
out_dir = r"c:\myacc\scratch\order_10138_audit"
os.makedirs(out_dir, exist_ok=True)
pdf_path = os.path.join(out_dir, "COR14.3_Disclosure.pdf")

urllib.request.urlretrieve(url, pdf_path)
print(f"Downloaded PDF ({os.path.getsize(pdf_path)} bytes)")

try:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total Pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        print(f"--- PAGE {i+1} ---")
        print(page.extract_text())
except Exception as e:
    print("pypdf error:", e)
    try:
        import fitz # PyMuPDF
        doc = fitz.open(pdf_path)
        print(f"PyMuPDF Pages: {len(doc)}")
        for i, page in enumerate(doc):
            print(f"--- PAGE {i+1} ---")
            print(page.get_text())
    except Exception as e2:
        print("fitz error:", e2)
