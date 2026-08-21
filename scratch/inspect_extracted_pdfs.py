import pymupdf

for fn in ["NATIONAL CREDIT REGULATOR_INVCP005313(1).pdf", "Proof of payment Fabonacci Trades.pdf"]:
    path = f"c:\\myacc\\scratch\\ncr_fabonacci_docs\\{fn}"
    doc = pymupdf.open(path)
    print(f"=== {fn} ===")
    for p in doc:
        print(p.get_text())
    doc.close()

