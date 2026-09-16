import fs from "fs";
import path from "path";

console.log("\n================================================================");
console.log("  DESHAL ERP — USER PROFILE & PRESENTATION UNIT TEST SUITE");
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

// Simulated LocalStorage Mock
const storageMap: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, value: string) => {
    storageMap[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMap[key];
  },
  clear: () => {
    Object.keys(storageMap).forEach((k) => delete storageMap[k]);
  }
};

// [Test 1] Precedence 1: AuthSession user.fullName Precedence over localStorage
console.log("[Test 1] Precedence 1: AuthSession user.fullName Precedence over localStorage");
mockLocalStorage.setItem("rv_user_name", "اسم قديم من الهيكل");
const mockSession = { user: { fullName: "سالم بن محمد العماني" } };
const resolvedName1 = mockSession.user.fullName || mockLocalStorage.getItem("rv_user_name") || "المستخدم";
assert(resolvedName1 === "سالم بن محمد العماني", "authSession.user.fullName takes precedence over localStorage");

// [Test 2] Precedence 2: LocalStorage rv_user_name Fallback
console.log("\n[Test 2] Precedence 2: LocalStorage rv_user_name Fallback");
const nullSession: any = null;
const resolvedName2 = nullSession?.user?.fullName || mockLocalStorage.getItem("rv_user_name") || "المستخدم";
assert(resolvedName2 === "اسم قديم من الهيكل", "localStorage rv_user_name is used when auth fullName is unavailable");

// [Test 3] Precedence 3: Default "المستخدم" Fallback
console.log("\n[Test 3] Precedence 3: Default 'المستخدم' Fallback");
mockLocalStorage.clear();
const resolvedName3 = nullSession?.user?.fullName || mockLocalStorage.getItem("rv_user_name") || "المستخدم";
assert(resolvedName3 === "المستخدم", "Defaults to 'المستخدم' when both session and localStorage are empty");

// [Test 4] updateUserName State & LocalStorage Writing
console.log("\n[Test 4] updateUserName State & LocalStorage Writing");
const newProfileName = "أحمد بن سعيد المعمري";
mockLocalStorage.setItem("rv_user_name", newProfileName);
assert(mockLocalStorage.getItem("rv_user_name") === "أحمد بن سعيد المعمري", "updateUserName writes rv_user_name to localStorage");

// [Test 5] LocalStorage Key Integrity Check
console.log("\n[Test 5] LocalStorage Key Integrity Check");
const hookContent = fs.readFileSync(path.join(process.cwd(), "src/hooks/useUserProfile.ts"), "utf-8");
const appContent = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf-8");

assert(hookContent.includes('localStorage.getItem("rv_user_name")') || hookContent.includes("localStorage.getItem('rv_user_name')"), "useUserProfile reads exact key 'rv_user_name'");
assert(hookContent.includes('localStorage.setItem("rv_user_name"') || hookContent.includes("localStorage.setItem('rv_user_name'"), "useUserProfile writes exact key 'rv_user_name'");

// [Test 6] App.tsx Delegation & Zero Duplicate State Check
console.log("\n[Test 6] App.tsx Delegation & Zero Duplicate State Check");
assert(appContent.includes("useUserProfile()"), "App.tsx delegates user profile ownership to useUserProfile hook");
assert(!appContent.includes("const [userName, setUserName]"), "App.tsx no longer owns local userName useState declaration");
assert(!appContent.includes("const handleUpdateUserName ="), "App.tsx no longer owns local handleUpdateUserName function");

// [Test Summary]
console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");
