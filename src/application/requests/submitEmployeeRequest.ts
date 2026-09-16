import { WorkRequestPort } from '../ports/workRequestPort';
import { EmployeeRequest } from '../../types';

export async function submitEmployeeRequest(
  requestPayload: Partial<EmployeeRequest> & { typeId: string; requesterId: string },
  adapter?: WorkRequestPort
): Promise<EmployeeRequest | null> {
  if (!adapter) return null;
  return adapter.createRequest(requestPayload);
}
