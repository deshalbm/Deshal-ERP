# Deshal ERP — LocalStorage Key Schema & Specification

## 1. Executive Summary & Namespace Conventions

Deshal ERP uses browser `localStorage` as its client-side persistence and cache layer. All keys strictly follow one of two prefix conventions:
- **`deshal_*`**: Modern standardized namespace used for new ERP modules, HR attendance/kiosk, workspace configurations, work requests, document storage, and CRM domain features.
- **`rv_studio_*` / `rv_*`**: Legacy namespace preserved for 100% backward compatibility across POS, financial vouchers, inventory, rental spaces, and auth settings.

To protect system stability and data integrity, fallback definitions and default initializers exist across all storage utilities (`src/utils/storage/*.ts`, `src/utils/authManager.ts`, `src/utils/kioskSecurity.ts`, etc.).

---

## 2. Complete Key Inventory by Domain Module

### 2.1 Authentication & Security
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_auth_users` | `AuthAccount[]` (JSON) | `[]` | Persisted user account credentials, hashed passwords, roles, and status. |
| `rv_auth_active_session` | `AuthSession` (JSON) | `null` | Current active user session token, payload, and expiration timestamp. |
| `rv_auth_magic_links` | `MagicLinkToken[]` (JSON) | `[]` | Active and expired magic link login tokens (max 30 items). |
| `rv_auth_reset_tokens` | `PasswordResetToken[]` (JSON) | `[]` | Active password reset tokens (max 30 items). |
| `rv_auth_device_sessions` | `AuthSession[]` (JSON) | `[]` | List of active device sessions per user account. |
| `rv_user_name` | `string` | `null` | Display name cache for active logged-in employee/user. |
| `deshal_kiosk_employee_pins_v1` | `KioskPinRecord[]` (JSON) | `[]` | PBKDF2/SHA-256 hashed employee kiosk PIN credentials. |
| `deshal_kiosk_failed_attempts_v1` | `KioskAttemptRecord` (JSON) | `{ attempts: 0, lockedUntil: null }` | Lockout state tracking for brute-force PIN protection on kiosk terminals. |
| `deshal_hardware_device_uuid` | `string` | Generated UUID | Unique hardware identifier for kiosk hardware registration. |
| `deshal_kiosk_offline_queue_v1` | `KioskPunchQueueItem[]` (JSON) | `[]` | Offline punch event queue processed upon reconnect. |
| `rv_deshal_employees` | `Employee[]` (JSON) | `[]` | Shared employee directory auth snapshot. |

### 2.2 Financial Management & Accounting
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_vouchers_list` | `ReceiptVoucher[]` (JSON) | `[]` | Financial vouchers (Receipt, Payment, Journal, Sales, Purchase). |
| `rv_exchange_rates_cache` | `Record<string, number>` (JSON) | Default exchange rates map | Cached currency conversion exchange rates. |
| `rv_exchange_rates_last_updated` | `number` (Timestamp string) | `0` | Epoch timestamp of last successful currency API rate fetch. |

### 2.3 Master Data, Settings & Workspace
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_company_settings` | `CompanySettings` (JSON) | Standard Default Settings | Business profile, tax number, currency, company info, logo. |
| `rv_studio_design_theme` | `DesignTheme` (JSON) | Default Theme Object | UI layout density, accent colors, dark/light mode preference. |
| `rv_studio_branches_list` | `Branch[]` (JSON) | `[MAIN_BRANCH]` | Operational business branches, locations, and status. |
| `rv_studio_active_branch_id` | `string` | First branch ID | Currently selected active operational branch ID. |
| `rv_language_pref` | `string` ("ar" \| "en") | `"ar"` | Application UI language selection. |
| `alshamil_lang` | `string` ("ar" \| "en") | `"ar"` | Public website UI language selection. |
| `erp_sidebar_collapsed` | `string` ("true" \| "false") | `"false"` | Sidebar collapse state preference for desktop UI navigation. |
| `pwa_banner_dismissed` | `string` ("true" \| "false") | `"false"` | Tracks user dismissal state for Progressive Web App install prompt banner. |
| `deshal_offline_mutations_v1` | `MutationQueueItem[]` (JSON) | `[]` | Offline sync queue for write operations queued while disconnected. |
| `deshal_workspace_config_v1_<userId>` | `WorkspaceConfig` (JSON) | Default Layout Config | Per-user desktop workspace widget positions and layouts. |
| `rv_studio_whatsapp_logs` | `WhatsAppLog[]` (JSON) | `[]` | Outbound WhatsApp notification audit logs (max 100 items). |

### 2.4 Inventory, Stock & Suppliers
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_inventory_items` | `InventoryItem[]` (JSON) | `[]` | Product catalog, stock levels, SKUs, reorder points, prices. |
| `rv_studio_stock_movements` | `StockMovement[]` (JSON) | `[]` | Stock movement history (in, out, adjustment, waste). |
| `rv_studio_stock_transfers` | `StockTransfer[]` (JSON) | `[]` | Inter-branch inventory transfer requests and receipts. |
| `rv_studio_purchases_list` | `PurchaseOrder[]` (JSON) | `[]` | Purchase orders, supplier invoices, receive status. |
| `rv_studio_suppliers_list` | `Supplier[]` (JSON) | `[]` | Supplier profiles, contact info, tax registration numbers. |

### 2.5 CRM & Customer Management
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_customers_list` | `Customer[]` (JSON) | `[]` | Customer directory, tax IDs, credit limits, account balances. |
| `deshal_crm_leads_v1` | `CRMLead[]` (JSON) | `[]` | CRM leads pipeline, status, scores, assignment. |
| `deshal_crm_opportunities_v1` | `CRMOpportunity[]` (JSON) | `[]` | Active sales opportunities, deal values, stages, probability. |
| `deshal_crm_activities_v1` | `CRMActivity[]` (JSON) | `[]` | Customer interaction logs (calls, meetings, notes, tasks). |

### 2.6 Point of Sale (POS)
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_pos_orders_list` | `POSOrder[]` (JSON) | `[]` | Completed retail sales transactions, receipt numbers, totals. |
| `rv_studio_pos_held_carts` | `POSCart[]` (JSON) | `[]` | Parked/held checkout carts for suspended sales sessions. |
| `rv_studio_cashier_shifts` | `CashierShift[]` (JSON) | `[]` | Register opening/closing shifts, cash drawer reconciliation. |
| `rv_studio_active_shift` | `CashierShift` (JSON) | `null` | Currently open cashier shift for active register. |

### 2.7 Human Resources & Payroll
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_employees_list` | `Employee[]` (JSON) | `[]` | Employee records, salary components, roles, contact info. |
| `rv_studio_active_employee_id` | `string` | `null` | Currently selected employee profile for HR operations. |
| `deshal_hr_attendance_records` | `AttendanceRecord[]` (JSON) | `[]` | Timecard punch logs, clock-in/out timestamps, geolocation. |
| `deshal_hr_payroll_slips` | `PayrollSlip[]` (JSON) | `[]` | Generated monthly salary slips, deductions (PASI 7%), net pay. |
| `deshal_hr_leave_requests` | `LeaveRequest[]` (JSON) | `[]` | Leave applications, balance tracking, manager approvals. |

### 2.8 Real Estate, Spaces, Services & Contracts
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `rv_studio_rental_spaces` | `RentalSpace[]` (JSON) | `[]` | Manageable rental units, office spaces, desks, capacities. |
| `rv_studio_space_bookings` | `SpaceBooking[]` (JSON) | `[]` | Space reservations, check-in status, hourly/daily fees. |
| `rv_studio_consulting_services` | `ConsultingService[]` (JSON)| `[]` | Service catalog, hourly rates, service categories. |
| `rv_studio_membership_packages` | `MembershipPackage[]` (JSON)| `[]` | Co-working membership tier definitions and perks. |
| `rv_studio_tenant_subscriptions` | `TenantSubscription[]` (JSON)| `[]` | Active tenant recurring membership subscriptions. |
| `rv_studio_service_bookings` | `ServiceBooking[]` (JSON) | `[]` | Consulting service bookings and schedules. |
| `rv_studio_lease_contracts` | `LeaseContract[]` (JSON) | `[]` | Long-term commercial lease agreement documents and terms. |

### 2.9 Work Requests, Documents & Recurring Schedules
| Key Name | Data Type | Default Fallback | Purpose & Scope |
|---|---|---|---|
| `deshal_work_requests_v1` | `WorkRequest[]` (JSON) | `[]` | Internal department requests, approvals, workflow status. |
| `deshal_documents_metadata_v1` | `DocumentMetadata[]` (JSON) | `[]` | Document registry, file names, tags, permissions. |
| `deshal_documents_blobs_v1` | `Record<string, string>` | `{}` | Base64 binary document storage cache. |
| `rv_studio_recurring_schedules` | `RecurringSchedule[]` (JSON)| `[]` | Scheduled recurring accounting entries and billing tasks. |

---

## 3. Storage Utilities & Safety Guarantees

1. **Defensive Parsing**: All reading functions in `src/utils/storage/*.ts` use `try ... catch` blocks wrapping `JSON.parse(raw)`. If corrupted or non-parseable string data is encountered in `localStorage`, the storage layer catches the error, logs a warning, and returns the module's defined fallback value without throwing runtime exceptions.
2. **Selective Storage Clearing**: The global cleanup helper `clearAllLocalStorage()` in `src/utils/storage.ts` selectively removes keys matching `/^(deshal_|rv_)/` to prevent clearing unrelated third-party domain storage keys.
3. **Immutability & Integrity**: State setters write serialized JSON data back to `localStorage` atomically using `localStorage.setItem(key, JSON.stringify(data))`.
