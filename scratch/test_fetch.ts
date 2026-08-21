async function testUrl() {
  const url = 'https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10139%2Fgenerated_drafts%2FBEE_Sworn_Affidavit_EME_10139.pdf?alt=media&token=302e637667323366726b326e686d743273686f6968';
  const res = await fetch(url);
  console.log('Status:', res.status, res.statusText);
  console.log('Content-Type:', res.headers.get('content-type'));
  console.log('Content-Length:', res.headers.get('content-length'));
}

testUrl().catch(console.error);
