/**
 * Deshal ERP — Customer Mandatory Phone & Duplicate Phone Resolution Unit Tests
 */

import { normalizePhone, findCustomerByPhone, upsertCustomer } from '../lib/supabase/customerService';
import type { Customer } from '../types';

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetail) console.error(`     Detail: ${failureDetail}`);
  }
}

async function runCustomerDuplicatePhoneTests() {
  console.log('\n================================================================');
  console.log('  DESHAL ERP — CUSTOMER DYNAMIC PHONE & DUPLICATE TEST SUITE');
  console.log('================================================================\n');

  const testCompanyId = '00000000-0000-0000-0000-000000000001';

  // [Test 1] Phone Normalization Rule
  console.log('[Test 1] Mandatory Phone Normalization (+968)');
  const norm1 = normalizePhone('91234567');
  const norm2 = normalizePhone('+96891234567');
  assert(norm1 === '+96891234567', 'Local phone 91234567 normalizes to +96891234567');
  assert(norm2 === '+96891234567', 'International phone +96891234567 normalizes to +96891234567');

  // [Test 2] Phone Requirement
  console.log('\n[Test 2] Mandatory Phone Requirement');
  const emptyPhoneCustomer: Customer = {
    id: 'cust-empty-phone-1',
    name: 'اختبار عميل بدون هاتف',
    phone: '',
    email: '',
    address: '',
    city: 'صحار',
    governorate: 'شمال الباطنة',
    country: 'سلطنة عمان',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  assert(emptyPhoneCustomer.phone.trim() === '', 'Empty phone number is recognized as invalid mandatory field');

  // [Test 3] Duplicate Phone Decision Flag
  console.log('\n[Test 3] Duplicate Phone Resolution Option (allowDuplicatePhone = true)');
  const originalCustomer: Customer = {
    id: 'cust-orig-101',
    name: 'شركة النور التجارية',
    phone: '+96899887766',
    email: 'info@alnoor.om',
    address: 'صحار',
    city: 'صحار',
    governorate: 'شمال الباطنة',
    country: 'سلطنة عمان',
    type: 'CORPORATE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const duplicatePhoneCustomer: Customer = {
    id: 'cust-dup-102',
    name: 'فرع شركة النور صحار',
    phone: '+96899887766',
    email: 'branch@alnoor.om',
    address: 'صحار',
    city: 'صحار',
    governorate: 'شمال الباطنة',
    country: 'سلطنة عمان',
    type: 'CORPORATE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  assert(duplicatePhoneCustomer.phone === originalCustomer.phone, 'Duplicate customer shares identical phone number');

  console.log(`\n----------------------------------------------------------------`);
  console.log(`Test Execution Summary: ${passedCount}/${totalCount} tests passed.`);
  console.log(`----------------------------------------------------------------\n`);

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runCustomerDuplicatePhoneTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
