import {
  sha256Hex,
  simpleSha256Fallback,
  generateSalt,
  hashPin,
  verifyMasterExitPin,
  setDeviceSecretPin,
  verifyDeviceSecretPin,
  checkLockoutStatus,
  calculateNextLockout,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  MASTER_KIOSK_PIN_HASH
} from "../domain/kiosk/kioskSecurity";

import {
  sha256Hex as UTILS_sha256Hex,
  generateSalt as UTILS_generateSalt,
  hashPin as UTILS_hashPin,
  verifyMasterExitPin as UTILS_verifyMasterExitPin,
  MAX_FAILED_ATTEMPTS as UTILS_MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS as UTILS_LOCKOUT_DURATION_MS
} from "../utils/kioskSecurity";

import { KioskDevice } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — KIOSK SECURITY DOMAIN UNIT TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  // TEST 1: SHA-256 Hash Calculation Invariants
  console.log("--- TEST 1: SHA-256 HASH CALCULATION INVARIANTS ---");
  const fallbackDigest = simpleSha256Fallback("test_string");
  const asyncDigest = await sha256Hex("test_string");
  assert(
    typeof fallbackDigest === "string" && fallbackDigest.length === 64,
    "simpleSha256Fallback generates 64-character hex string"
  );
  assert(
    fallbackDigest === asyncDigest,
    "sha256Hex matches simpleSha256Fallback synchronously/asynchronously"
  );

  // TEST 2: Salt Generation
  console.log("\n--- TEST 2: SALT GENERATION ---");
  const salt1 = generateSalt(16);
  const salt2 = generateSalt(16);
  assert(salt1.length === 16, "generateSalt(16) produces 16-character salt");
  assert(salt1 !== salt2, "generateSalt produces distinct random salts");

  // TEST 3: Salted PIN Hashing
  console.log("\n--- TEST 3: SALTED PIN HASHING ---");
  const hash1 = await hashPin("1234", salt1);
  const hash2 = await hashPin("1234", salt1);
  const hashDifferentPin = await hashPin("5678", salt1);
  assert(
    typeof hash1 === "string" && hash1.length === 64,
    "hashPin produces 64-character SHA-256 digest"
  );
  assert(hash1 === hash2, "hashPin is deterministic for same PIN and salt");
  assert(hash1 !== hashDifferentPin, "hashPin produces different hash for different PIN");

  // TEST 4: Master Exit PIN Verification
  console.log("\n--- TEST 4: MASTER EXIT PIN VERIFICATION ---");
  const isMaster9900 = await verifyMasterExitPin("9900");
  const isMaster1234 = await verifyMasterExitPin("1234");
  const isWrongPin = await verifyMasterExitPin("0000");
  assert(isMaster9900 === true, "verifyMasterExitPin accepts master PIN '9900'");
  assert(isMaster1234 === true, "verifyMasterExitPin accepts master PIN '1234'");
  assert(isWrongPin === false, "verifyMasterExitPin rejects incorrect PIN '0000'");

  // TEST 5: Device Secret PIN Management & Validation
  console.log("\n--- TEST 5: DEVICE SECRET PIN MANAGEMENT & VALIDATION ---");
  const dummyDevice: KioskDevice = {
    id: "kiosk-dev-1",
    deviceCode: "KD-001",
    name: "Reception Kiosk",
    branchId: "branch-1",
    branchName: "Main Branch",
    location: "Reception",
    username: "kiosk1",
    deviceToken: "token-123",
    status: "ACTIVE",
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const defaultPinCheck = await verifyDeviceSecretPin(dummyDevice, "1234");
  assert(defaultPinCheck === true, "Default device without secret PIN accepts fallback master PIN '1234'");

  const updatedDevice = await setDeviceSecretPin(dummyDevice, "7788");
  assert(
    typeof updatedDevice.devicePinHash === "string" && updatedDevice.devicePinSalt !== undefined,
    "setDeviceSecretPin attaches devicePinHash and devicePinSalt"
  );

  const validCustomPin = await verifyDeviceSecretPin(updatedDevice, "7788");
  const invalidCustomPin = await verifyDeviceSecretPin(updatedDevice, "1234");
  assert(validCustomPin === true, "verifyDeviceSecretPin accepts correct custom device PIN '7788'");
  assert(invalidCustomPin === false, "verifyDeviceSecretPin rejects incorrect device PIN");

  // TEST 6: Lockout Status & Rate-Limiting Calculations
  console.log("\n--- TEST 6: LOCKOUT STATUS & RATE-LIMITING CALCULATIONS ---");
  const now = Date.now();
  const unlocked = checkLockoutStatus(0, now);
  assert(unlocked.isLocked === false && unlocked.remainingSeconds === 0, "checkLockoutStatus returns un-locked for 0 timestamp");

  const lockedFuture = checkLockoutStatus(now + 30000, now);
  assert(
    lockedFuture.isLocked === true && lockedFuture.remainingSeconds === 30,
    "checkLockoutStatus returns isLocked: true and 30s remaining for future timestamp (+30s)"
  );

  const step1 = calculateNextLockout(0, now);
  assert(step1.newFailedAttempts === 1 && step1.lockoutUntil === 0, "First failed attempt increments count to 1 without lockout");

  const step5 = calculateNextLockout(4, now);
  assert(
    step5.newFailedAttempts === 5 && step5.lockoutUntil === now + LOCKOUT_DURATION_MS,
    "5th failed attempt triggers lockout timestamp (+60s)"
  );

  // TEST 7: Re-export Reference & Invariant Compatibility
  console.log("\n--- TEST 7: RE-EXPORT REFERENCE & INVARIANT COMPATIBILITY ---");
  assert(
    sha256Hex === UTILS_sha256Hex,
    "sha256Hex re-exported from utils/kioskSecurity references exact domain function"
  );
  assert(
    generateSalt === UTILS_generateSalt,
    "generateSalt re-exported from utils/kioskSecurity references exact domain function"
  );
  assert(
    hashPin === UTILS_hashPin,
    "hashPin re-exported from utils/kioskSecurity references exact domain function"
  );
  assert(
    verifyMasterExitPin === UTILS_verifyMasterExitPin,
    "verifyMasterExitPin re-exported from utils/kioskSecurity references exact domain function"
  );
  assert(
    MAX_FAILED_ATTEMPTS === UTILS_MAX_FAILED_ATTEMPTS && MAX_FAILED_ATTEMPTS === 5,
    "MAX_FAILED_ATTEMPTS invariant (5) preserved"
  );
  assert(
    LOCKOUT_DURATION_MS === UTILS_LOCKOUT_DURATION_MS && LOCKOUT_DURATION_MS === 60000,
    "LOCKOUT_DURATION_MS invariant (60,000ms) preserved"
  );

  console.log(`\n==============================================================`);
  console.log(`  RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log(`==============================================================\n`);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exitCode = 1;
});
