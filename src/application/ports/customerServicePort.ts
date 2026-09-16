import type { Customer } from '../../types';

export interface CustomerServicePort {
  upsertCustomer(
    customer: Customer,
    companyId: string,
    allowDuplicatePhone?: boolean
  ): Promise<{ success: boolean; data?: Customer; customer?: Customer; error?: string; message?: string }>;

  checkPhoneExists(companyId: string, phone: string, excludeId?: string): Promise<boolean>;

  findCustomerByPhone(companyId: string, phone: string): Promise<Customer | null>;

  normalizePhone(phone: string): string;
}
