async function testFetch() {
  try {
    const res = await fetch('http://localhost:9003/api/templates/preview?id=ncr_form_2');
    console.log('Status:', res.status, res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));
    if (!res.ok) {
      const text = await res.text();
      console.log('Body:', text.slice(0, 300));
    } else {
      const buf = await res.arrayBuffer();
      console.log('Success! Received PDF bytes:', buf.byteLength);
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

testFetch();
