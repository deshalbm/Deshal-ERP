/**
 * DESHAL ERP — CRM STORAGE ENGINE (LEADS, OPPORTUNITIES & ACTIVITIES)
 * 
 * Provides local storage persistence and initial demo seed data for CRM leads,
 * sales opportunities (kanban pipeline), and sales activity logs.
 */

import { CRMLead, CRMOpportunity, CRMActivityRecord } from "../../types/crm";

const LEADS_STORAGE_KEY = "rv_crm_leads_v1";
const OPPORTUNITIES_STORAGE_KEY = "rv_crm_opportunities_v1";
const ACTIVITIES_STORAGE_KEY = "rv_crm_activities_v1";

// Default seed data for initial leads
export const INITIAL_SEED_LEADS: CRMLead[] = [];

// Default seed data for initial sales opportunities (Kanban Pipeline)
export const INITIAL_SEED_OPPORTUNITIES: CRMOpportunity[] = [];

// Default seed data for initial sales activity logs
export const INITIAL_SEED_ACTIVITIES: CRMActivityRecord[] = [];

/**
 * Load CRM leads from localStorage with fallback to seed data
 */
export function loadCRMLeads(): CRMLead[] {
  if (typeof window === "undefined") return INITIAL_SEED_LEADS;
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM leads from localStorage:", e);
  }
  return INITIAL_SEED_LEADS;
}

/**
 * Save CRM leads to localStorage
 */
export function saveCRMLeads(leads: CRMLead[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save CRM leads to localStorage:", e);
  }
}

/**
 * Load CRM opportunities from localStorage with fallback to seed data
 */
export function loadCRMOpportunities(): CRMOpportunity[] {
  if (typeof window === "undefined") return INITIAL_SEED_OPPORTUNITIES;
  try {
    const raw = localStorage.getItem(OPPORTUNITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM opportunities from localStorage:", e);
  }
  return INITIAL_SEED_OPPORTUNITIES;
}

/**
 * Save CRM opportunities to localStorage
 */
export function saveCRMOpportunities(opportunities: CRMOpportunity[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OPPORTUNITIES_STORAGE_KEY, JSON.stringify(opportunities));
  } catch (e) {
    console.error("Failed to save CRM opportunities to localStorage:", e);
  }
}

/**
 * Load CRM activity records from localStorage with fallback to seed data
 */
export function loadCRMActivities(): CRMActivityRecord[] {
  if (typeof window === "undefined") return INITIAL_SEED_ACTIVITIES;
  try {
    const raw = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse CRM activities from localStorage:", e);
  }
  return INITIAL_SEED_ACTIVITIES;
}

/**
 * Save CRM activity records to localStorage
 */
export function saveCRMActivities(activities: CRMActivityRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
  } catch (e) {
    console.error("Failed to save CRM activities to localStorage:", e);
  }
}
