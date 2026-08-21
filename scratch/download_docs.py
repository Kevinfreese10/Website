import urllib.request
import json
import os
import sys

# URL list from order 10102
urls = {
    "COR14.3.pdf": "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10102%2F1785836401673-COR14.3.pdf?alt=media&token=5236e231-9d7d-418d-9cc9-c53f3663dac4",
    "Proof_of_address.pdf": "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10102%2F1785836571610-Proof%20of%20address%20-%20Rent%20invoice.pdf?alt=media&token=50b1470a-d9d2-4e44-91db-32e98439b8e0",
    "Letter_to_COIDA_signed.pdf": "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/uploads%2FD7pYKNKUbkUudXlpBpkWAtvkx5E2%2Forders%2F10102%2Fnotes%2F1786950893488-Letter%20to%20COIDA_signed.pdf?alt=media&token=3fe9be05-fa03-4faa-84ae-cd6b202f4d0c",
    "Letterhead.pdf": "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10102%2F1785838123152-Letterhead.pdf?alt=media&token=fe119d20-b681-4950-8f63-ac74894edc5d",
    "AFS_2025_signed.pdf": "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10102%2F1785838169145-Super_Valet_Paarl__Pty__Ltd_Financial_Statements_2025_signed.pdf?alt=media&token=cc84e4c8-dbb3-4870-80ad-b690b54a4187"
}

out_dir = r"c:\myacc\scratch\order_10102_docs"
os.makedirs(out_dir, exist_ok=True)

for name, url in urls.items():
    dest = os.path.join(out_dir, name)
    print(f"Downloading {name}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"Saved {name} ({os.path.getsize(dest)} bytes)")
    except Exception as e:
        print(f"Error downloading {name}: {e}")

