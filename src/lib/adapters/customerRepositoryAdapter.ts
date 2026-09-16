import { CustomerRepositoryPort } from "../../application/ports/customerRepositoryPort";
import { loadCustomers, saveCustomers } from "../../utils/storage/customersStorage";

export const defaultCustomerRepositoryAdapter: CustomerRepositoryPort = {
  loadCustomers,
  saveCustomers
};
