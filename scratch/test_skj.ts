const tests = [
  "FNB APP PAYMENT TO K. LEEPILE JUNE SKJ PHYSIOTHERAPY",
  "FNB APP PAYMENT TO S. NAGAR OCT SKJ PHYSIOTHERAPY",
  "FNB APP PAYMENT TO J. SMITH SKJ PHYSIOTHERAPY"
];

for (const description of tests) {
    let str = description.toUpperCase();
    const skjMatch = str.match(/^FNB APP PAYMENT TO (.*?)\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANUARY|FEBRUARY|MARCH|APRIL|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)?\s*SKJ PHYSIOTHERAPY/i);
    if (skjMatch) {
         console.log(skjMatch[1].trim());
    } else {
         console.log("No match");
    }
}
