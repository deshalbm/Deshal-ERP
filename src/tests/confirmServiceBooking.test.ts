import { confirmServiceBooking, ConfirmServiceBookingInput } from "../application/services/confirmServiceBooking";
import { ServiceBooking, TenantSubscription, Customer, CompanySettings } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — CONFIRM SERVICE BOOKING USE CASE UNIT TEST SUITE");
console.log("================================================================\n");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const mockSettings: CompanySettings = {
  companyName: "شركة ديشال للخدمات الاستشارية",
  tagline: "حلول الأعمال والاستشارات",
  logoUrl: "",
  logoWidth: 140,
  taxId: "OM-TAX-555",
  crNumber: "CR-55555",
  address: "مسقط - بوشر",
  cityStateZip: "مسقط",
  country: "عُمان",
  phone: "+96895555555",
  email: "services@deshalbm.com",
  website: "https://deshalbm.com",
  headerNotice: "",
  footerNotice: "",
  termsAndConditions: "الشروط والأنظمة العامة",
  authorizedSignatoryName: "المدير التنفيذي",
  authorizedSignatoryTitle: "مدير قسم الاستشارات",
  signatureImageUrl: "",
  stampImageUrl: "",
  bankDetails: { bankName: "بنك مسقط", accountName: "ديشال", accountNumber: "789", iban: "OM789", swiftCode: "BOM" },
  defaultCustomFields: [],
  qrCodeContent: "",
  defaultCurrency: "OMR"
};

const sampleBooking: ServiceBooking = {
  id: "srv-booking-1",
  bookingNumber: "SB-2026-001",
  serviceId: "srv-advisory-1",
  serviceName: "استشارة قانونية وتأشيرات تجارية",
  category: "CONSULTING",
  customerName: "سعيد بن محمد المعمري",
  customerPhone: "+96894444444",
  customerEmail: "said@example.om",
  companyName: "مؤسسة المعمري للحلول",
  consultationType: "IN_PERSON",
  preferredDate: "2026-09-15",
  preferredTime: "10:00 AM",
  duration: "ساعة واحدة",
  scopeDetails: "تفاصيل طلب الخدمة والاستشارة",
  price: 100,
  discount: 10,
  finalAmount: 94.5,
  currency: "OMR",
  status: "CONFIRMED",
  paymentStatus: "UNPAID",
  isCoveredByMembership: false,
  createdByType: "STAFF",
  createdAt: "2026-09-09T08:00:00Z",
  updatedAt: "2026-09-09T08:00:00Z"
};

const sampleSubscription: TenantSubscription = {
  id: "sub-100",
  subscriptionNumber: "SUB-2026-001",
  customerId: "cust-50",
  customerName: "سعيد بن محمد المعمري",
  customerPhone: "+96894444444",
  customerEmail: "said@example.om",
  companyName: "مؤسسة المعمري للحلول",
  packageId: "pkg-gold",
  packageName: "الباقة الذهبية للمكاتب",
  billingCycle: "MONTHLY",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: "ACTIVE",
  meetingRoomHoursQuota: 10,
  meetingRoomHoursUsed: 2,
  mediaStudioHoursQuota: 5,
  mediaStudioHoursUsed: 1,
  consultationSessionsQuota: 3,
  consultationSessionsUsed: 0,
  monthlyFee: 200,
  currency: "OMR",
  discountOnExtraServicesPercent: 10,
  autoRenew: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};

const baseInput: ConfirmServiceBookingInput = {
  newBooking: sampleBooking,
  autoGenerateVoucher: true,
  tenantSubscriptionsList: [sampleSubscription],
  serviceBookingsList: [],
  vouchersList: [],
  customersList: [],
  companySettings: mockSettings,
  activeBranchId: "branch-muscat",
  userName: "خالد المستشار"
};

// [Test 1] Standard Service Booking Confirmation with Auto Voucher
console.log("[Test 1] Standard Service Booking Confirmation with Auto Voucher");
const res1 = confirmServiceBooking(baseInput);
assert(res1.finalBooking.id === "srv-booking-1", "Preserves service booking ID");
assert(res1.updatedBookings.length === 1, "Adds booking to updatedBookings list");
assert(res1.shouldNavigateToPreview === true, "Sets shouldNavigateToPreview flag to true");

// [Test 2] Receipt Voucher Format RV-SRV-YYYY-XXXX
console.log("\n[Test 2] Receipt Voucher Format Check");
assert(res1.newVoucher !== undefined, "Generates a ReceiptVoucher object");
assert(res1.newVoucher?.type === "RECEIPT", "Voucher type is RECEIPT");
const currYear = new Date().getFullYear();
assert(
  Boolean(res1.newVoucher?.voucherNumber.match(new RegExp(`^RV-SRV-${currYear}-\\d{4}$`))),
  `Voucher number matches RV-SRV-${currYear}-XXXX format (got: ${res1.newVoucher?.voucherNumber})`
);

// [Test 3] Financial Amounts & 5% VAT Calculation
console.log("\n[Test 3] Financial Amounts & 5% VAT Calculation Check");
// subtotal = 100, discount = 10 -> taxableAmount = 90 -> taxAmount = 4.5 -> totalAmount = 94.5
assert(res1.newVoucher?.subtotal === 100, "Voucher subtotal is 100 OMR");
assert(res1.newVoucher?.discountAmount === 10, "Voucher discount is 10 OMR");
assert(res1.newVoucher?.taxRate === 5, "Voucher tax rate is 5%");
assert(res1.newVoucher?.taxAmount === 4.5, "Voucher 5% tax amount on 90 OMR is 4.5 OMR");
assert(res1.newVoucher?.totalAmount === 94.5, "Voucher total amount is 94.5 OMR");

// [Test 4] Linking Voucher to Service Booking
console.log("\n[Test 4] Linking Voucher to Service Booking");
assert(res1.finalBooking.linkedVoucherId === res1.newVoucher?.id, "finalBooking.linkedVoucherId matches newVoucher.id");
assert(res1.finalBooking.linkedVoucherNumber === res1.newVoucher?.voucherNumber, "finalBooking.linkedVoucherNumber matches newVoucher.voucherNumber");
assert(res1.finalBooking.paymentStatus === "PAID", "finalBooking.paymentStatus is updated to PAID");

// [Test 5] Membership Free Quota (Advisory Category)
console.log("\n[Test 5] Membership Free Quota Deduction (ADVISORY Category)");
const quotaBookingInput: ConfirmServiceBookingInput = {
  ...baseInput,
  newBooking: {
    ...sampleBooking,
    tenantSubscriptionId: "sub-100",
    isCoveredByMembership: true
  }
};
const resQuota = confirmServiceBooking(quotaBookingInput);
assert(resQuota.finalBooking.paymentStatus === "FREE_QUOTA", "Payment status is FREE_QUOTA when membership covered");
assert(resQuota.newVoucher?.totalAmount === 0, "Voucher total amount is 0 OMR when membership covered");
assert(resQuota.newSubQuotaDeducted !== undefined, "Tenant subscription quota object updated");
assert(resQuota.newSubQuotaDeducted?.consultationSessionsUsed === 1, "Increments consultationSessionsUsed from 0 to 1");

// [Test 6] Membership Free Quota (Media Studio Category)
console.log("\n[Test 6] Membership Free Quota Deduction (MEDIA_STUDIO Category)");
const mediaBookingInput: ConfirmServiceBookingInput = {
  ...baseInput,
  newBooking: {
    ...sampleBooking,
    category: "MEDIA_STUDIO",
    tenantSubscriptionId: "sub-100",
    isCoveredByMembership: true
  }
};
const resMedia = confirmServiceBooking(mediaBookingInput);
assert(resMedia.newSubQuotaDeducted?.mediaStudioHoursUsed === 2, "Increments mediaStudioHoursUsed from 1 to 2");

// [Test 7] autoGenerateVoucher = false
console.log("\n[Test 7] Confirm Booking with autoGenerateVoucher = false");
const noVoucherInput: ConfirmServiceBookingInput = {
  ...baseInput,
  autoGenerateVoucher: false
};
const resNoVoucher = confirmServiceBooking(noVoucherInput);
assert(resNoVoucher.newVoucher === undefined, "No voucher generated when autoGenerateVoucher is false");
assert(resNoVoucher.shouldNavigateToPreview === false, "shouldNavigateToPreview is false");
assert(resNoVoucher.auditLogsToCreate.length === 1, "Only 1 audit log created (Booking log)");

// [Test 8] Existing Customer Duplicate Check in CRM
console.log("\n[Test 8] Existing Customer Duplicate Check in CRM");
const existingCust: Customer = {
  id: "cust-50",
  name: "سعيد بن محمد المعمري",
  phone: "+96894444444",
  email: "said@example.om",
  type: "CORPORATE",
  status: "ACTIVE",
  createdAt: "",
  updatedAt: ""
};
const inputWithCust: ConfirmServiceBookingInput = {
  ...baseInput,
  customersList: [existingCust]
};
const resWithCust = confirmServiceBooking(inputWithCust);
assert(resWithCust.newCustomerCreated === undefined, "No new customer created when matching customer exists");
assert(resWithCust.updatedCustomers.length === 1, "Customers list length remains unchanged");

// [Test 9] New Customer Creation in CRM
console.log("\n[Test 9] New Customer Creation in CRM");
assert(res1.newCustomerCreated !== undefined, "Creates new Customer object when not in CRM");
assert(res1.newCustomerCreated?.name === "سعيد بن محمد المعمري", "New customer has correct name");
assert(res1.newCustomerCreated?.type === "CORPORATE", "Customer type is CORPORATE due to companyName presence");
assert(res1.updatedCustomers.length === 1, "New customer prepended to updatedCustomers list");

// [Test 10] Audit Log Payloads Generation
console.log("\n[Test 10] Audit Log Payloads Generation Check");
assert(res1.auditLogsToCreate.length === 2, "Generates 2 audit logs (Voucher + Booking)");
assert(res1.auditLogsToCreate[0].module === "VOUCHERS", "First log module is VOUCHERS");
assert(res1.auditLogsToCreate[0].entityId === res1.newVoucher?.id, "First log entityId matches voucher ID");
assert(res1.auditLogsToCreate[1].entityId === res1.finalBooking.id, "Second log entityId matches booking ID");

// [Test 11] Immutability Check
console.log("\n[Test 11] Immutability Check");
assert(sampleBooking.paymentStatus === "UNPAID", "Original sampleBooking paymentStatus remains UNPAID");
assert(sampleSubscription.consultationSessionsUsed === 0, "Original sampleSubscription sessions remain 0");
assert(baseInput.vouchersList.length === 0, "Original vouchersList length is unmutated");

// [Test 12] Edge Case Defaulting
console.log("\n[Test 12] Edge Case Defaulting Check");
const fallbackBooking: ServiceBooking = {
  ...sampleBooking,
  currency: undefined
};
const fallbackInput: ConfirmServiceBookingInput = {
  ...baseInput,
  newBooking: fallbackBooking,
  userName: undefined
};
const resFallback = confirmServiceBooking(fallbackInput);
assert(resFallback.newVoucher?.currency === "OMR", "Defaults missing currency to company default (OMR)");
assert(resFallback.newVoucher?.preparedBy === "النظام الذكي", "Defaults missing userName to 'النظام الذكي'");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
