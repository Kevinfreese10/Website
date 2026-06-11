// Offline test for order and email extraction logic
const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
const orderIdRegex = /\b(9\d{3}|\d{5})\b/;

interface Message {
  role: 'user' | 'bot';
  content: string;
}

function extractDetails(question: string, history: Message[]) {
  const userMessages = [
    ...history.filter(h => h.role === 'user').map(h => h.content),
    question
  ];

  let extractedOrderId: string | null = null;
  let extractedEmail: string | null = null;

  // Extract email address (scan backwards)
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const match = userMessages[i].match(emailRegex);
    if (match) {
      extractedEmail = match[1].toLowerCase().trim();
      break;
    }
  }

  // Extract order ID (scan backwards, matching 4-digit numbers starting with 9, or any 5-digit number)
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const match = userMessages[i].match(orderIdRegex);
    if (match) {
      extractedOrderId = match[1];
      break;
    }
  }

  return { extractedOrderId, extractedEmail };
}

// Run test cases
const testCases = [
  {
    name: "Scenario 1: No details provided",
    question: "Can I get an update on my order status?",
    history: []
  },
  {
    name: "Scenario 2: Only order number provided",
    question: "My order is 9954",
    history: [
      { role: 'user', content: "Can I get an update on my order status?" },
      { role: 'bot', content: "Please provide your order number and email." }
    ]
  },
  {
    name: "Scenario 3: Correct email provided after order number",
    question: "My email is user@example.com",
    history: [
      { role: 'user', content: "My order is 9954" },
      { role: 'bot', content: "Thanks. Please provide your email." }
    ]
  },
  {
    name: "Scenario 4: User corrects email (backwards scan verify)",
    question: "Oh sorry, my email is actual@domain.com",
    history: [
      { role: 'user', content: "My order is 9954" },
      { role: 'user', content: "My email is wrong@domain.com" },
      { role: 'bot', content: "Verification failed. Contact support." }
    ]
  },
  {
    name: "Scenario 5: User queries another order (9955 instead of 9954)",
    question: "Can you check order 9955 instead?",
    history: [
      { role: 'user', content: "My order is 9954" },
      { role: 'user', content: "My email is user@example.com" },
      { role: 'bot', content: "Order 9954 details..." }
    ]
  },
  {
    name: "Scenario 6: Ignore phone numbers and zip codes",
    question: "My phone number is 010 109 1625 and zip is 2195",
    history: []
  },
  {
    name: "Scenario 7: Future 5-digit order numbers",
    question: "Track order 12345",
    history: []
  }
];

console.log("=== RUNNING OFFLINE EXTRACTION TESTS ===");
for (const tc of testCases) {
  const result = extractDetails(tc.question, tc.history);
  console.log(`\n[${tc.name}]`);
  console.log(`Input question: "${tc.question}"`);
  console.log(`Extracted Order ID:`, result.extractedOrderId);
  console.log(`Extracted Email:`, result.extractedEmail);
}
