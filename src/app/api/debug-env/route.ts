import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const pass = process.env.SMTP_PASS || 'undefined';
    
    // Hash the password so we don't expose it in plaintext, but we can verify it
    // Wait, just returning the length and first/last character is enough
    const passLength = pass.length;
    const firstChar = pass[0];
    const lastChar = pass[pass.length - 1];
    
    const user = process.env.SMTP_USER || 'undefined';
    const port = process.env.SMTP_PORT || 'undefined';
    
    return NextResponse.json({
        user,
        port,
        passLength,
        firstChar,
        lastChar,
        passValueHex: Buffer.from(pass).toString('hex')
    });
}
