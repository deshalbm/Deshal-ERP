import { EmployeeRequest } from '../../types';

export interface WorkRequestPort {
  createRequest(requestPayload: Partial<EmployeeRequest> & { typeId: string; requesterId: string }): Promise<EmployeeRequest>;
}
