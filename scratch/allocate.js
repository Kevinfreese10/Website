const HISTORICAL_MAPPINGS = {
  // Rent Paid
  "oriel plumber brentwood": "3000-038",
  "rent": "3000-038",
  "brentwood": "3000-038",
  
  // Staff Welfare
  "haji muhammad": "3000-049",
  "gym": "3000-049",
  "staff welfare": "3000-049",
  "medical costs": "3000-049",
  "t mphela staff suppo": "3000-049",
  
  // Salaries & Wages
  "helper": "3000-040",
  "staff costs": "3000-040",
  "salary": "3000-040",
  "shop manager": "3000-040",
  "staff": "3000-040",
  
  // Shareholder Loan Account (Drawings/Repayments)
  "investec account": "9000-001",
  "credit card": "9000-001",
  "barbershop kopano": "9000-001",
  "absa credit card": "9000-001",
  "absa card pmt": "9000-001",
  "matapa kopano": "9000-001",
  "cash for eft": "9000-001",
  "birthday": "9000-001",
  
  // Subscriptions
  "subscriptions 036008": "3000-008",
  "salonbridge": "3000-008",
  "subscription": "3000-008",
  
  // Advertising & Promotions
  "client gifts kopano pens": "3000-001",
  "sponsorship": "3000-001",
  "peter cele": "3000-001",
  "signage": "3000-001",
  "arch design": "3000-001",
  
  // Computer Expenses
  "thuni systems": "3000-006",
  "studio web": "3000-006",
  "design fees": "3000-006",
  
  // Furniture & Fittings - At Cost
  "salon furniture": "5000-013",
  
  // Consumables
  "groceries": "3000-007",
  "supply": "3000-007",
  "supplies": "3000-007",
  "shop essentials": "3000-007",
  "drinks shop": "3000-007",
  "hair products": "3000-007",
  "food": "3000-007",
  
  // Repairs & Maintenance
  "repairs": "3000-039",
  "garden services": "3000-039",
  "pool services": "3000-039",
  "equipment repairs": "3000-039",
  "glam and glow wall p": "3000-039",
  "carpentry renor": "3000-039",
  "roof material": "3000-039",
  "plumbers": "3000-039",
  
  // Barber Commission Expenses
  "guy tshiane barber": "3000-060",
  "vusi boxing": "3000-060",
  "lehumo": "3000-060",
  "banyatsi kopi": "3000-060",
  "lts kopax": "3000-060",
  
  // Legal Fees
  "cipc": "3000-029",
  "ens attorneys": "3000-029",
  
  // Levies
  "unit 335 levies": "3000-030",
  
  // Medical Aid Contributions
  "medical aid": "3000-046",
  
  // Software Licenses / SaaS
  "workstream": "3000-031",
  
  // Travel & Accommodation
  "driver kopano": "3000-052",
  "accom eddie makhomo": "3000-052",
  "shuttle": "3000-052",
  "transport": "3000-052",
  
  // Consulting Fees
  "project mngmnt fees": "3000-009",
  "thato intellidex": "3000-009",
  
  // Entertainment Expenses
  "client dinner": "3000-020",
  "client lunch": "3000-020",
  "client meeting": "3000-020",
  "client event": "3000-020",
  "family lunch": "3000-020",
  "jack d": "3000-020",
  "jordan venter": "3000-020",
  "year end functio": "3000-020",
  
  // Staff Uniforms
  "uniform": "3000-053",
  
  // Bank Charges
  "charges": "3000-004",
  "bank charges": "3000-004",
  "service fees": "3000-004",
  "monthly account fee": "3000-004"
};

function classifyDescription(desc) {
  const clean = desc.toLowerCase().trim();
  
  // Check exact matches or substring matches in order of specificity
  // We sort keywords by length descending so longer/more specific phrases match first
  const keys = Object.keys(HISTORICAL_MAPPINGS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (clean.includes(key)) {
      return HISTORICAL_MAPPINGS[key];
    }
  }
  return null;
}

async function allocatePage() {
  const rows = Array.from(document.querySelectorAll('table tbody tr'));
  console.log(`Found ${rows.length} rows on the page.`);
  
  let allocatedCount = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) continue;
    
    // Cell 2 is description
    const descCell = cells[2];
    const desc = descCell ? descCell.innerText.trim() : "";
    if (!desc) continue;
    
    // Check if already allocated (cell 4 combobox text is not "Select account...")
    const combobox = cells[4].querySelector('[role="combobox"]');
    if (!combobox) continue;
    
    const currentAllocation = combobox.innerText.trim();
    if (currentAllocation !== "Select account...") {
      console.log(`Row ${i} is already allocated to: ${currentAllocation}. Skipping.`);
      continue;
    }
    
    const targetCode = classifyDescription(desc);
    if (!targetCode) {
      console.warn(`No mapping found for description: "${desc}"`);
      continue;
    }
    
    console.log(`Row ${i} matching: "${desc}" -> code: ${targetCode}`);
    
    // Click the combobox to open
    combobox.click();
    await new Promise(r => setTimeout(r, 200));
    
    // Find search input
    const input = document.querySelector('[cmdk-input=""], input[placeholder*="Search"]');
    if (!input) {
      console.error("Could not find search input in popover!");
      document.body.click(); // close popover
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
    
    // Type the code
    input.value = targetCode;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    
    // Find option containing code
    const options = Array.from(document.querySelectorAll('[cmdk-item=""], [role="option"]'));
    const targetOption = options.find(opt => {
      const val = (opt.getAttribute('data-value') || opt.textContent || "").toLowerCase();
      return val.includes(targetCode.toLowerCase());
    });
    
    if (targetOption) {
      targetOption.click();
      allocatedCount++;
      console.log(`Successfully selected option for: "${desc}"`);
    } else {
      console.error(`Could not find option containing code: "${targetCode}"`);
      document.body.click(); // close popover
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`Allocated ${allocatedCount} rows on this page. Clicking Save Allocations...`);
  
  if (allocatedCount > 0) {
    // Find Save Allocations button
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.innerText.includes("Save Allocations"));
    if (saveBtn) {
      saveBtn.click();
      console.log("Clicked Save Allocations button.");
      await new Promise(r => setTimeout(r, 3000)); // wait for save to complete
      return { success: true, count: allocatedCount };
    } else {
      console.error("Could not find Save Allocations button!");
      return { success: false, error: "Save button not found" };
    }
  }
  
  return { success: true, count: 0 };
}

allocatePage();
