import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthSession } from '../types';
import {
  loadAuthSession,
  saveAuthSession,
  clearAuthSession
} from '../utils/authManager';
import { saveActiveEmployeeId } from '../utils/storage';
import {
  SupabaseAuthUser,
  onAuthStateChange,
  signOut as supabaseSignOut
} from '../lib/supabase/authService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { evaluateKioskTabletGuard, createCompatibleAuthSession } from '../application/auth/authUseCases';
import { useERPData } from './ERPDataContext';
import { TenantProvider } from './TenantContext';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export interface AuthContextState {
  authSession: AuthSession | null;
  supabaseAuthUser: SupabaseAuthUser | null;
  supabaseSession: Session | null;
  companyId: string;
  isAuthLoading: boolean;
  isKioskTabletUser: boolean;
  isSecurityModalOpen: boolean;
  isSupabaseReady: boolean;
}

export interface AuthContextActions {
  login: (session: AuthSession) => void;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: () => void;
  updateSession: (session: AuthSession) => void;
  openSecurityModal: () => void;
  closeSecurityModal: () => void;
  setAuthSession: (session: AuthSession | null) => void;
  setSupabaseAuthUser: (user: SupabaseAuthUser | null) => void;
}

export interface AuthContextValue {
  state: AuthContextState;
  actions: AuthContextActions;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: AuthSession | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialSession }) => {
  const erpData = useERPData();

  const [authSession, setAuthSessionState] = useState<AuthSession | null>(() => {
    if (initialSession !== undefined) return initialSession;
    return loadAuthSession();
  });

  const [supabaseAuthUser, setSupabaseAuthUserState] = useState<SupabaseAuthUser | null>(null);
  const [supabaseSession, setSupabaseSessionState] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(!isSupabaseConfigured);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const companyId = useMemo(() => {
    return supabaseAuthUser?.companyId || authSession?.user?.id || DEFAULT_COMPANY_ID;
  }, [supabaseAuthUser, authSession]);

  const isKioskTabletUser = useMemo(() => {
    return evaluateKioskTabletGuard(authSession);
  }, [authSession]);

  // Sync to ERPDataContext (One-Way Bridge: AuthContext -> ERPDataContext)
  useEffect(() => {
    const rawErp = erpData as any;
    if (rawErp?.setAuthUser) rawErp.setAuthUser(supabaseAuthUser);
    if (rawErp?.setAuthSession) rawErp.setAuthSession(supabaseSession);
    if (rawErp?.setCompanyId) rawErp.setCompanyId(companyId);
  }, [supabaseAuthUser, supabaseSession, companyId, erpData]);

  // Supabase Auth Listener (Single Subscription)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsSupabaseReady(true);
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange((user, session) => {
      setSupabaseAuthUserState(user);
      setSupabaseSessionState(session);
      setIsSupabaseReady(true);
      setIsAuthLoading(false);

      if (user && !authSession) {
        const compatSession = createCompatibleAuthSession(user);
        setAuthSessionState(compatSession);
        saveAuthSession(compatSession);
      }
    });

    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = useCallback((session: AuthSession) => {
    setAuthSessionState(session);
    saveAuthSession(session);
    saveActiveEmployeeId(session.user.employeeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rv_user_name', session.user.fullName);
    }
    if (session.employee?.branchId && typeof localStorage !== 'undefined') {
      localStorage.setItem('rv_studio_active_branch_id', session.employee.branchId);
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (isSupabaseConfigured) {
      supabaseSignOut().catch(console.error);
    }
    clearAuthSession();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rv_studio_active_employee_id');
      localStorage.removeItem('rv_studio_active_branch_id');
    }
    setAuthSessionState(null);
    setSupabaseAuthUserState(null);
    setSupabaseSessionState(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const handleLockScreen = useCallback(() => {
    if (!authSession) return;
    const lockedSession: AuthSession = { ...authSession, isLocked: true };
    setAuthSessionState(lockedSession);
    saveAuthSession(lockedSession);
  }, [authSession]);

  const handleUnlockScreen = useCallback(() => {
    if (!authSession) return;
    const unlockedSession: AuthSession = { ...authSession, isLocked: false };
    setAuthSessionState(unlockedSession);
    saveAuthSession(unlockedSession);
  }, [authSession]);

  const handleUpdateSession = useCallback((session: AuthSession) => {
    setAuthSessionState(session);
    saveAuthSession(session);
    if (session.employee?.branchId && typeof localStorage !== 'undefined') {
      localStorage.setItem('rv_studio_active_branch_id', session.employee.branchId);
    }
  }, []);

  const handleOpenSecurityModal = useCallback(() => {
    setIsSecurityModalOpen(true);
  }, []);

  const handleCloseSecurityModal = useCallback(() => {
    setIsSecurityModalOpen(false);
  }, []);

  const value: AuthContextValue = {
    state: {
      authSession,
      supabaseAuthUser,
      supabaseSession,
      companyId,
      isAuthLoading,
      isKioskTabletUser,
      isSecurityModalOpen,
      isSupabaseReady
    },
    actions: {
      login: handleLogin,
      logout: handleLogout,
      lockScreen: handleLockScreen,
      unlockScreen: handleUnlockScreen,
      updateSession: handleUpdateSession,
      openSecurityModal: handleOpenSecurityModal,
      closeSecurityModal: handleCloseSecurityModal,
      setAuthSession: setAuthSessionState,
      setSupabaseAuthUser: setSupabaseAuthUserState
    }
  };

  return (
    <AuthContext.Provider value={value}>
      <TenantProvider>
        {children}
      </TenantProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
