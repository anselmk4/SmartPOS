import crypto from "crypto";

/**
 * Retrieves the JWT signing secret.
 * Requires a cryptographically strong environment variable in production.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Security Critical] La variable d'environnement JWT_SECRET est obligatoire en environnement de production."
      );
    }
    return "kuettu_globalpos_secure_dev_salt_key_2026_x7a9";
  }
  return secret;
}

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
  phone?: string;
  storeId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates a signed JWT session token (HS256) valid for 30 days
 */
export function createSessionToken(payload: SessionPayload): string {
  const secret = getJwtSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 30 * 24 * 60 * 60; // 30 days

  const fullPayload = { ...payload, iat, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed JWT session token and returns the payload, or null if invalid/expired.
 * Uses timing-safe cryptographic comparison.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getJwtSecret();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return null;
    }

    const payloadText = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(payloadText);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
