import { Customer } from "../../types";

export interface CustomerRepositoryPort {
  loadCustomers: () => Customer[];
  saveCustomers: (customers: Customer[]) => void;
}
