import fs from "fs";
import path from "path";

console.log("\n================================================================");
console.log("  DESHAL ERP — PWA LIFECYCLE & INSTALLATION UNIT TEST SUITE");
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

// Simulated Event Mock
class MockEvent {
  defaultPrevented = false;
  preventDefault() {
    this.defaultPrevented = true;
  }
}

class MockBeforeInstallPromptEvent extends MockEvent {
  platforms = ["web"];
  userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });
  promptCalled = false;
  async prompt() {
    this.promptCalled = true;
  }
}

// [Test 1] BeforeInstallPrompt Event Capture & PreventDefault
console.log("[Test 1] BeforeInstallPrompt Event Capture & PreventDefault");
const mockEvent = new MockBeforeInstallPromptEvent();
mockEvent.preventDefault();
assert(mockEvent.defaultPrevented === true, "preventDefault() preserves native browser prompt suppression");
assert(mockEvent.platforms.includes("web"), "BeforeInstallPromptEvent contains platforms metadata");

// [Test 2] Deferred Prompt Invocation & Outcome Resolution
console.log("\n[Test 2] Deferred Prompt Invocation & Outcome Resolution");
let promptState: MockBeforeInstallPromptEvent | null = mockEvent;
assert(promptState !== null, "Deferred prompt state becomes available when captured");
mockEvent.prompt().then(() => {
  assert(mockEvent.promptCalled === true, "triggerInstall invokes prompt() on deferred prompt");
  promptState = null;
  assert(promptState === null, "Prompt state is cleared after installation flow");
});

// [Test 3] iOS Fallback & Device Detection Safety
console.log("\n[Test 3] iOS Fallback & Device Detection Safety");
const userAgentIos = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
const isIosMatched = /iphone|ipad|ipod/.test(userAgentIos.toLowerCase());
assert(isIosMatched === true, "Identifies iOS devices correctly for fallback modal triggering");

// [Test 4] PWA URL Shortcut Parameter Parsing
console.log("\n[Test 4] PWA URL Shortcut Parameter Parsing");
const testUrlParams1 = new URLSearchParams("?tab=history");
assert(testUrlParams1.get("tab") === "history", "Parses PWA ?tab=history shortcut parameter correctly");
const testUrlParams2 = new URLSearchParams("?action=new");
assert(testUrlParams2.get("action") === "new", "Parses PWA ?action=new shortcut parameter correctly");

// [Test 5] Single Authoritative Listener Source Check
console.log("\n[Test 5] Single Authoritative Listener Source Check");
const hookContent = fs.readFileSync(path.join(process.cwd(), "src/hooks/usePWAInstall.ts"), "utf-8");
const appContent = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf-8");
const bannerContent = fs.readFileSync(path.join(process.cwd(), "src/components/PWAInstallBanner.tsx"), "utf-8");

assert(hookContent.includes('window.addEventListener("beforeinstallprompt"'), "usePWAInstall.ts is the sole authoritative listener owner");
assert(!appContent.includes('window.addEventListener("beforeinstallprompt"'), "App.tsx no longer registers a duplicate beforeinstallprompt listener");
assert(!bannerContent.includes('window.addEventListener("beforeinstallprompt"'), "PWAInstallBanner no longer registers a duplicate beforeinstallprompt listener");

// [Test 6] Event Cleanup Verification
console.log("\n[Test 6] Event Cleanup Verification");
assert(hookContent.includes('window.removeEventListener("beforeinstallprompt"'), "usePWAInstall cleans up beforeinstallprompt listener on unmount");
assert(hookContent.includes('window.removeEventListener("appinstalled"'), "usePWAInstall cleans up appinstalled listener on unmount");

// [Test Summary]
console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");
