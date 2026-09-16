import type { CustomerServicePort } from '../../application/ports/customerServicePort';
import type { Customer } from '../../types';
import {
  upsertCustomer as supabaseUpsertCustomer,
  checkPhoneExists as supabaseCheckPhoneExists,
  findCustomerByPhone as supabaseFindCustomerByPhone,
  normalizePhone as supabaseNormalizePhone,
} from '../supabase/customerService';

export const defaultCustomerServiceAdapter: CustomerServicePort = {
  upsertCustomer(customer, companyId, allowDuplicatePhone) {
    return supabaseUpsertCustomer(customer, companyId, allowDuplicatePhone);
  },
  checkPhoneExists(companyId, phone, excludeId) {
    return supabaseCheckPhoneExists(companyId, phone, excludeId);
  },
  findCustomerByPhone(companyId, phone) {
    return supabaseFindCustomerByPhone(companyId, phone);
  },
  normalizePhone(phone) {
    return supabaseNormalizePhone(phone);
  }
};
