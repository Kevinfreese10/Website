import sys
import os

pdf_path = r"C:\Users\kev\OneDrive\Documents\CF-1B Form Application for Change of Nature of Business.pdf"

print(f"Checking if file exists at: {pdf_path}")
if not os.path.exists(pdf_path):
    print("File DOES NOT exist!")
    # Check what files exist in Documents
    doc_dir = r"C:\Users\kev\OneDrive\Documents"
    if os.path.exists(doc_dir):
        print(f"Files in {doc_dir}:")
        for f in os.listdir(doc_dir):
            if "CF" in f or "cf" in f or "pdf" in f.lower():
                print(" -", f)
else:
    print(f"File exists! Size: {os.path.getsize(pdf_path)} bytes")

