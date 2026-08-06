import { headers } from 'next/headers';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

/**
 * Basic in-memory rate limiter for Server Actions / Edge routes.
 * Limits requests based on caller IP and key prefix.
 */
export async function checkRateLimit(prefix: string, maxRequests: number = 10, windowMs: number = 60000): Promise<{ success: boolean; remaining: number }> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown-ip');
    
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    if (!memoryStore[key] || memoryStore[key].resetTime < now) {
      memoryStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return { success: true, remaining: maxRequests - 1 };
    }

    if (memoryStore[key].count >= maxRequests) {
      return { success: false, remaining: 0 };
    }

    memoryStore[key].count += 1;
    return { success: true, remaining: maxRequests - memoryStore[key].count };
  } catch (error) {
    // If headers() throws or cannot be accessed, allow request safely
    console.error("Rate limiter check error:", error);
    return { success: true, remaining: 1 };
  }
}
