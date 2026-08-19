import crypto from "crypto";

/**
 * Secure PBKDF2 Password and PIN code hashing module for Kuettu Global POS.
 * Uses 100,000 iterations of SHA-512 with a cryptographically secure 16-byte random salt.
 */

const ITERATIONS = 100000;
const KEY_LEN = 64; // 512 bits
const DIGEST = "sha512";

/**
 * Hashes a plaintext PIN code or password.
 * Output format: pbkdf2:100000:<salt_hex>:<hash_hex>
 */
export function hashPinCode(pin: string): string {
  const cleanPin = String(pin || "").trim();
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(cleanPin, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `pbkdf2:${ITERATIONS}:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a PIN code against a stored hash (or plain text fallback for backward-compatibility).
 */
export function verifyPinCode(pin: string, storedHashOrPlain: string | null | undefined): boolean {
  if (!storedHashOrPlain || !pin) return false;

  const cleanPin = String(pin).trim();
  const cleanStored = String(storedHashOrPlain).trim();

  // If already in PBKDF2 hashed format
  if (cleanStored.startsWith("pbkdf2:")) {
    const parts = cleanStored.split(":");
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const expectedHash = parts[3];

    const actualKey = crypto.pbkdf2Sync(cleanPin, salt, iterations, KEY_LEN, DIGEST);
    const actualHash = actualKey.toString("hex");

    // Timing-safe comparison to prevent side-channel timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(actualHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  }

  // Backward compatibility fallback for pre-existing plain text PINs
  return cleanPin === cleanStored;
}
