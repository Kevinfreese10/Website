import pypdf

# Check if there are other POAs in scratch or inspect JJ Hydraulic POA
for path in [
    r"c:\myacc\scratch\order_10102_docs\Letter_to_COIDA_signed.pdf"
]:
    try:
        r = pypdf.PdfReader(path)
        print(f"File {path}: {len(r.pages)} pages")
        print(r.pages[0].extract_text())
    except Exception as e:
        print(f"Error {path}: {e}")

