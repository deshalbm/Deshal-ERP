import {
  ServiceBooking,
  TenantSubscription,
  ReceiptVoucher,
  Customer,
  CompanySettings
} from "../../types";
import { numberToWords } from "../../domain/finance/numberToWords";
import { generateUuid } from "../../domain/common/uuid";
import { calculateSpaceBookingTotals } from "../../domain/spaces/spacesEngine";

export interface ConfirmServiceBookingInput {
  newBooking: ServiceBooking;
  autoGenerateVoucher?: boolean;
  tenantSubscriptionsList: TenantSubscription[];
  serviceBookingsList: ServiceBooking[];
  vouchersList: ReceiptVoucher[];
  customersList: Customer[];
  companySettings: CompanySettings;
  activeBranchId: string;
  userName?: string;
  nowMs?: number;
  randomEntropy?: number;
}

export interface AuditLogToCreatePayload {
  action: string;
  module: string;
  entityId: string;
  entityName: string;
  descAr: string;
  descEn: string;
}

export interface ConfirmServiceBookingResult {
  finalBooking: ServiceBooking;
  updatedSubscriptions: TenantSubscription[];
  newSubQuotaDeducted?: TenantSubscription;
  updatedBookings: ServiceBooking[];
  newVoucher?: ReceiptVoucher;
  updatedVouchers: ReceiptVoucher[];
  newCustomerCreated?: Customer;
  updatedCustomers: Customer[];
  auditLogsToCreate: AuditLogToCreatePayload[];
  shouldNavigateToPreview: boolean;
}

/**
 * Pure Application Use Case: Orchestrates consulting & administrative service booking confirmation,
 * tenant subscription membership quota deduction, ReceiptVoucher generation (RV-SRV-YYYY-XXXX),
 * CRM customer synchronization, and audit payload preparation with zero React UI or persistence side-effects.
 */
export function confirmServiceBooking(
  input: ConfirmServiceBookingInput
): ConfirmServiceBookingResult {
  const {
    newBooking,
    autoGenerateVoucher = true,
    tenantSubscriptionsList,
    serviceBookingsList,
    vouchersList,
    customersList,
    companySettings,
    activeBranchId,
    userName
  } = input;

  let finalBooking: ServiceBooking = { ...newBooking };
  let updatedSubscriptions: TenantSubscription[] = tenantSubscriptionsList;
  let newSubQuotaDeducted: TenantSubscription | undefined = undefined;

  // 1. If tenant subscription quota was utilized, deduct it from their quota balance
  if (finalBooking.tenantSubscriptionId && finalBooking.isCoveredByMembership) {
    const targetSub = tenantSubscriptionsList.find((s) => s.id === finalBooking.tenantSubscriptionId);
    if (targetSub) {
      const updatedSub: TenantSubscription = { ...targetSub };
      if (finalBooking.category === "MEDIA_STUDIO") {
        updatedSub.mediaStudioHoursUsed = (updatedSub.mediaStudioHoursUsed || 0) + 1;
      } else {
        updatedSub.consultationSessionsUsed = (updatedSub.consultationSessionsUsed || 0) + 1;
      }
      updatedSub.updatedAt = new Date().toISOString();
      newSubQuotaDeducted = updatedSub;
      updatedSubscriptions = tenantSubscriptionsList.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    }
  }

  let newVoucher: ReceiptVoucher | undefined = undefined;
  let updatedVouchers: ReceiptVoucher[] = vouchersList;
  let shouldNavigateToPreview = false;
  const auditLogsToCreate: AuditLogToCreatePayload[] = [];

  // 2. Auto-generate official Receipt Voucher
  if (autoGenerateVoucher) {
    const lineItems = [
      {
        id: `item-srv-${Date.now()}`,
        description: `${finalBooking.serviceName} (${finalBooking.duration || "جلسة استشارية / مهمة تنفيذية"})`,
        quantity: 1,
        unitPrice: finalBooking.price,
        amount: finalBooking.price
      }
    ];

    const bookingTotals = calculateSpaceBookingTotals(finalBooking.price, 1, finalBooking.discount || 0, 5);
    const subtotal = bookingTotals.subtotal;
    const discount = bookingTotals.discountAmount;
    const taxableAmount = bookingTotals.taxableBase;
    const taxAmount = bookingTotals.taxAmount;
    const totalAmount = finalBooking.isCoveredByMembership ? 0 : bookingTotals.totalAmount;
    const currency = finalBooking.currency || companySettings.defaultCurrency || "OMR";

    newVoucher = {
      id: `rv-srv-${Date.now()}`,
      voucherNumber: `RV-SRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceNo: finalBooking.bookingNumber,
      date: finalBooking.preferredDate || new Date().toISOString().split("T")[0],
      type: "RECEIPT",
      receivedFrom: finalBooking.customerName,
      payerPhone: finalBooking.customerPhone,
      payerEmail: finalBooking.customerEmail,
      amount: totalAmount,
      amountInWords: numberToWords(totalAmount, currency),
      currency: currency,
      paymentMethod: finalBooking.paymentMethod || "CREDIT_CARD",
      category: "إيرادات خدمات استشارية وإدارية مساندة",
      notes: `سند قبض مالي مقابل حجز خدمة (${finalBooking.serviceName}) - رقم الحجز: ${finalBooking.bookingNumber}${finalBooking.isCoveredByMembership ? " (مغطاة بالكامل مجاناً ضمن باقة اشتراك المستأجر)" : ""}`,
      terms: "شكراً لاختياركم خدماتنا الاستشارية. يرجى مراجعة فريق العمل لمتابعة جدول تنفيذ الخدمة.",
      customFields: [],
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: 5,
      taxAmount: taxAmount,
      discountAmount: discount,
      totalAmount: totalAmount,
      isCustomWords: false,
      status: "PAID",
      branchId: activeBranchId,
      preparedBy: userName || "النظام الذكي",
      approvedBy: "الإدارة المالية",
      receivedBy: finalBooking.customerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updatedVouchers = [newVoucher, ...vouchersList];

    finalBooking.linkedVoucherId = newVoucher.id;
    finalBooking.linkedVoucherNumber = newVoucher.voucherNumber;
    finalBooking.paymentStatus = finalBooking.isCoveredByMembership ? "FREE_QUOTA" : "PAID";

    shouldNavigateToPreview = true;

    auditLogsToCreate.push({
      action: "CREATE",
      module: "VOUCHERS",
      entityId: newVoucher.id,
      entityName: newVoucher.voucherNumber,
      descAr: `إنشاء سند قبض مالي رسمي (${newVoucher.voucherNumber}) لحجز الخدمة الاستشارية ${finalBooking.bookingNumber}`,
      descEn: `Auto-generated receipt voucher (${newVoucher.voucherNumber}) for service booking ${finalBooking.bookingNumber}`
    });
  }

  const updatedBookings = [finalBooking, ...serviceBookingsList];
  let updatedCustomers: Customer[] = customersList;
  let newCustomerCreated: Customer | undefined = undefined;

  // 3. Sync Customer in CRM
  if (finalBooking.customerName) {
    const existingCust = customersList.find(
      (c) =>
        c.name.trim().toLowerCase() === finalBooking.customerName.trim().toLowerCase() ||
        (c.phone && finalBooking.customerPhone && c.phone.trim() === finalBooking.customerPhone.trim())
    );
    if (!existingCust) {
      newCustomerCreated = {
        id: generateUuid(),
        name: finalBooking.customerName,
        phone: finalBooking.customerPhone,
        email: finalBooking.customerEmail || "",
        type: finalBooking.companyName ? "CORPORATE" : "INDIVIDUAL",
        status: "ACTIVE",
        notes: finalBooking.companyName ? `الشركة: ${finalBooking.companyName}` : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedCustomers = [newCustomerCreated, ...customersList];
    }
  }

  // 4. Service Booking Audit Log Entry
  auditLogsToCreate.push({
    action: "CREATE",
    module: "VOUCHERS",
    entityId: finalBooking.id,
    entityName: finalBooking.bookingNumber,
    descAr: `تأكيد حجز خدمة استشارية (${finalBooking.bookingNumber}) للعميل ${finalBooking.customerName}`,
    descEn: `Confirmed service booking (${finalBooking.bookingNumber}) for ${finalBooking.customerName}`
  });

  return {
    finalBooking,
    updatedSubscriptions,
    newSubQuotaDeducted,
    updatedBookings,
    newVoucher,
    updatedVouchers,
    newCustomerCreated,
    updatedCustomers,
    auditLogsToCreate,
    shouldNavigateToPreview
  };
}
