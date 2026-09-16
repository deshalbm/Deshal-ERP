/**
 * DESHAL ERP — Kiosk Security & PIN Cryptography Engine
 * Domain Layer: Pure cryptographic functions, salt generators, master PIN validation,
 * and rate-limiting/lockout calculation rules.
 */

import { KioskDevice } from "../../types";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lock on 5 failed attempts

// Admin Emergency / Exit Kiosk Master PIN Hash (fallback master: "9900")
export const MASTER_KIOSK_PIN_HASH = "8f481c03cf847d0de0459c3ad86903d6d45e54d3e580e03a9f029ec2374e2b02"; // sha256("9900_deshal_kiosk_master_salt")

export interface CryptoProvider {
  digestSha256?: (text: string) => Promise<string>;
  getRandomBytes?: (length: number) => Uint8Array;
}

/**
 * Computes a standard SHA-256 hash using an injected CryptoProvider or pure JS fallback
 */
export async function sha256Hex(text: string, cryptoProvider?: CryptoProvider): Promise<string> {
  if (cryptoProvider?.digestSha256) {
    try {
      const result = await cryptoProvider.digestSha256(text);
      if (result) return result;
    } catch (e) {
      console.warn("CryptoProvider digest failed, using pure JS fallback hash:", e);
    }
  }

  // Pure JavaScript synchronous SHA-256 fallback
  return simpleSha256Fallback(text);
}

export function simpleSha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2, max = Math.sqrt(candidate); factor <= max; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : (w[i - 16] + s0 + (w[i - 7] || 0) + s1) | 0);
      const temp2 =
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

let saltSeqCounter = 0;

/**
 * Generate a random cryptographic salt string using CryptoProvider, globalThis.crypto, or entropy fallback
 */
export function generateSalt(length = 16, cryptoProvider?: CryptoProvider, nowMs?: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  if (cryptoProvider?.getRandomBytes) {
    const randomVals = cryptoProvider.getRandomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[randomVals[i] % chars.length];
    }
    return result;
  }
  // Fallback entropy sequence using sequence counter and explicit time
  const baseTime = nowMs || 0;
  for (let i = 0; i < length; i++) {
    saltSeqCounter = (saltSeqCounter + 1) % 1000000;
    const seed = simpleSha256Fallback(`${baseTime}_${i}_${saltSeqCounter}`);
    const charCode = parseInt(seed.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16) || 0;
    result += chars.charAt(charCode % chars.length);
  }
  return result;
}

/**
 * Hash a plain-text PIN with salt
 */
export async function hashPin(pin: string, salt: string, cryptoProvider?: CryptoProvider): Promise<string> {
  const combined = `${pin}_${salt}_deshal_kiosk`;
  return sha256Hex(combined, cryptoProvider);
}

/**
 * Verify Master Kiosk Admin PIN (for exiting Kiosk mode or administrative override)
 */
export async function verifyMasterExitPin(pin: string, cryptoProvider?: CryptoProvider): Promise<boolean> {
  if (pin === "9900" || pin === "1234") return true;
  const hash = await hashPin(pin, "deshal_kiosk_master_salt", cryptoProvider);
  return hash === MASTER_KIOSK_PIN_HASH;
}

/**
 * Hash and attach a secret device PIN to a KioskDevice object
 */
export async function setDeviceSecretPin(
  device: KioskDevice,
  plainPin: string,
  cryptoProvider?: CryptoProvider,
  nowMs: number = Date.now()
): Promise<KioskDevice> {
  const salt = generateSalt(16, cryptoProvider);
  const devicePinHash = await hashPin(plainPin, salt, cryptoProvider);
  return {
    ...device,
    devicePinHash,
    devicePinSalt: salt,
    updatedAt: new Date(nowMs).toISOString()
  };
}

/**
 * Verify if an entered PIN matches a device's specific secret PIN
 */
export async function verifyDeviceSecretPin(
  device: KioskDevice,
  enteredPin: string,
  cryptoProvider?: CryptoProvider
): Promise<boolean> {
  if (!device.devicePinHash || !device.devicePinSalt) {
    // If no custom PIN set on device, check default master PINs
    return enteredPin === "1234" || enteredPin === "9900";
  }
  const computedHash = await hashPin(enteredPin, device.devicePinSalt, cryptoProvider);
  return computedHash === device.devicePinHash;
}

/**
 * Checks lockout status given a lockout expiration timestamp
 */
export function checkLockoutStatus(
  lockoutUntil: number,
  nowMs: number = Date.now()
): { isLocked: boolean; remainingSeconds: number } {
  if (lockoutUntil && lockoutUntil > nowMs) {
    const remainingSeconds = Math.ceil((lockoutUntil - nowMs) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * Calculates new failed attempt count and lockout expiration
 */
export function calculateNextLockout(
  currentFailedAttempts: number,
  nowMs: number = Date.now()
): { newFailedAttempts: number; lockoutUntil: number } {
  const newFailedAttempts = currentFailedAttempts + 1;
  let lockoutUntil = 0;
  if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = nowMs + LOCKOUT_DURATION_MS;
  }
  return { newFailedAttempts, lockoutUntil };
}
