import { settleLeaseDeposit, SettleLeaseDepositInput } from "../application/contracts/settleLeaseDeposit";
import { LeaseContract, ReceiptVoucher, CompanySettings } from "../types";

console.log("\n================================================================");
console.log("  DESHAL ERP — SETTLE LEASE DEPOSIT USE CASE UNIT TEST SUITE");
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
  termsAndConditions: "تم تسوية التأمين وإخلاء طرف المستأجر بموجب محضر المعاينة المعتمد.",
  authorizedSignatoryName: "مدير التأجير",
  authorizedSignatoryTitle: "مدير قسم العقارات",
  signatureImageUrl: "",
  stampImageUrl: "",
  bankDetails: { bankName: "بنك مسقط", accountName: "ديشال", accountNumber: "456", iban: "OM456", swiftCode: "BOM" },
  defaultCustomFields: [],
  qrCodeContent: "",
  defaultCurrency: "OMR"
};

const sampleContract: LeaseContract = {
  id: "lc-300",
  contractNumber: "LC-2026-099",
  titleAr: "عقد إيجار مكتب تنفيذي 301",
  contractType: "COMMERCIAL_OFFICE",
  status: "ACTIVE",
  lessorCompanyName: "شركة ديشال العقارية",
  lessorCrNumber: "CR-99999",
  lessorTaxNumber: "OM-TAX-999",
  lessorRepresentative: "المدير العام",
  lessorPhone: "+96899999999",
  lessorEmail: "realestate@deshalbm.com",
  lessorAddress: "مسقط",
  tenantName: "شركة البناء المتطورة",
  tenantType: "CORPORATE",
  tenantSignatoryName: "محمود بن سعيد",
  tenantPhone: "+96897777777",
  tenantEmail: "info@albinaa.om",
  tenantAddress: "مسقط - العذيبة",
  tenantTaxNumber: "OM-TAX-888",
  spaceId: "sp-301",
  spaceCode: "EXEC-301",
  spaceName: "المكتب التنفيذي 301",
  spaceType: "PRIVATE_OFFICE",
  branchId: "branch-sohar",
  branchName: "فرع صحار الرئيسي",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  durationMonths: 12,
  noticePeriodDays: 30,
  autoRenew: false,
  totalRentAmount: 12000,
  discountAmount: 0,
  taxRate: 5,
  taxAmount: 600,
  finalContractValue: 12600,
  currency: "OMR",
  paymentFrequency: "MONTHLY",
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
    depositAmount: 1000,
    currency: "OMR",
    status: "FULLY_REFUNDED",
    refundedAmount: 1000
  },
  installments: [],
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

const baseInput: SettleLeaseDepositInput = {
  contract: sampleContract,
  refundData: { amount: 1000 },
  leaseContractsList: [sampleContract],
  vouchersList: [],
  companySettings: mockSettings,
  activeBranchId: "branch-sohar",
  userName: "سالم المدير"
};

// [Test 1] Positive refund amount creates a PAYMENT voucher
console.log("[Test 1] Positive refund amount creates a PAYMENT voucher");
const res1 = settleLeaseDeposit(baseInput);
assert(res1.refundVoucher !== undefined, "Creates a new refund ReceiptVoucher object");
assert(res1.refundVoucher?.type === "PAYMENT", "Generated voucher is of type PAYMENT");

// [Test 2] Voucher number follows PV-DEP-YYYY-XXXX format
console.log("\n[Test 2] Voucher number format check PV-DEP-YYYY-XXXX");
const currYear = new Date().getFullYear();
assert(
  Boolean(res1.refundVoucher?.voucherNumber.match(new RegExp(`^PV-DEP-${currYear}-\\d{4}$`))),
  `Voucher number matches PV-DEP-${currYear}-XXXX format (got: ${res1.refundVoucher?.voucherNumber})`
);

// [Test 3] Voucher tax rate remains 0%
console.log("\n[Test 3] Voucher tax rate check");
assert(res1.refundVoucher?.taxRate === 0, "Voucher tax rate is 0%");
assert(res1.refundVoucher?.taxAmount === 0, "Voucher tax amount is 0 OMR");

// [Test 4] Voucher category remains exact
console.log("\n[Test 4] Voucher category check");
assert(res1.refundVoucher?.category === "أمانات وتأمينات المستأجرين المستردة", "Category equals 'أمانات وتأمينات المستأجرين المستردة'");

// [Test 5] Voucher total/amount calculations check
console.log("\n[Test 5] Amount calculation check");
assert(res1.refundVoucher?.amount === 1000, "Voucher amount equals 1000 OMR");
assert(res1.refundVoucher?.subtotal === 1000, "Voucher subtotal equals 1000 OMR");
assert(res1.refundVoucher?.totalAmount === 1000, "Voucher total amount equals 1000 OMR");
assert(res1.refundVoucher?.currency === "OMR", "Voucher currency is OMR");

// [Test 6] Zero refund amount produces NO voucher
console.log("\n[Test 6] Zero refund amount handling");
const zeroInput: SettleLeaseDepositInput = {
  ...baseInput,
  refundData: { amount: 0 }
};
const resZero = settleLeaseDeposit(zeroInput);
assert(resZero.refundVoucher === undefined, "No refund voucher created when refund amount is 0");
assert(resZero.updatedVouchers.length === 0, "updatedVouchers length remains unchanged");

// [Test 7] refundData undefined produces NO voucher
console.log("\n[Test 7] refundData undefined handling");
const undefinedInput: SettleLeaseDepositInput = {
  ...baseInput,
  refundData: undefined
};
const resUndefined = settleLeaseDeposit(undefinedInput);
assert(resUndefined.refundVoucher === undefined, "No refund voucher created when refundData is undefined");
assert(resUndefined.updatedVouchers.length === 0, "updatedVouchers length remains unchanged");

// [Test 8] Updated lease contract is included immutably in updatedLeaseContracts
console.log("\n[Test 8] Contract immutability in updatedLeaseContracts");
assert(res1.updatedLeaseContracts.length === 1, "updatedLeaseContracts maintains same length");
assert(res1.updatedLeaseContracts[0] === res1.updatedContract, "updatedLeaseContracts contains updated contract object");

// [Test 9] Original contract and input arrays are not mutated
console.log("\n[Test 9] Immutability check");
assert(baseInput.vouchersList.length === 0, "Original vouchersList is unmutated");
assert(baseInput.leaseContractsList[0] === sampleContract, "Original contract reference in list is unmutated");

// [Test 10] New voucher insertion order matches existing behavior (prepended)
console.log("\n[Test 10] Voucher insertion order check");
const dummyVoucher: ReceiptVoucher = { ...res1.refundVoucher!, id: "pv-existing" };
const multiVoucherInput: SettleLeaseDepositInput = {
  ...baseInput,
  vouchersList: [dummyVoucher]
};
const resMulti = settleLeaseDeposit(multiVoucherInput);
assert(resMulti.updatedVouchers.length === 2, "updatedVouchers contains 2 vouchers");
assert(resMulti.updatedVouchers[0].id === resMulti.refundVoucher?.id, "New refund voucher is prepended at index 0");
assert(resMulti.updatedVouchers[1].id === "pv-existing", "Existing voucher remains at index 1");

// [Test 11] Audit payload checks
console.log("\n[Test 11] Audit payload check");
assert(res1.auditLogToCreate.action === "UPDATE", "Audit action is UPDATE");
assert(res1.auditLogToCreate.module === "VOUCHERS", "Audit module is VOUCHERS");
assert(res1.auditLogToCreate.entityId === sampleContract.id, "Audit entityId matches contract ID");
assert(res1.auditLogToCreate.entityName === sampleContract.contractNumber, "Audit entityName matches contract number");
assert(res1.auditLogToCreate.descAr.includes(sampleContract.contractNumber), "Arabic desc mentions contract number");
assert(res1.auditLogToCreate.descEn.includes(sampleContract.contractNumber), "English desc mentions contract number");

// [Test 12] Currency fallback behavior check
console.log("\n[Test 12] Currency fallback check");
assert(res1.refundVoucher?.currency === "OMR", "Currency is fixed to OMR as in original handler");

// [Test 13] userName fallback behavior check
console.log("\n[Test 13] userName fallback check");
const fallbackInput: SettleLeaseDepositInput = {
  ...baseInput,
  userName: undefined
};
const resFallback = settleLeaseDeposit(fallbackInput);
assert(resFallback.refundVoucher?.preparedBy === "مدير التأجير", "Defaults missing userName to 'مدير التأجير'");

console.log("\n================================================================");
console.log(`  RESULTS: Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
console.log("================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
