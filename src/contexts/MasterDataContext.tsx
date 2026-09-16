import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Branch, CompanySettings, DesignTheme, RecurringSchedule } from '../types';
import {
  loadBranches,
  saveBranches,
  loadCompanySettings,
  saveCompanySettings,
  loadDesignTheme,
  saveDesignTheme,
  loadRecurringSchedules,
  saveRecurringSchedules,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_DESIGN_THEME
} from '../utils/storage';
import * as companySvc from '../lib/supabase/companyService';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { useERPData } from './ERPDataContext';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const ACTIVE_BRANCH_STORAGE_KEY = 'rv_studio_active_branch_id';

export interface MasterDataContextState {
  branches: Branch[];
  activeBranchId: string;
  schedules: RecurringSchedule[];
  companySettings: CompanySettings;
  designTheme: DesignTheme;
}

export interface MasterDataContextActions {
  saveBranches: (branches: Branch[]) => void;
  saveActiveBranchId: (id: string) => void;
  saveSchedules: (schedules: RecurringSchedule[]) => void;
  saveCompanySettings: (settings: CompanySettings) => void;
  saveDesignTheme: (theme: DesignTheme) => void;
  resetDefaults: () => void;
  setBranchesList: (branches: Branch[]) => void;
  setActiveBranchId: (id: string) => void;
  setSchedulesList: (schedules: RecurringSchedule[]) => void;
  setCompanySettingsState: (settings: CompanySettings) => void;
  setDesignThemeState: (theme: DesignTheme) => void;
}

export interface MasterDataContextValue {
  state: MasterDataContextState;
  actions: MasterDataContextActions;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

export interface MasterDataProviderProps {
  children: React.ReactNode;
  initialBranches?: Branch[];
  initialActiveBranchId?: string;
  initialSchedules?: RecurringSchedule[];
  initialCompanySettings?: CompanySettings;
  initialDesignTheme?: DesignTheme;
}

export const MasterDataProvider: React.FC<MasterDataProviderProps> = ({
  children,
  initialBranches,
  initialActiveBranchId,
  initialSchedules,
  initialCompanySettings,
  initialDesignTheme
}) => {
  const erpData = useERPData();

  const [branches, setBranches] = useState<Branch[]>(() => {
    if (initialBranches) return initialBranches;
    if (erpData?.branchesList && erpData.branchesList.length > 0) {
      return erpData.branchesList;
    }
    return loadBranches();
  });

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    if (initialActiveBranchId) return initialActiveBranchId;
    try {
      const stored = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
      if (stored) return stored;
    } catch (e) {
      console.warn("Failed to load active branch ID from localStorage", e);
    }
    const b = initialBranches || (erpData?.branchesList?.length ? erpData.branchesList : loadBranches());
    return b.length > 0 ? b[0].id : 'branch-sohar';
  });

  const [schedules, setSchedules] = useState<RecurringSchedule[]>(() => {
    if (initialSchedules) return initialSchedules;
    if (erpData?.schedulesList && erpData.schedulesList.length > 0) {
      return erpData.schedulesList;
    }
    return loadRecurringSchedules();
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    if (initialCompanySettings) return initialCompanySettings;
    if (erpData?.companySettings) {
      return erpData.companySettings;
    }
    return loadCompanySettings();
  });

  const [designTheme, setDesignTheme] = useState<DesignTheme>(() => {
    if (initialDesignTheme) return initialDesignTheme;
    return loadDesignTheme();
  });

  // Sync to ERPDataContext (One-Way Bridge: MasterDataContext -> ERPDataContext)
  useEffect(() => {
    if (erpData?.setBranchesList) erpData.setBranchesList(branches);
  }, [branches, erpData]);

  useEffect(() => {
    if (erpData?.setSchedulesList) erpData.setSchedulesList(schedules);
  }, [schedules, erpData]);

  useEffect(() => {
    if (erpData?.setCompanySettings) erpData.setCompanySettings(companySettings);
  }, [companySettings, erpData]);

  const handleSaveBranches = useCallback((newBranches: Branch[]) => {
    setBranches(newBranches);
    saveBranches(newBranches);
    const cId = erpData?.companyId || DEFAULT_COMPANY_ID;
    if (isSupabaseConfigured) {
      Promise.all(newBranches.map((b) => companySvc.upsertBranch(b, cId))).catch(console.error);
    }
  }, [erpData?.companyId]);

  const handleSaveActiveBranchId = useCallback((id: string) => {
    setActiveBranchIdState(id);
    try {
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, id);
    } catch (e) {
      console.error("Failed to save active branch ID to localStorage", e);
    }
  }, []);

  const handleSaveSchedules = useCallback((newSchedules: RecurringSchedule[]) => {
    setSchedules(newSchedules);
    saveRecurringSchedules(newSchedules);
  }, []);

  const handleSaveCompanySettings = useCallback((newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    saveCompanySettings(newSettings);
  }, []);

  const handleSaveDesignTheme = useCallback((newTheme: DesignTheme) => {
    setDesignTheme(newTheme);
    saveDesignTheme(newTheme);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setCompanySettings(DEFAULT_COMPANY_SETTINGS);
    saveCompanySettings(DEFAULT_COMPANY_SETTINGS);
    setDesignTheme(DEFAULT_DESIGN_THEME);
    saveDesignTheme(DEFAULT_DESIGN_THEME);
  }, []);

  const value: MasterDataContextValue = {
    state: {
      branches,
      activeBranchId,
      schedules,
      companySettings,
      designTheme
    },
    actions: {
      saveBranches: handleSaveBranches,
      saveActiveBranchId: handleSaveActiveBranchId,
      saveSchedules: handleSaveSchedules,
      saveCompanySettings: handleSaveCompanySettings,
      saveDesignTheme: handleSaveDesignTheme,
      resetDefaults: handleResetDefaults,
      setBranchesList: setBranches,
      setActiveBranchId: setActiveBranchIdState,
      setSchedulesList: setSchedules,
      setCompanySettingsState: setCompanySettings,
      setDesignThemeState: setDesignTheme
    }
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
};

export const useMasterData = (): MasterDataContextValue => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};
