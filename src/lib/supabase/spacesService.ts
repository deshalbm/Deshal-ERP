/**
 * Spaces & Leasing Service — Supabase CRUD
 * Maps between app RentalSpace, SpaceBooking, LeaseContract, ConsultingService,
 * MembershipPackage, TenantSubscription, ServiceBooking types (src/types.ts) and Supabase.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  RentalSpace,
  SpaceBooking,
  LeaseContract,
  ConsultingService,
  MembershipPackage,
  TenantSubscription,
  ServiceBooking,
} from '../../types';
import { ensureValidUuid, ensureNullableUuid } from '../../utils/uuid';

// ──────────────────────────────────────────────
// Rental Spaces
// ──────────────────────────────────────────────

export async function getRentalSpaces(companyId: string): Promise<RentalSpace[]> {
  if (!isSupabaseConfigured) return [];

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('spaces') as any)
    .select('*')
    .eq('company_id', validCompanyId)
    .order('name_ar', { ascending: true });

  if (error) { console.error('[SpacesService] getRentalSpaces:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): RentalSpace => ({
    id: row.id,
    code: row.code ?? '',
    name: row.name_ar ?? row.name ?? '',
    nameEn: row.name_en ?? '',
    type: row.space_type ?? 'OFFICE',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    capacity: row.capacity ?? 0,
    floorLocation: row.floor_location ?? '',
    hourlyRate: row.hourly_rate ?? 0,
    dailyRate: row.daily_rate ?? 0,
    monthlyRate: row.monthly_rate ?? 0,
    currency: row.currency ?? 'OMR',
    amenities: row.amenities ?? [],
    images: row.images ?? [],
    imageUrl: row.image_url ?? '',
    status: row.status ?? 'AVAILABLE',
    description: row.description ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertRentalSpace(
  space: RentalSpace, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('spaces') as any).upsert({
    id: ensureValidUuid(space.id),
    company_id: validCompanyId,
    code: space.code,
    name_ar: space.name,
    name_en: space.nameEn,
    space_type: space.type,
    branch_id: ensureNullableUuid(space.branchId),
    branch_name: space.branchName,
    capacity: space.capacity,
    floor_location: space.floorLocation,
    hourly_rate: space.hourlyRate,
    daily_rate: space.dailyRate,
    monthly_rate: space.monthlyRate,
    currency: space.currency ?? 'OMR',
    amenities: space.amenities,
    images: space.images ?? [],
    image_url: space.imageUrl,
    status: space.status,
    description: space.description,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Space Bookings
// ──────────────────────────────────────────────

export async function getSpaceBookings(companyId: string): Promise<SpaceBooking[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('space_bookings') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('start_time', { ascending: false });

  if (error) { console.error('[SpacesService] getSpaceBookings:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): SpaceBooking => ({
    id: row.id,
    bookingNumber: row.booking_number ?? '',
    spaceId: row.space_id,
    spaceName: row.space_name ?? '',
    spaceType: row.space_type ?? 'OFFICE',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    customerId: row.customer_id ?? '',
    customerName: row.customer_name ?? '',
    customerPhone: row.customer_phone ?? '',
    customerEmail: row.customer_email ?? '',
    rentalType: row.rental_type ?? 'HOURLY',
    startDate: row.start_date,
    startTime: row.start_time ?? '',
    endDate: row.end_date,
    endTime: row.end_time ?? '',
    duration: row.duration ?? 1,
    unitPrice: row.unit_price ?? 0,
    subtotal: row.subtotal ?? 0,
    discountAmount: row.discount_amount ?? 0,
    taxAmount: row.tax_amount ?? 0,
    totalAmount: row.total_amount ?? 0,
    currency: row.currency ?? 'OMR',
    purpose: row.purpose ?? '',
    status: row.status ?? 'PENDING',
    paymentStatus: row.payment_status ?? 'UNPAID',
    createdByType: row.created_by_type ?? 'STAFF',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertSpaceBooking(
  booking: SpaceBooking, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  const validCompanyId = ensureValidUuid(companyId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('space_bookings') as any).upsert({
    id: ensureValidUuid(booking.id),
    company_id: validCompanyId,
    booking_number: booking.bookingNumber,
    space_id: ensureNullableUuid(booking.spaceId),
    space_name: booking.spaceName,
    space_type: booking.spaceType,
    branch_id: ensureNullableUuid(booking.branchId),
    branch_name: booking.branchName,
    customer_id: ensureNullableUuid(booking.customerId),
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone,
    customer_email: booking.customerEmail,
    rental_type: booking.rentalType,
    start_date: booking.startDate,
    start_time: booking.startTime,
    end_date: booking.endDate,
    end_time: booking.endTime,
    duration: booking.duration,
    unit_price: booking.unitPrice,
    subtotal: booking.subtotal,
    discount_amount: booking.discountAmount,
    tax_amount: booking.taxAmount,
    total_amount: booking.totalAmount,
    currency: booking.currency,
    purpose: booking.purpose,
    status: booking.status,
    payment_status: booking.paymentStatus,
    created_by_type: booking.createdByType,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Lease Contracts
// ──────────────────────────────────────────────

export async function getLeaseContracts(companyId: string): Promise<LeaseContract[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('lease_contracts') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: false });

  if (error) { console.error('[SpacesService] getLeaseContracts:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): LeaseContract => ({
    id: row.id,
    contractNumber: row.contract_number ?? '',
    titleAr: row.title_ar ?? '',
    titleEn: row.title_en ?? '',
    contractType: row.contract_type ?? 'OFFICE_LEASE',
    status: row.status ?? 'ACTIVE',
    lessorCompanyName: row.lessor_company_name ?? '',
    lessorCrNumber: row.lessor_cr_number ?? '',
    lessorTaxNumber: row.lessor_tax_number ?? '',
    lessorRepresentative: row.lessor_representative ?? '',
    lessorPhone: row.lessor_phone ?? '',
    lessorEmail: row.lessor_email ?? '',
    lessorAddress: row.lessor_address ?? '',
    customerId: row.customer_id ?? '',
    tenantName: row.tenant_name ?? '',
    tenantType: row.tenant_type ?? 'CORPORATE',
    tenantSignatoryName: row.tenant_signatory_name ?? '',
    tenantPhone: row.tenant_phone ?? '',
    tenantEmail: row.tenant_email ?? '',
    tenantAddress: row.tenant_address ?? '',
    spaceId: row.space_id ?? '',
    spaceCode: row.space_code ?? '',
    spaceName: row.space_name ?? '',
    spaceType: row.space_type ?? 'OFFICE',
    branchId: row.branch_id ?? '',
    branchName: row.branch_name ?? '',
    startDate: row.start_date,
    endDate: row.end_date,
    durationMonths: row.duration_months ?? 12,
    noticePeriodDays: row.notice_period_days ?? 60,
    autoRenew: row.auto_renew ?? true,
    totalRentAmount: row.total_rent_amount ?? 0,
    discountAmount: row.discount_amount ?? 0,
    taxRate: row.tax_rate ?? 5,
    taxAmount: row.tax_amount ?? 0,
    finalContractValue: row.final_contract_value ?? 0,
    currency: row.currency ?? 'OMR',
    paymentFrequency: row.payment_frequency ?? 'MONTHLY',
    includedAmenities: row.included_amenities ?? {
      highSpeedInternet: true,
      electricityAndWater: true,
      centralAirConditioning: true,
      dailyCleaningService: true,
      receptionAndMailHandling: true,
      smartAccessControl: true,
      maintenanceSupport: true,
      beverageAndCoffeeStation: true,
    },
    securityDeposit: row.security_deposit ?? {
      amount: 0,
      currency: 'OMR',
      status: 'HELD',
      receiptVoucherNo: '',
      notes: '',
    },
    installments: row.installments ?? [],
    monthlyFreeMeetingRoomHours: row.monthly_free_meeting_room_hours ?? 0,
    monthlyFreeMediaStudioHours: row.monthly_free_media_studio_hours ?? 0,
    monthlyFreeConsultations: row.monthly_free_consultations ?? 0,
    tenantDiscountOnExtraServicesPercent: row.tenant_discount_on_extra_services_percent ?? 0,
    clauses: row.clauses ?? [],
    customTermsNotes: row.custom_terms_notes ?? '',
    isDigitallySigned: row.is_digitally_signed ?? false,
    documents: row.documents ?? [],
    preparedByName: row.prepared_by_name ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertLeaseContract(
  contract: LeaseContract, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('lease_contracts') as any).upsert({
    id: contract.id,
    company_id: companyId,
    contract_number: contract.contractNumber,
    title_ar: contract.titleAr,
    title_en: contract.titleEn,
    contract_type: contract.contractType,
    status: contract.status,
    lessor_company_name: contract.lessorCompanyName,
    lessor_cr_number: contract.lessorCrNumber,
    lessor_tax_number: contract.lessorTaxNumber,
    lessor_representative: contract.lessorRepresentative,
    lessor_phone: contract.lessorPhone,
    lessor_email: contract.lessorEmail,
    lessor_address: contract.lessorAddress,
    customer_id: contract.customerId,
    tenant_name: contract.tenantName,
    tenant_type: contract.tenantType,
    tenant_signatory_name: contract.tenantSignatoryName,
    tenant_phone: contract.tenantPhone,
    tenant_email: contract.tenantEmail,
    tenant_address: contract.tenantAddress,
    space_id: contract.spaceId,
    space_code: contract.spaceCode,
    space_name: contract.spaceName,
    space_type: contract.spaceType,
    branch_id: contract.branchId,
    branch_name: contract.branchName,
    start_date: contract.startDate,
    end_date: contract.endDate,
    duration_months: contract.durationMonths,
    notice_period_days: contract.noticePeriodDays,
    auto_renew: contract.autoRenew,
    total_rent_amount: contract.totalRentAmount,
    discount_amount: contract.discountAmount,
    tax_rate: contract.taxRate,
    tax_amount: contract.taxAmount,
    final_contract_value: contract.finalContractValue,
    currency: contract.currency,
    payment_frequency: contract.paymentFrequency,
    included_amenities: contract.includedAmenities,
    security_deposit: contract.securityDeposit,
    installments: contract.installments ?? [],
    monthly_free_meeting_room_hours: contract.monthlyFreeMeetingRoomHours,
    monthly_free_media_studio_hours: contract.monthlyFreeMediaStudioHours,
    monthly_free_consultations: contract.monthlyFreeConsultations,
    tenant_discount_on_extra_services_percent: contract.tenantDiscountOnExtraServicesPercent,
    clauses: contract.clauses ?? [],
    custom_terms_notes: contract.customTermsNotes ?? '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Consulting Services
// ──────────────────────────────────────────────

export async function getConsultingServices(companyId: string): Promise<ConsultingService[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('consulting_services') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) { console.error('[SpacesService] getConsultingServices:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): ConsultingService => ({
    id: row.id,
    code: row.code ?? '',
    name: row.name ?? '',
    nameEn: row.name_en ?? '',
    category: row.category ?? 'CONSULTING',
    shortDescription: row.short_description ?? '',
    fullDescription: row.full_description ?? '',
    pricingModel: row.pricing_model ?? 'FIXED_PRICE',
    basePrice: row.base_price ?? 0,
    currency: row.currency ?? 'OMR',
    estimatedDuration: row.estimated_duration ?? '',
    deliveryTime: row.delivery_time ?? '',
    deliverables: row.deliverables ?? [],
    requirements: row.requirements ?? [],
    includedInTenantPackage: row.included_in_tenant_package ?? false,
    icon: row.icon ?? 'Briefcase',
    color: row.color ?? '#4f46e5',
    status: row.status ?? 'ACTIVE',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertConsultingService(
  service: ConsultingService, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('consulting_services') as any).upsert({
    id: service.id,
    company_id: companyId,
    code: service.code,
    name: service.name,
    name_en: service.nameEn,
    category: service.category,
    short_description: service.shortDescription,
    full_description: service.fullDescription,
    pricing_model: service.pricingModel,
    base_price: service.basePrice,
    currency: service.currency,
    estimated_duration: service.estimatedDuration,
    delivery_time: service.deliveryTime,
    deliverables: service.deliverables ?? [],
    requirements: service.requirements ?? [],
    included_in_tenant_package: service.includedInTenantPackage ?? false,
    icon: service.icon,
    color: service.color,
    status: service.status,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Membership Packages
// ──────────────────────────────────────────────

export async function getMembershipPackages(companyId: string): Promise<MembershipPackage[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('membership_packages') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) { console.error('[SpacesService] getMembershipPackages:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): MembershipPackage => ({
    id: row.id,
    code: row.code ?? '',
    name: row.name ?? '',
    nameEn: row.name_en ?? '',
    tier: row.tier ?? 'BASIC',
    monthlyFee: row.monthly_fee ?? 0,
    currency: row.currency ?? 'OMR',
    freeMeetingRoomHoursPerMonth: row.free_meeting_room_hours_per_month ?? 0,
    freeMediaStudioHoursPerMonth: row.free_media_studio_hours_per_month ?? 0,
    freeConsultationSessionsPerMonth: row.free_consultation_sessions_per_month ?? 0,
    discountOnExtraServicesPercent: row.discount_on_extra_services_percent ?? 0,
    features: row.features ?? [],
    color: row.color ?? '#4f46e5',
    status: row.status ?? 'ACTIVE',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertMembershipPackage(
  pkg: MembershipPackage, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('membership_packages') as any).upsert({
    id: pkg.id,
    company_id: companyId,
    code: pkg.code,
    name: pkg.name,
    name_en: pkg.nameEn,
    tier: pkg.tier,
    monthly_fee: pkg.monthlyFee,
    currency: pkg.currency,
    free_meeting_room_hours_per_month: pkg.freeMeetingRoomHoursPerMonth,
    free_media_studio_hours_per_month: pkg.freeMediaStudioHoursPerMonth,
    free_consultation_sessions_per_month: pkg.freeConsultationSessionsPerMonth,
    discount_on_extra_services_percent: pkg.discountOnExtraServicesPercent,
    features: pkg.features ?? [],
    color: pkg.color,
    status: pkg.status,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Tenant Subscriptions
// ──────────────────────────────────────────────

export async function getTenantSubscriptions(companyId: string): Promise<TenantSubscription[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tenant_subscriptions') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: false });

  if (error) { console.error('[SpacesService] getTenantSubscriptions:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): TenantSubscription => ({
    id: row.id,
    subscriptionNumber: row.subscription_number ?? '',
    customerId: row.customer_id ?? '',
    customerName: row.customer_name ?? '',
    customerPhone: row.customer_phone ?? '',
    customerEmail: row.customer_email ?? '',
    companyName: row.company_name ?? '',
    packageId: row.package_id,
    packageName: row.package_name ?? '',
    billingCycle: row.billing_cycle ?? 'MONTHLY',
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status ?? 'ACTIVE',
    meetingRoomHoursQuota: row.meeting_room_hours_quota ?? 0,
    meetingRoomHoursUsed: row.meeting_room_hours_used ?? 0,
    mediaStudioHoursQuota: row.media_studio_hours_quota ?? 0,
    mediaStudioHoursUsed: row.media_studio_hours_used ?? 0,
    consultationSessionsQuota: row.consultation_sessions_quota ?? 0,
    consultationSessionsUsed: row.consultation_sessions_used ?? 0,
    monthlyFee: row.monthly_fee ?? 0,
    currency: row.currency ?? 'OMR',
    discountOnExtraServicesPercent: row.discount_on_extra_services_percent ?? 0,
    autoRenew: row.auto_renew ?? true,
    notes: row.notes ?? '',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertTenantSubscription(
  sub: TenantSubscription, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_subscriptions') as any).upsert({
    id: sub.id,
    company_id: companyId,
    subscription_number: sub.subscriptionNumber,
    customer_id: sub.customerId,
    customer_name: sub.customerName,
    customer_phone: sub.customerPhone,
    customer_email: sub.customerEmail,
    company_name: sub.companyName,
    package_id: sub.packageId,
    package_name: sub.packageName,
    billing_cycle: sub.billingCycle,
    start_date: sub.startDate,
    end_date: sub.endDate,
    status: sub.status,
    meeting_room_hours_quota: sub.meetingRoomHoursQuota,
    meeting_room_hours_used: sub.meetingRoomHoursUsed,
    media_studio_hours_quota: sub.mediaStudioHoursQuota,
    media_studio_hours_used: sub.mediaStudioHoursUsed,
    consultation_sessions_quota: sub.consultationSessionsQuota,
    consultation_sessions_used: sub.consultationSessionsUsed,
    monthly_fee: sub.monthlyFee,
    currency: sub.currency,
    discount_on_extra_services_percent: sub.discountOnExtraServicesPercent,
    auto_renew: sub.autoRenew,
    notes: sub.notes,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Service Bookings
// ──────────────────────────────────────────────

export async function getServiceBookings(companyId: string): Promise<ServiceBooking[]> {
  if (!isSupabaseConfigured) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('service_bookings') as any)
    .select('*')
    .eq('company_id', companyId)
    .order('booking_date', { ascending: false });

  if (error) { console.error('[SpacesService] getServiceBookings:', error.message); return []; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): ServiceBooking => ({
    id: row.id,
    bookingNumber: row.booking_number ?? '',
    serviceId: row.service_id,
    serviceName: row.service_name ?? '',
    category: row.category ?? 'CONSULTING',
    customerId: row.customer_id ?? '',
    customerName: row.customer_name ?? '',
    customerPhone: row.customer_phone ?? '',
    customerEmail: row.customer_email ?? '',
    companyName: row.company_name ?? '',
    consultationType: row.consultation_type ?? 'IN_PERSON',
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time ?? '',
    duration: row.duration ?? '',
    scopeDetails: row.scope_details ?? '',
    assignedConsultant: row.assigned_consultant ?? '',
    isCoveredByMembership: row.is_covered_by_membership ?? false,
    tenantSubscriptionId: row.tenant_subscription_id ?? '',
    price: row.price ?? 0,
    discount: row.discount ?? 0,
    finalAmount: row.final_amount ?? 0,
    currency: row.currency ?? 'OMR',
    status: row.status ?? 'REQUESTED',
    paymentStatus: row.payment_status ?? 'UNPAID',
    createdByType: row.created_by_type ?? 'STAFF',
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }));
}

export async function upsertServiceBooking(
  booking: ServiceBooking, companyId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('service_bookings') as any).upsert({
    id: booking.id,
    company_id: companyId,
    booking_number: booking.bookingNumber,
    service_id: booking.serviceId,
    service_name: booking.serviceName,
    category: booking.category,
    customer_id: booking.customerId,
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone,
    customer_email: booking.customerEmail,
    company_name: booking.companyName,
    consultation_type: booking.consultationType,
    preferred_date: booking.preferredDate,
    preferred_time: booking.preferredTime,
    duration: booking.duration,
    scope_details: booking.scopeDetails,
    assigned_consultant: booking.assignedConsultant,
    is_covered_by_membership: booking.isCoveredByMembership,
    tenant_subscription_id: booking.tenantSubscriptionId,
    price: booking.price,
    discount: booking.discount,
    final_amount: booking.finalAmount,
    currency: booking.currency,
    status: booking.status,
    payment_status: booking.paymentStatus,
    created_by_type: booking.createdByType,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ──────────────────────────────────────────────
// Delete Helpers
// ──────────────────────────────────────────────

export async function deleteRentalSpace(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('spaces') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSpaceBooking(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('space_bookings') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteLeaseContract(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('lease_contracts') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteConsultingService(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('consulting_services') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteMembershipPackage(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('membership_packages') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteTenantSubscription(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tenant_subscriptions') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteServiceBooking(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase غير مضبوط.' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('service_bookings') as any).delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

