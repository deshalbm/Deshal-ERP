/**
 * Application navigation resolver for Quick Create action routing.
 * Maps action strings (e.g. "receipt", "journal-entry", "crm", "spaces")
 * to target navigation tab names.
 * 
 * Extracted from App.tsx in Phase 32. Preserves 100% of existing behavior.
 */
export function resolveQuickCreateTab(actionId: string): string {
  const act = (actionId || "").toLowerCase().trim();
  switch (act) {
    case "receipt":
    case "tax-invoice":
    case "tax_invoice":
    case "payment":
    case "quotation":
    case "petty-cash":
    case "petty_cash":
      return "editor";
    case "journal-entry":
    case "journal_entry":
      return "accounting";
    case "customer":
    case "crm":
      return "crm";
    case "supplier":
    case "purchases":
      return "purchases";
    case "inventory-item":
    case "inventory":
      return "inventory";
    case "employee":
    case "employees":
      return "employees";
    case "space-booking":
    case "spaces":
      return "spaces";
    default:
      return "home";
  }
}
