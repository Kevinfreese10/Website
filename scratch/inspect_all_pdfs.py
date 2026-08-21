import pypdf
import os

def extract_pdf_info(filepath):
    print("="*60)
    print(f"FILE: {filepath}")
    reader = pypdf.PdfReader(filepath)
    print(f"Pages: {len(reader.pages)}")
    
    # Check form fields if any
    fields = reader.get_fields()
    if fields:
        print(f"AcroForm Fields found ({len(fields)}):")
        for k, v in fields.items():
            print(f"  {k}: {v.get('/V', 'EMPTY')}")
    else:
        print("No interactive AcroForm fields found (flat PDF).")
        
    for i, p in enumerate(reader.pages):
        print(f"\n--- PAGE {i+1} TEXT ---")
        text = p.extract_text()
        print(text[:2000] if text else "[NO TEXT / SCANNED]")

# Inspect CF-1B template
extract_pdf_info(r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf")

# Inspect downloaded docs
for f in ["COR14.3.pdf", "Letter_to_COIDA_signed.pdf", "Proof_of_address.pdf", "Letterhead.pdf"]:
    extract_pdf_info(os.path.join(r"c:\myacc\scratch\order_10102_docs", f))

