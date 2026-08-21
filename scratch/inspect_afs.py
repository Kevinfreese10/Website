import pypdf

reader = pypdf.PdfReader(r"c:\myacc\scratch\order_10102_docs\AFS_2025_signed.pdf")
print(f"AFS Pages: {len(reader.pages)}")
for i in range(min(5, len(reader.pages))):
    print(f"--- AFS PAGE {i+1} ---")
    print(reader.pages[i].extract_text())

