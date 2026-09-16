import { useCallback } from "react";
import { AuthSession } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useAudit } from "../contexts/AuditContext";
import { useUserProfile } from "./useUserProfile";

export interface UseAuthLifecycleActionsReturn {
  handleLoginSuccess: (session: AuthSession) => void;
  handleLogout: () => void;
  handleLockScreen: () => void;
  handleUnlockScreen: () => void;
  handleSessionUpdated: (updatedSession: AuthSession) => void;
}

/**
 * Custom hook encapsulating authentication lifecycle action handlers.
 * Extracted from App.tsx in Phase 34 Part 2. Preserves 100% of existing behavior.
 */
export function useAuthLifecycleActions(): UseAuthLifecycleActionsReturn {
  const { state: authState, actions: authActions } = useAuth();
  const { actions: auditActions } = useAudit();
  const { updateUserName } = useUserProfile();
  const authSession = authState.authSession;

  const handleLoginSuccess = useCallback(
    (session: AuthSession) => {
      authActions.login(session);
      updateUserName(session.user.fullName);
    },
    [authActions, updateUserName]
  );

  const handleLogout = useCallback(() => {
    if (authSession) {
      auditActions.triggerAuditLog(
        "LOGOUT",
        "SECURITY",
        authSession.user.id,
        authSession.user.fullName,
        `تسجيل خروج المستخدم ${authSession.user.fullName} من النظام`,
        `User ${authSession.user.fullName} logged out`
      );
    }
    authActions.logout();
  }, [authSession, auditActions, authActions]);

  const handleLockScreen = useCallback(() => {
    authActions.lockScreen();
  }, [authActions]);

  const handleUnlockScreen = useCallback(() => {
    authActions.unlockScreen();
  }, [authActions]);

  const handleSessionUpdated = useCallback(
    (updatedSession: AuthSession) => {
      authActions.updateSession(updatedSession);
    },
    [authActions]
  );

  return {
    handleLoginSuccess,
    handleLogout,
    handleLockScreen,
    handleUnlockScreen,
    handleSessionUpdated,
  };
}
