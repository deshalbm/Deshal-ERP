import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { loadAuthSession } from "../utils/authManager";

export interface UseUserProfileReturn {
  userName: string;
  updateUserName: (newName: string) => void;
}

/**
 * Single authoritative User Profile & Session Presentation Custom Hook.
 * Manages user display name state, precedence, and localStorage persistence.
 *
 * Initialization Precedence:
 * 1. authSession.user.fullName (active auth session)
 * 2. localStorage.getItem("rv_user_name") (saved display name)
 * 3. "المستخدم" (default fallback)
 */
export function useUserProfile(): UseUserProfileReturn {
  const { state: authState, actions: authActions } = useAuth();
  const authSession = authState.authSession;
  const sessionFullName = authSession?.user?.fullName;

  const [userName, setUserNameState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const activeSession = authSession || loadAuthSession();
      if (activeSession?.user?.fullName) {
        return activeSession.user.fullName;
      }
      const savedName = localStorage.getItem("rv_user_name");
      if (savedName && savedName.trim()) {
        return savedName;
      }
      return "المستخدم";
    }
    return "المستخدم";
  });

  // Synchronize when active auth session full name updates or resolves
  useEffect(() => {
    if (sessionFullName && sessionFullName.trim() && sessionFullName !== userName) {
      setUserNameState(sessionFullName);
      if (typeof window !== "undefined") {
        localStorage.setItem("rv_user_name", sessionFullName);
      }
    }
  }, [sessionFullName]);

  const updateUserName = useCallback(
    (newName: string) => {
      const trimmed = (newName || "").trim() || "المستخدم";
      setUserNameState(trimmed);
      if (typeof window !== "undefined") {
        localStorage.setItem("rv_user_name", trimmed);
      }
      if (authSession) {
        authActions.updateSession({
          ...authSession,
          user: {
            ...authSession.user,
            fullName: trimmed
          }
        });
      }
    },
    [authSession, authActions]
  );

  return {
    userName,
    updateUserName
  };
}
