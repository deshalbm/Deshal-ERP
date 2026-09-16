import { collectLeaseInstallment, CollectLeaseInstallmentInput } from "../application/contracts/collectLeaseInstallment";
import { LeaseContract, PaymentInstallment, ReceiptVoucher, CompanySettings } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — COLLECT LEASE INSTALLMENT USE CASE UNIT TEST SUITE");
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
  companyName: "شركة ديشال العقارية",
  tagline: "إدارة العقارات والمساحات",
  logoUrl: "",
  logoWidth: 140,
  taxId: "OM-TAX-999",
  crNumber: "CR-99999",
  address: "مسقط",
  cityStateZip: "مسقط",
  country: "عُمان",
  phone: "+96899999999",
  email: "realestate@deshalbm.com",
  website: "https://deshalbm.com",
  headerNotice: "",
  footerNotice: "",
  termsAndConditions: "يعتبر هذا المستند إشعاراً رسمياً وسند قبض معتمد قانونياً.",
  authorizedSignatoryName: "مدير التأجير",
  authorizedSignatoryTitle: "مدير قسم العقارات",
  signatureImageUrl: "",
  stampImageUrl: "",
  bankDetails: { bankName: "بنك مسقط", accountName: "ديشال", accountNumber: "456", iban: "OM456", swiftCode: "BOM" },
  defaultCustomFields: [],
  qrCodeContent: "",
  defaultCurrency: "OMR"
};

const sampleInstallment: PaymentInstallment = {
  id: "inst-101",
  installmentNumber: 1,
  titleAr: "الدفعة الأولى - الإيجار السنوي",
  dueDate: "2026-10-01",
  amount: 500,
  taxRate: 5,
  taxAmount: 25,
  totalAmount: 525,
  currency: "OMR",
  status: "PENDING"
};

const sampleContract: LeaseContract = {
  id: "lc-200",
  contractNumber: "LC-2026-001",
  titleAr: "عقد إيجار مكتب تجاري 502",
  contractType: "COMMERCIAL_OFFICE",
  status: "ACTIVE",
  lessorCompanyName: "شركة ديشال العقارية",
  lessorCrNumber: "CR-99999",
  lessorTaxNumber: "OM-TAX-999",
  lessorRepresentative: "المدير العام",
  lessorPhone: "+96899999999",
  lessorEmail: "realestate@deshalbm.com",
  lessorAddress: "مسقط",
  tenantName: "شركة الأمل للتجارة",
  tenantType: "CORPORATE",
  tenantSignatoryName: "أحمد رئيس المجلس",
  tenantPhone: "+96898888888",
  tenantEmail: "info@alamal.om",
  tenantAddress: "مسقط - الخوير",
  tenantTaxNumber: "OM-TAX-777",
  spaceId: "sp-5",
  spaceCode: "OFFICE-502",
  spaceName: "المكتب التجاري 502",
  spaceType: "PRIVATE_OFFICE",
  branchId: "branch-muscat",
  branchName: "فرع مسقط الرئيسي",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  durationMonths: 12,
  noticePeriodDays: 30,
  autoRenew: false,
  totalRentAmount: 6000,
  discountAmount: 0,
  taxRate: 5,
  taxAmount: 300,
  finalContractValue: 6300,
  currency: "OMR",
  paymentFrequency: "ANNUAL",
  includedAmenities: {
    highSpeedInternet: true,
    electricityAndWater: true,
    centralAirConditioning: true,
    dailyCleaningService: true,
    receptionAndMailHandling: true,
    smartAccessControl: true,
    maintenanceSupport: true,
    beverageAndCoffeeStation: true
  },
  securityDeposit: {
    depositAmount: 500,
    currency: "OMR",
    status: "HELD_IN_CUSTODY"
  },
  installments: [sampleInstallment],
  monthlyFreeMeetingRoomHours: 0,
  monthlyFreeMediaStudioHours: 0,
  monthlyFreeConsultations: 0,
  tenantDiscountOnExtraServicesPercent: 0,
  clauses: [],
  isDigitallySigned: false,
  documents: [],
  preparedByName: "مدير التأجير",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z"
};

const baseInput: CollectLeaseInstallmentInput = {
  contract: sampleContract,
  installment: sampleInstallment,
  leaseContractsList: [sampleContract],
  vouchersList: [],
  companySettings: mockSettings,
  activeBranchId: "branch-muscat",
  userName: "سالم الموظف"
};

// [Test 1] Collect pending installment successfully
console.log("[Test 1] Collect pending installment successfully");
const res1 = collectLeaseInstallment(baseInput);
assert(res1.updatedContract.id === "lc-200", "Preserves lease contract ID");
assert(res1.shouldNavigateToPreview === true, "Sets shouldNavigateToPreview flag to true");

// [Test 2] Installment status changes to PAID
console.log("\n[Test 2] Installment status updated to PAID");
const collectedInst = res1.updatedContract.installments.find(i => i.id === "inst-101");
assert(collectedInst !== undefined, "Collected installment exists in contract");
assert(collectedInst?.status === "PAID", "Installment status changed from PENDING to PAID");
assert(collectedInst?.paidDate === new Date().toISOString().split("T")[0], "paidDate is set to today's date");

// [Test 3] Lease Contract correctly updated
console.log("\n[Test 3] Lease Contract updatedAt refreshed");
assert(res1.updatedContract.updatedAt !== sampleContract.updatedAt, "Lease contract updatedAt timestamp is refreshed");

// [Test 4] leaseContractsList updated immutably
console.log("\n[Test 4] leaseContractsList update check");
assert(res1.updatedLeaseContracts.length === 1, "updatedLeaseContracts maintains same length");
assert(res1.updatedLeaseContracts[0] === res1.updatedContract, "updatedLeaseContracts contains updated contract object");

// [Test 5] Receipt Voucher Creation
console.log("\n[Test 5] Receipt Voucher Creation");
assert(res1.newVoucher !== undefined, "Creates new ReceiptVoucher");
assert(res1.newVoucher.type === "RECEIPT", "Voucher type is RECEIPT");
assert(res1.newVoucher.receivedFrom === "شركة الأمل للتجارة", "Voucher receivedFrom matches tenantName");
assert(res1.updatedVouchers.length === 1, "Voucher prepended to updatedVouchers list");

// [Test 6] Voucher Numbering Preservation (RV-LEAS-YYYY-XXXX)
console.log("\n[Test 6] Voucher Numbering Format RV-LEAS-YYYY-XXXX");
const currYear = new Date().getFullYear();
assert(
  Boolean(res1.newVoucher.voucherNumber.match(new RegExp(`^RV-LEAS-${currYear}-\\d{4}$`))),
  `Voucher number matches RV-LEAS-${currYear}-XXXX format (got: ${res1.newVoucher.voucherNumber})`
);

// [Test 7] Financial amounts & 5% VAT calculation preservation
console.log("\n[Test 7] Financial Amounts & VAT Math Check");
assert(res1.newVoucher.subtotal === 500, "Voucher subtotal equals 500 OMR");
assert(res1.newVoucher.taxRate === 5, "Voucher tax rate is 5%");
assert(res1.newVoucher.taxAmount === 25, "Voucher tax amount is 25 OMR");
assert(res1.newVoucher.totalAmount === 525, "Voucher total amount is 525 OMR");
assert(res1.newVoucher.currency === "OMR", "Voucher currency is OMR");

// [Test 8] Voucher Linkage with Lease Contract and Installment
console.log("\n[Test 8] Voucher Linkage Check");
assert(collectedInst?.linkedVoucherId === res1.newVoucher.id, "Installment linkedVoucherId matches newVoucher.id");
assert(collectedInst?.linkedVoucherNumber === res1.newVoucher.voucherNumber, "Installment linkedVoucherNumber matches newVoucher.voucherNumber");
assert(res1.newVoucher.referenceNo === "LC-2026-001", "Voucher referenceNo matches contractNumber");

// [Test 9] Audit Log Payload Generation
console.log("\n[Test 9] Audit Log Payload Check");
assert(res1.auditLogToCreate.action === "CREATE", "Audit action is CREATE");
assert(res1.auditLogToCreate.module === "VOUCHERS", "Audit module is VOUCHERS");
assert(res1.auditLogToCreate.entityId === res1.newVoucher.id, "Audit entityId matches voucher ID");
assert(res1.auditLogToCreate.entityName === res1.newVoucher.voucherNumber, "Audit entityName matches voucher number");
assert(res1.auditLogToCreate.descAr.includes("LC-2026-001"), "Arabic description mentions contract number");
assert(res1.auditLogToCreate.descEn.includes("LC-2026-001"), "English description mentions contract number");

// [Test 10] Immutability Check - original objects untouched
console.log("\n[Test 10] Immutability Check");
assert(sampleContract.installments[0].status === "PENDING", "Original contract installment status remains PENDING");
assert(sampleContract.installments[0].linkedVoucherId === undefined, "Original installment linkedVoucherId remains undefined");
assert(baseInput.leaseContractsList[0].updatedAt === "2026-01-01T00:00:00Z", "Original lease contract list item is unmutated");
assert(baseInput.vouchersList.length === 0, "Original vouchersList length is unmutated");

// [Test 11] Edge Case Defaulting (Missing Currency, Tax, UserName)
console.log("\n[Test 11] Edge Case Defaulting Check");
const fallbackInstallment: PaymentInstallment = {
  ...sampleInstallment,
  currency: undefined,
  taxRate: undefined,
  taxAmount: undefined
};
const fallbackContract: LeaseContract = {
  ...sampleContract,
  installments: [fallbackInstallment]
};
const fallbackInput: CollectLeaseInstallmentInput = {
  contract: fallbackContract,
  installment: fallbackInstallment,
  leaseContractsList: [fallbackContract],
  vouchersList: [],
  companySettings: mockSettings,
  activeBranchId: "branch-default",
  userName: undefined
};
const resFallback = collectLeaseInstallment(fallbackInput);
assert(resFallback.newVoucher.currency === "OMR", "Defaults missing currency to OMR");
assert(resFallback.newVoucher.taxRate === 5, "Defaults missing taxRate to 5%");
assert(resFallback.newVoucher.taxAmount === 0, "Defaults missing taxAmount to 0");
assert(resFallback.newVoucher.preparedBy === "مدير التأجير", "Defaults missing userName to 'مدير التأجير'");

// [Test 12] Multiple Vouchers List Prepending
console.log("\n[Test 12] Multiple Vouchers List Prepending");
const dummyVoucher = { ...res1.newVoucher, id: "rv-existing-1" };
const multiVoucherInput: CollectLeaseInstallmentInput = {
  ...baseInput,
  vouchersList: [dummyVoucher]
};
const resMulti = collectLeaseInstallment(multiVoucherInput);
assert(resMulti.updatedVouchers.length === 2, "updatedVouchers contains 2 vouchers");
assert(resMulti.updatedVouchers[0].id === resMulti.newVoucher.id, "New voucher is prepended at index 0");
assert(resMulti.updatedVouchers[1].id === "rv-existing-1", "Existing voucher remains at index 1");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
