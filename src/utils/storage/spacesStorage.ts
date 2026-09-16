import {
  RentalSpace,
  SpaceBooking,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
  ContractClause,
  LeaseContract
} from "../../types";

const SPACES_STORAGE_KEY = "rv_studio_rental_spaces";
const BOOKINGS_STORAGE_KEY = "rv_studio_space_bookings";
const SERVICES_STORAGE_KEY = "rv_studio_consulting_services";
const MEMBERSHIPS_STORAGE_KEY = "rv_studio_membership_packages";
const SUBSCRIPTIONS_STORAGE_KEY = "rv_studio_tenant_subscriptions";
const SERVICE_BOOKINGS_STORAGE_KEY = "rv_studio_service_bookings";
const CONTRACTS_STORAGE_KEY = "rv_studio_lease_contracts";

export const DEFAULT_RENTAL_SPACES: RentalSpace[] = [];

export const DEFAULT_SPACE_BOOKINGS: SpaceBooking[] = [];

export function loadRentalSpaces(): RentalSpace[] {
  try {
    const raw = localStorage.getItem(SPACES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load rental spaces:", e);
  }
  return [];
}

export function saveRentalSpaces(spaces: RentalSpace[]): void {
  try {
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
  } catch (e) {
    console.error("Failed to save rental spaces:", e);
  }
}

export function loadSpaceBookings(): SpaceBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load space bookings:", e);
  }
  return [];
}

export function saveSpaceBookings(bookings: SpaceBooking[]): void {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save space bookings:", e);
  }
}

export const DEFAULT_CONSULTING_SERVICES: ConsultingService[] = [];

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [];

export const DEFAULT_TENANT_SUBSCRIPTIONS: TenantSubscription[] = [];
export const DEFAULT_SERVICE_BOOKINGS: ServiceBooking[] = [];

export function loadConsultingServices(): ConsultingService[] {
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load consulting services:", e);
  }
  return [];
}

export function saveConsultingServices(services: ConsultingService[]): void {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  } catch (e) {
    console.error("Failed to save consulting services:", e);
  }
}

export function loadMembershipPackages(): MembershipPackage[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load membership packages:", e);
  }
  return [];
}

export function saveMembershipPackages(packages: MembershipPackage[]): void {
  try {
    localStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error("Failed to save membership packages:", e);
  }
}

export function loadTenantSubscriptions(): TenantSubscription[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load tenant subscriptions:", e);
  }
  return [];
}

export function saveTenantSubscriptions(subscriptions: TenantSubscription[]): void {
  try {
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error("Failed to save tenant subscriptions:", e);
  }
}

export function loadServiceBookings(): ServiceBooking[] {
  try {
    const raw = localStorage.getItem(SERVICE_BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load service bookings:", e);
  }
  return [];
}

export function saveServiceBookings(bookings: ServiceBooking[]): void {
  try {
    localStorage.setItem(SERVICE_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error("Failed to save service bookings:", e);
  }
}

export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: "cl-1",
    titleAr: "البند الأول: الغرض من الاستخدام والعين المؤجرة",
    titleEn: "Clause 1: Permitted Use & Leased Premises",
    contentAr: "يقر المستأجر بأنه عاين الوحدة والمساحة المؤجرة وملحقاتها المعاينة النافية للجهالة شرعاً وقانوناً وتسلمها بحالة ممتازة وصالحة للغرض المخصص لها كأنشطة تجارية ومهنية وإدارية نظامية، ويتعهد بعدم استخدامها في أي غرض يخالف النظام والآداب العامة أو القوانين المعمول بها في سلطنة عمان.",
    contentEn: "The Lessee acknowledges inspection of the leased premises and its fixtures, accepting it in prime operational condition for commercial and professional business purposes.",
    isMandatory: true,
    order: 1
  }
];

export const DEFAULT_LEASE_CONTRACTS: LeaseContract[] = [];

export function loadLeaseContracts(): LeaseContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load lease contracts:", e);
  }
  return [];
}

export function saveLeaseContracts(contracts: LeaseContract[]): void {
  try {
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error("Failed to save lease contracts:", e);
  }
}
