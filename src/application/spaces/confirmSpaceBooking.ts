import { SpaceBooking, ReceiptVoucher, Customer, CompanySettings } from "../../types";
import { numberToWords } from "../../domain/finance/numberToWords";
import { generateUuid } from "../../domain/common/uuid";

export interface ConfirmSpaceBookingInput {
  newBooking: SpaceBooking;
  autoGenerateVoucher?: boolean;
  vouchersList: ReceiptVoucher[];
  spaceBookingsList: SpaceBooking[];
  customersList: Customer[];
  companySettings: CompanySettings;
  activeBranchId: string;
  userName?: string;
  nowMs?: number;
  randomEntropy?: number;
}

export interface AuditLogToCreate {
  action: string;
  module: string;
  entityId: string;
  entityName: string;
  descAr: string;
  descEn: string;
}

export interface ConfirmSpaceBookingResult {
  finalBooking: SpaceBooking;
  newVoucher?: ReceiptVoucher;
  updatedVouchers: ReceiptVoucher[];
  updatedBookings: SpaceBooking[];
  updatedCustomers: Customer[];
  newCustomerCreated?: Customer;
  auditLogsToCreate: AuditLogToCreate[];
  shouldNavigateToPreview: boolean;
}

/**
 * Pure Application Use Case: Orchestrates Space Booking confirmation, ReceiptVoucher generation,
 * CRM Customer synchronization, and Audit Log preparation without any React UI or Persistence side-effects.
 */
export function confirmSpaceBooking(input: ConfirmSpaceBookingInput): ConfirmSpaceBookingResult {
  const {
    newBooking,
    autoGenerateVoucher = true,
    vouchersList,
    spaceBookingsList,
    customersList,
    companySettings,
    activeBranchId,
    userName,
    nowMs = Date.now(),
    randomEntropy = Math.random()
  } = input;

  let finalBooking: SpaceBooking = { ...newBooking };
  let newVoucher: ReceiptVoucher | undefined = undefined;
  let updatedVouchers: ReceiptVoucher[] = vouchersList;
  let updatedCustomers: Customer[] = customersList;
  let newCustomerCreated: Customer | undefined = undefined;
  const auditLogsToCreate: AuditLogToCreate[] = [];
  let shouldNavigateToPreview = false;

  const nowIso = new Date(nowMs).toISOString();

  // 1. Auto-generate official Receipt Voucher & invoice if requested
  if (autoGenerateVoucher) {
    const lineItems = [
      {
        id: `item-${nowMs}`,
        description: `${finalBooking.spaceName} - ${finalBooking.purpose} (${
          finalBooking.rentalType === "HOURLY"
            ? `${finalBooking.duration} ساعة`
            : finalBooking.rentalType === "DAILY"
            ? `${finalBooking.duration} يوم`
            : `${finalBooking.duration} شهر`
        })`,
        quantity: finalBooking.duration,
        unitPrice: finalBooking.unitPrice,
        amount: finalBooking.subtotal
      }
    ];

    const subtotal = finalBooking.subtotal;
    const taxAmount = finalBooking.taxAmount;
    const totalAmount = finalBooking.totalAmount;
    const currency = finalBooking.currency || companySettings.defaultCurrency || "OMR";

    newVoucher = {
      id: `rv-${nowMs}`,
      voucherNumber: `RV-SP-${new Date(nowMs).getFullYear()}-${Math.floor(1000 + randomEntropy * 9000)}`,
      referenceNo: finalBooking.bookingNumber,
      date: finalBooking.startDate || new Date().toISOString().split("T")[0],
      type: "RECEIPT",
      receivedFrom: finalBooking.customerName,
      payerPhone: finalBooking.customerPhone,
      payerEmail: finalBooking.customerEmail,
      amount: totalAmount,
      amountInWords: numberToWords(totalAmount, currency),
      currency: currency,
      paymentMethod: finalBooking.paymentMethod || "CREDIT_CARD",
      category: "إيرادات حجز وتأجير قاعات ومساحات عمل",
      notes: `سند قبض مالي تم إنشاؤه تلقائياً مقابل حجز ${finalBooking.spaceName} - رقم الحجز: ${finalBooking.bookingNumber}`,
      terms: "شكراً لتعاملكم معنا. يُرجى الالتزام بمواعيد الحجز وسياسة استخدام القاعات ومساحات العمل.",
      customFields: [],
      lineItems: lineItems,
      subtotal: subtotal,
      taxRate: 5,
      taxAmount: taxAmount,
      discountAmount: 0,
      totalAmount: totalAmount,
      isCustomWords: false,
      status: "PAID",
      branchId: finalBooking.branchId || activeBranchId,
      branchName: finalBooking.branchName,
      preparedBy: userName || "النظام الآلي",
      approvedBy: "الإدارة المالية",
      receivedBy: finalBooking.customerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updatedVouchers = [newVoucher, ...vouchersList];

    finalBooking.linkedVoucherId = newVoucher.id;
    finalBooking.linkedVoucherNumber = newVoucher.voucherNumber;
    finalBooking.paymentStatus = "PAID";

    shouldNavigateToPreview = true;

    auditLogsToCreate.push({
      action: "CREATE",
      module: "VOUCHERS",
      entityId: newVoucher.id,
      entityName: newVoucher.voucherNumber,
      descAr: `إنشاء سند قبض مالي تلقائي (${newVoucher.voucherNumber}) لحجز القاعة ${finalBooking.bookingNumber}`,
      descEn: `Auto-generated receipt voucher (${newVoucher.voucherNumber}) for space booking ${finalBooking.bookingNumber}`
    });
  }

  // 2. Add booking to list
  const updatedBookings = [finalBooking, ...spaceBookingsList];

  // 3. Sync / create customer if not already present in CRM
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
        type: finalBooking.customerCompany ? "CORPORATE" : "INDIVIDUAL",
        status: "ACTIVE",
        notes: finalBooking.customerCompany ? `الشركة / المؤسسة: ${finalBooking.customerCompany}` : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedCustomers = [newCustomerCreated, ...customersList];
    }
  }

  // 4. Booking Audit Log Entry
  auditLogsToCreate.push({
    action: "CREATE",
    module: "VOUCHERS",
    entityId: finalBooking.id,
    entityName: finalBooking.bookingNumber,
    descAr: `تأكيد حجز جديد (${finalBooking.bookingNumber}) في ${finalBooking.spaceName} للمستأجر ${finalBooking.customerName}`,
    descEn: `Confirmed new booking (${finalBooking.bookingNumber}) at ${finalBooking.spaceName} for ${finalBooking.customerName}`
  });

  return {
    finalBooking,
    newVoucher,
    updatedVouchers,
    updatedBookings,
    updatedCustomers,
    newCustomerCreated,
    auditLogsToCreate,
    shouldNavigateToPreview
  };
}
