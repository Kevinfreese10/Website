'use client';

import React from 'react';

function isSafeUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  );
}

export function parseNoteTokens(text: string): Array<{ type: 'text' | 'link'; content: string; url?: string }> {
  if (!text) return [];

  // Match:
  // 1 & 2: HTML links: <a href="url">text</a>
  // 3 & 4: Markdown links: [text](url)
  // 5: Raw URLs: http(s)://... or www....
  // 6: Raw email addresses: user@domain.com
  const pattern =
    /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>|\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

  const tokens: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      // HTML link
      const rawHref = match[1].trim();
      const linkText = match[2].trim() || rawHref;
      const href = rawHref.startsWith('www.') ? `https://${rawHref}` : rawHref;
      tokens.push({ type: 'link', content: linkText, url: href });
    } else if (match[3] !== undefined) {
      // Markdown link [text](url)
      const linkText = match[3].trim();
      const rawHref = match[4].trim();
      const href = rawHref.startsWith('www.') ? `https://${rawHref}` : rawHref;
      tokens.push({ type: 'link', content: linkText, url: href });
    } else if (match[5] !== undefined) {
      // Raw URL
      let rawUrl = match[5].trim();
      let trailing = '';
      const punctMatch = rawUrl.match(/[.,;!?)]+$/);
      if (punctMatch) {
        trailing = punctMatch[0];
        rawUrl = rawUrl.substring(0, rawUrl.length - trailing.length);
      }
      const href = rawUrl.startsWith('www.') ? `https://${rawUrl}` : rawUrl;
      tokens.push({ type: 'link', content: rawUrl, url: href });
      if (trailing) {
        tokens.push({ type: 'text', content: trailing });
      }
    } else if (match[6] !== undefined) {
      // Raw email
      let email = match[6].trim();
      let trailing = '';
      const punctMatch = email.match(/[.,;!?)]+$/);
      if (punctMatch) {
        trailing = punctMatch[0];
        email = email.substring(0, email.length - trailing.length);
      }
      tokens.push({ type: 'link', content: email, url: `mailto:${email}` });
      if (trailing) {
        tokens.push({ type: 'text', content: trailing });
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return tokens;
}

interface FormattedNoteTextProps {
  text?: string | null;
  className?: string;
  linkClassName?: string;
  as?: 'p' | 'span' | 'div';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function FormattedNoteText({
  text,
  className = 'whitespace-pre-wrap break-words leading-relaxed',
  linkClassName = 'text-primary underline hover:opacity-80 font-medium inline-flex items-center gap-0.5 break-all transition-colors',
  as = 'p',
  prefix,
  suffix,
}: FormattedNoteTextProps) {
  if (!text) return null;

  const tokens = parseNoteTokens(text);
  const Component = as;

  return (
    <Component className={className}>
      {prefix}
      {tokens.map((token, idx) => {
        if (token.type === 'link' && token.url && isSafeUrl(token.url)) {
          return (
            <a
              key={idx}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={linkClassName}
            >
              {token.content}
            </a>
          );
        }
        return <React.Fragment key={idx}>{token.content}</React.Fragment>;
      })}
      {suffix}
    </Component>
  );
}
