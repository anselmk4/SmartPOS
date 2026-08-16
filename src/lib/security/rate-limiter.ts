/**
 * In-Memory sliding-window Rate Limiter for Next.js API Routes.
 * Protects against brute-force and DDoS attacks on authentication and webhook endpoints.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  isBlockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetAt && (!record.isBlockedUntil || now > record.isBlockedUntil)) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number; // Max requests allowed in window
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // Duration to block if limit is exceeded (e.g. 15 mins)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
  message?: string;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60 * 1000, blockDurationMs: 15 * 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Check if currently temporarily blocked
  if (record?.isBlockedUntil && now < record.isBlockedUntil) {
    const remainingBlockSec = Math.ceil((record.isBlockedUntil - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetInSeconds: remainingBlockSec,
      message: `Trop de tentatives échouées. Accès temporairement suspendu pour des raisons de sécurité. Réessayez dans ${remainingBlockSec} secondes.`,
    };
  }

  // If record does not exist or window expired, initialize new window
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  // Window is active, increment counter
  record.count += 1;

  if (record.count > options.limit) {
    const blockDuration = options.blockDurationMs || 15 * 60 * 1000;
    record.isBlockedUntil = now + blockDuration;
    const remainingBlockSec = Math.ceil(blockDuration / 1000);
    return {
      success: false,
      remaining: 0,
      resetInSeconds: remainingBlockSec,
      message: `Limite de tentatives dépassée. Accès temporairement bloqué pendant ${Math.ceil(remainingBlockSec / 60)} minutes.`,
    };
  }

  return {
    success: true,
    remaining: options.limit - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
