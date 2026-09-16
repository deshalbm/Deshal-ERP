import { confirmSpaceBooking, ConfirmSpaceBookingInput } from "../application/spaces/confirmSpaceBooking";
import { SpaceBooking, Customer, CompanySettings } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — CONFIRM SPACE BOOKING USE CASE UNIT TEST SUITE");
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
  companyName: "شركة ديشال",
  tagline: "حلول تقنية",
  logoUrl: "",
  logoWidth: 140,
  taxId: "OM-TAX-001",
  crNumber: "CR-12345",
  address: "صحار",
  cityStateZip: "صحار",
  country: "عُمان",
  phone: "+96877627500",
  email: "info@deshalbm.com",
  website: "https://deshalbm.com",
  headerNotice: "",
  footerNotice: "",
  termsAndConditions: "الشروط والأنظمة",
  authorizedSignatoryName: "المدير العام",
  authorizedSignatoryTitle: "مدير تنفيذي",
  signatureImageUrl: "",
  stampImageUrl: "",
  bankDetails: { bankName: "بنك مسقط", accountName: "ديشال", accountNumber: "123", iban: "OM123", swiftCode: "BOM" },
  defaultCustomFields: [],
  qrCodeContent: "",
  defaultCurrency: "OMR"
};

const sampleBooking: SpaceBooking = {
  id: "bk-100",
  bookingNumber: "BK-2026-008",
  spaceId: "sp-1",
  spaceName: "قاعة الابتكار الرئيسية",
  spaceType: "TRAINING_HALL",
  branchId: "branch-sohar",
  branchName: "فرع صحار الرئيسي",
  customerName: "علي بن سالم البلوشي",
  customerPhone: "+96891234567",
  customerEmail: "ali@example.com",
  customerCompany: "شركة الابتكار الرقمية",
  rentalType: "HOURLY",
  startDate: "2026-09-10",
  endDate: "2026-09-10",
  duration: 4,
  unitPrice: 20,
  subtotal: 80,
  discountAmount: 0,
  taxAmount: 4,
  totalAmount: 84,
  currency: "OMR",
  purpose: "ورشة عمل تقنية",
  status: "CONFIRMED",
  paymentStatus: "UNPAID",
  createdByType: "STAFF",
  createdAt: "2026-09-09T10:00:00Z",
  updatedAt: "2026-09-09T10:00:00Z"
};

const baseInput: ConfirmSpaceBookingInput = {
  newBooking: sampleBooking,
  autoGenerateVoucher: true,
  vouchersList: [],
  spaceBookingsList: [],
  customersList: [],
  companySettings: mockSettings,
  activeBranchId: "branch-sohar",
  userName: "أحمد الموظف"
};

// [Test 1] Confirmation with autoGenerateVoucher = true
console.log("[Test 1] Confirm Booking with Auto Voucher Generation");
const res1 = confirmSpaceBooking(baseInput);
assert(res1.finalBooking.id === "bk-100", "Preserves booking ID");
assert(res1.updatedBookings.length === 1, "Adds booking to updatedBookings list");

// [Test 2] Receipt Voucher Creation
console.log("\n[Test 2] Receipt Voucher Creation");
assert(res1.newVoucher !== undefined, "Generates a new ReceiptVoucher object");
assert(res1.newVoucher?.type === "RECEIPT", "Generated voucher is of type RECEIPT");
assert(res1.updatedVouchers.length === 1, "Voucher prepended to updatedVouchers list");

// [Test 3] Voucher Number Format RV-SP-YYYY-XXXX
console.log("\n[Test 3] Voucher Number Format Check");
const currYear = new Date().getFullYear();
assert(
  Boolean(res1.newVoucher?.voucherNumber.match(new RegExp(`^RV-SP-${currYear}-\\d{4}$`))),
  `Voucher number matches RV-SP-${currYear}-XXXX format (got: ${res1.newVoucher?.voucherNumber})`
);

// [Test 4] VAT = 5% Math Check
console.log("\n[Test 4] VAT 5% Tax Calculation Check");
assert(res1.newVoucher?.taxRate === 5, "Voucher tax rate is 5%");
assert(res1.newVoucher?.taxAmount === 4, "Voucher tax amount equals 4 OMR (5% of 80 OMR)");

// [Test 5] Subtotal and Total Calculation Check
console.log("\n[Test 5] Subtotal & Total Amount Calculation");
assert(res1.newVoucher?.subtotal === 80, "Subtotal equals 80 OMR");
assert(res1.newVoucher?.totalAmount === 84, "Total amount equals 84 OMR (80 + 4)");

// [Test 6] Linking Voucher to Booking
console.log("\n[Test 6] Linking Voucher to Booking Entity");
assert(res1.finalBooking.linkedVoucherId === res1.newVoucher?.id, "finalBooking.linkedVoucherId matches newVoucher.id");
assert(res1.finalBooking.linkedVoucherNumber === res1.newVoucher?.voucherNumber, "finalBooking.linkedVoucherNumber matches newVoucher.voucherNumber");

// [Test 7] Payment Status Updated to PAID
console.log("\n[Test 7] Booking Payment Status Updated to PAID");
assert(res1.finalBooking.paymentStatus === "PAID", "finalBooking.paymentStatus is updated to PAID");

// [Test 8 & 9] autoGenerateVoucher = false
console.log("\n[Test 8 & 9] Confirm Booking with autoGenerateVoucher = false");
const inputNoVoucher: ConfirmSpaceBookingInput = { ...baseInput, autoGenerateVoucher: false };
const resNoVoucher = confirmSpaceBooking(inputNoVoucher);
assert(resNoVoucher.newVoucher === undefined, "No voucher object generated");
assert(resNoVoucher.finalBooking.paymentStatus === "UNPAID", "Payment status remains UNPAID");
assert(resNoVoucher.shouldNavigateToPreview === false, "shouldNavigateToPreview is false");

// [Test 10] Existing Customer Lookup (No Duplicate)
console.log("\n[Test 10] Existing Customer Lookup (Prevent Duplicates)");
const existingCust: Customer = {
  id: "cust-99",
  name: "علي بن سالم البلوشي",
  phone: "+96891234567",
  email: "ali@example.com",
  type: "CORPORATE",
  status: "ACTIVE",
  createdAt: "",
  updatedAt: ""
};
const inputExistingCust: ConfirmSpaceBookingInput = { ...baseInput, customersList: [existingCust] };
const resExistingCust = confirmSpaceBooking(inputExistingCust);
assert(resExistingCust.newCustomerCreated === undefined, "No new customer created when name & phone match");
assert(resExistingCust.updatedCustomers.length === 1, "Customer list length remains unchanged");

// [Test 11] New Customer Creation When Missing
console.log("\n[Test 11] New Customer Creation When Missing in CRM");
assert(res1.newCustomerCreated !== undefined, "New Customer object created when missing in CRM");
assert(res1.newCustomerCreated?.name === "علي بن سالم البلوشي", "New customer has correct name");
assert(res1.newCustomerCreated?.type === "CORPORATE", "Customer type is CORPORATE based on company presence");
assert(res1.updatedCustomers.length === 1, "New customer prepended to updatedCustomers list");

// [Test 12] Audit Logs Payload Generation
console.log("\n[Test 12] Exact Audit Logs Payload Generation");
assert(res1.auditLogsToCreate.length === 2, "Generates 2 audit log entries (Voucher + Booking)");
assert(res1.auditLogsToCreate[0].module === "VOUCHERS", "First log module is VOUCHERS");
assert(res1.auditLogsToCreate[1].entityId === "bk-100", "Second log entity ID matches booking ID");

// [Test 13] shouldNavigateToPreview Behavior
console.log("\n[Test 13] shouldNavigateToPreview Flag Check");
assert(res1.shouldNavigateToPreview === true, "shouldNavigateToPreview is true when voucher is auto-generated");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
