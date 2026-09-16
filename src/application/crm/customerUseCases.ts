import type { CustomerServicePort } from '../ports/customerServicePort';
import type { Customer } from '../../types';

export async function saveCustomer(
  customer: Customer,
  companyId: string,
  allowDuplicatePhone = false,
  adapter?: CustomerServicePort
): Promise<{ success: boolean; data?: Customer; customer?: Customer; error?: string; message?: string }> {
  if (!adapter) return { success: false, error: 'Customer service adapter not provided.' };
  return adapter.upsertCustomer(customer, companyId, allowDuplicatePhone);
}

export async function checkCustomerPhoneAvailability(
  companyId: string,
  phone: string,
  excludeId?: string,
  adapter?: CustomerServicePort
): Promise<boolean> {
  if (!adapter) return false;
  return adapter.checkPhoneExists(companyId, phone, excludeId);
}

export async function getCustomerByPhone(
  companyId: string,
  phone: string,
  adapter?: CustomerServicePort
): Promise<Customer | null> {
  if (!adapter) return null;
  return adapter.findCustomerByPhone(companyId, phone);
}

export function formatNormalizedPhone(
  phone: string,
  adapter?: CustomerServicePort
): string {
  if (!adapter) return phone;
  return adapter.normalizePhone(phone);
}
