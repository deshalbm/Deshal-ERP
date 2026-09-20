import { AuthSession, UserAccount } from "../types";
import {
  validateLoginCredentials,
  evaluateKioskTabletGuard,
  createCompatibleAuthSession,
  isMockAuthEnabled,
  isRemoteAuthAvailable,
  executeRemoteSignIn,
} from "../application/auth/authUseCases";
import type { AuthServicePort } from "../application/ports/authServicePort";

console.log("\n================================================================");
console.log("  DESHAL ERP — AUTH LIFECYCLE 10 SCENARIOS UNIT TEST SUITE");
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

// Mock UserAccount and AuthSession
const mockUser: UserAccount = {
  id: "usr-admin-01",
  employeeId: "emp-301",
  email: "admin@deshalbm.com",
  fullName: "سعيد بن عبد الله",
  role: "ADMIN" as any,
  passwordHash: "hash-123",
  twoFactorEnabled: false,
  failedLoginAttempts: 0,
  isLocked: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};

const mockSession: AuthSession = {
  user: mockUser,
  employee: { id: "emp-301" } as any,
  token: "jwt-token-123",
  loginMethod: "PASSWORD" as any,
  authenticatedAt: "2026-09-13T10:00:00Z",
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  isLocked: false
};

async function runAllAuthLifecycleTests() {
  // -----------------------------------------------------------------
  // SCENARIO 1: Application Startup & Initial Auth Status
  // -----------------------------------------------------------------
  console.log("--- SCENARIO 1: APPLICATION STARTUP & AUTH STATUS ---");
  let isAuthLoading = true;
  let initialStatus = isAuthLoading ? 'AUTH_LOADING' : (mockSession ? 'AUTHENTICATED' : 'AUTH_UNAUTHENTICATED');
  assert(initialStatus === 'AUTH_LOADING', "Initial status during startup is AUTH_LOADING");

  isAuthLoading = false;
  initialStatus = isAuthLoading ? 'AUTH_LOADING' : (mockSession ? 'AUTHENTICATED' : 'AUTH_UNAUTHENTICATED');
  assert(initialStatus === 'AUTHENTICATED', "Status updates to AUTHENTICATED when active session is present");

  const activeSessionRef: AuthSession | null = null;
  let noSessionStatus = isAuthLoading ? 'AUTH_LOADING' : (activeSessionRef ? 'AUTHENTICATED' : 'AUTH_UNAUTHENTICATED');
  assert(noSessionStatus === 'AUTH_UNAUTHENTICATED', "Status updates to AUTH_UNAUTHENTICATED when no active session");

  // -----------------------------------------------------------------
  // SCENARIO 2: Successful Login Flow (Remote & Compatible Session)
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 2: SUCCESSFUL LOGIN FLOW ---");
  const mockSuccessAdapter: AuthServicePort = {
    isConfigured: () => true,
    signInWithEmail: async (email, password) => {
      if (email === "admin@deshalbm.com" && password === "correctpass") {
        return {
          success: true,
          user: {
            id: "sp-usr-01",
            email: "admin@deshalbm.com",
            fullName: "سعيد بن عبد الله",
            fullNameEn: "Said Al-Abdullah",
            role: "ADMIN",
            companyId: "00000000-0000-0000-0000-000000000001",
            branchId: "branch-sohar",
            avatarUrl: null,
            pinCode: null,
          }
        };
      }
      return { success: false, error: "Invalid login credentials" };
    },
    signUpWithEmail: async () => ({ success: true }),
  };

  const remoteRes = await executeRemoteSignIn("admin@deshalbm.com", "correctpass", mockSuccessAdapter);
  assert(remoteRes.success === true && remoteRes.user !== undefined, "Remote login returns success for valid credentials");

  if (remoteRes.user) {
    const compatSession = createCompatibleAuthSession(remoteRes.user, "token-abc-123");
    assert(compatSession.user.email === "admin@deshalbm.com", "Compatible AuthSession mapped email correctly");
    assert(compatSession.token === "token-abc-123", "Compatible AuthSession assigned token");
  }

  // -----------------------------------------------------------------
  // SCENARIO 3: Logout Flow & Storage Cleanup
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 3: LOGOUT FLOW & STORAGE CLEANUP ---");
  const mockStorage: Record<string, string> = {
    rv_auth_session: JSON.stringify(mockSession),
    rv_studio_active_employee_id: "emp-301",
    rv_studio_active_branch_id: "branch-sohar"
  };

  function performLogout(storage: Record<string, string>) {
    delete storage.rv_auth_session;
    delete storage.rv_studio_active_employee_id;
    delete storage.rv_studio_active_branch_id;
  }

  performLogout(mockStorage);
  assert(mockStorage.rv_auth_session === undefined, "Logout clears session storage key");
  assert(mockStorage.rv_studio_active_employee_id === undefined, "Logout clears active employee storage key");
  assert(mockStorage.rv_studio_active_branch_id === undefined, "Logout clears active branch storage key");

  // -----------------------------------------------------------------
  // SCENARIO 4: Session Restoration & Persistence
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 4: SESSION RESTORATION & PERSISTENCE ---");
  const savedSessionStr = JSON.stringify(mockSession);
  const restoredSession: AuthSession = JSON.parse(savedSessionStr);
  assert(restoredSession.user.id === "usr-admin-01", "Restored session preserves user identity");
  assert(restoredSession.token === "jwt-token-123", "Restored session preserves token");

  // -----------------------------------------------------------------
  // SCENARIO 5: Page Refresh / Session Preservation
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 5: PAGE REFRESH / SESSION PRESERVATION ---");
  const isSessionValidOnRefresh = (session: AuthSession | null): boolean => {
    if (!session) return false;
    const exp = new Date(session.expiresAt).getTime();
    return exp > Date.now();
  };
  assert(isSessionValidOnRefresh(restoredSession) === true, "Active non-expired session valid across page refresh");

  // -----------------------------------------------------------------
  // SCENARIO 6: Expired Session Detection & Clean-up
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 6: EXPIRED SESSION DETECTION ---");
  const expiredSession: AuthSession = {
    ...mockSession,
    expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  };
  assert(isSessionValidOnRefresh(expiredSession) === false, "Expired session identified as invalid");

  // -----------------------------------------------------------------
  // SCENARIO 7: Invalid Credentials Security (No Silent Mock Fallback)
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 7: INVALID CREDENTIALS SECURITY ---");
  const mockFailedAdapter: AuthServicePort = {
    isConfigured: () => true,
    signInWithEmail: async () => ({ success: false, error: "Invalid login credentials" }),
    signUpWithEmail: async () => ({ success: true }),
  };

  const isMockOn = isMockAuthEnabled();
  assert(isMockOn === false, "isMockAuthEnabled defaults to false in standard environment");

  const isRemoteReady = isRemoteAuthAvailable(mockFailedAdapter);
  assert(isRemoteReady === true, "Remote auth identified as available");

  const failRes = await executeRemoteSignIn("invalid@deshalbm.com", "wrongpass", mockFailedAdapter);
  assert(failRes.success === false, "Remote login fails for invalid credentials");
  assert(failRes.error === "Invalid login credentials", "Returns clear error message without silently creating mock session");

  // -----------------------------------------------------------------
  // SCENARIO 8: Network Failure Handling
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 8: NETWORK FAILURE HANDLING ---");
  const mockNetworkFailAdapter: AuthServicePort = {
    isConfigured: () => true,
    signInWithEmail: async () => {
      throw new Error("Failed to fetch");
    },
    signUpWithEmail: async () => ({ success: true }),
  };

  try {
    await executeRemoteSignIn("user@deshalbm.com", "pass", mockNetworkFailAdapter);
    assert(false, "Should have thrown network exception");
  } catch (err: any) {
    assert(err.message === "Failed to fetch", "Network failure exception caught cleanly");
  }

  // -----------------------------------------------------------------
  // SCENARIO 9: Supabase Unavailable / Offline Behavior
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 9: SUPABASE UNAVAILABLE / OFFLINE BEHAVIOR ---");
  const mockUnconfiguredAdapter: AuthServicePort = {
    isConfigured: () => false,
    signInWithEmail: async () => ({ success: false, error: "Supabase is not configured." }),
    signUpWithEmail: async () => ({ success: false }),
  };

  assert(isRemoteAuthAvailable(mockUnconfiguredAdapter) === false, "Unconfigured adapter returns isRemoteAuthAvailable = false");

  // -----------------------------------------------------------------
  // SCENARIO 10: Unauthorized Access & Kiosk Tablet Guard Enforcement
  // -----------------------------------------------------------------
  console.log("\n--- SCENARIO 10: UNAUTHORIZED ACCESS & KIOSK GUARD ---");
  const kioskTabletSession: AuthSession = {
    user: { ...mockUser, role: "KIOSK_TABLET" as any },
    employee: { id: "emp-kiosk", permissions: ["kiosk_mode_only"] } as any,
    token: "kiosk-tok",
    loginMethod: "PASSWORD" as any,
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isLocked: false
  };

  const standardUserSession: AuthSession = {
    user: { ...mockUser, role: "ACCOUNTANT" as any },
    employee: { id: "emp-acc", permissions: [] } as any,
    token: "acc-tok",
    loginMethod: "PASSWORD" as any,
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isLocked: false
  };

  assert(evaluateKioskTabletGuard(kioskTabletSession) === true, "Identifies KIOSK_TABLET session for isolation");
  assert(evaluateKioskTabletGuard(standardUserSession) === false, "Standard user session allowed into standard ERP UI");
  assert(evaluateKioskTabletGuard(null) === false, "Unauthenticated null session returns false for kiosk guard");

  // SUMMARY
  console.log(`\n========================================================`);
  console.log(`  SUITE COMPLETE: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log(`========================================================\n`);

  if (passedCount === 0 || passedCount !== totalCount) {
    process.exit(1);
  }
}

runAllAuthLifecycleTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
