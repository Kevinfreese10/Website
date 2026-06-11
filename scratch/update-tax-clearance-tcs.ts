import { getAdminDb } from '../src/lib/firebase-admin';

async function main() {
  const db = getAdminDb();
  const docId = 'TcoAGJ4BtWKMP9Vn4NTA';
  
  console.log(`Updating Tax Clearance service page document "${docId}" in Firestore...`);
  
  const updateData = {
    title: "Tax Clearance Certificate & TCS PIN",
    description: "Obtain your official Tax Clearance Certificate and TCS PIN from SARS quickly and efficiently through our expert service.",
    longDescription: "A Tax Clearance Certificate (TCC) - now officially issued as a digital Tax Compliance Status (TCS) PIN by SARS - is a crucial document confirming your tax compliance. This service is essential for individuals, businesses, and trusts in South Africa who need to tender for contracts, emigrate, apply for foreign investment allowances, or engage in other transactions requiring proof of good tax standing. We streamline the eFiling application process, ensure your tax affairs are fully in order, and retrieve your active TCS PIN without unnecessary delays, allowing you to proceed with your important plans confidently.",
    whatsIncluded: [
      "Comprehensive review of your tax compliance status across all tax types",
      "Preparation and submission of the Tax Compliance Status (TCS) application via SARS eFiling",
      "Proactive follow-up with SARS to expedite processing",
      "Secure delivery of your active SARS TCS PIN and official status document",
      "Expert advice on resolving any non-compliance blocks and maintaining good standing"
    ],
    clientRequirements: [
      "SARS eFiling login details (username and password)",
      "Proof of identity (for individuals) or company registration documents (for businesses)",
      "Reason for requiring the Tax Clearance Certificate (e.g., tender, emigration, good standing)",
      "Any outstanding financial statements or tax returns required for compliance (if applicable)",
      "Signed power of attorney allowing My Accountant to query and manage your TCS PIN status"
    ],
    metaKeywords: [
      "Tax Clearance Certificate",
      "SARS TCS PIN",
      "Tax Clearance Pin",
      "Tax Compliance SA",
      "Tax Certificate Application",
      "SARS eFiling"
    ]
  };

  const docRef = db.collection('services').doc(docId);
  await docRef.update(updateData);
  
  console.log("Tax Clearance Certificate service page document updated successfully!");
  
  // Verify the update
  const updatedDoc = await docRef.get();
  const data = updatedDoc.data();
  console.log("Verified Title:", data?.title);
  console.log("Verified Slug:", data?.slug);
}

main().catch(err => {
  console.error("Error executing database update script:", err);
});
