import { WorkRequestPort } from '../../application/ports/workRequestPort';
import { EmployeeRequest } from '../../types';
import { createEmployeeRequest, loadRequestTypes } from '../../utils/requestsStorage';
import { loadEmployees } from '../../utils/storage/employeesStorage';

export const defaultWorkRequestAdapter: WorkRequestPort = {
  createRequest(payload: Partial<EmployeeRequest> & { typeId: string; requesterId: string }): Promise<EmployeeRequest> {
    const types = loadRequestTypes();
    const typeConfig = types.find(t => t.id === payload.typeId) || {
      id: payload.typeId,
      code: 'REQ-GEN',
      nameAr: payload.typeNameAr || 'طلب عام',
      nameEn: payload.typeNameEn || 'General Request',
      category: payload.typeCategory || 'ADMINISTRATIVE',
      slaHours: 24,
      defaultPriority: 'MEDIUM',
      isAutoApproved: false,
      requiresApproval: true,
      fields: [],
      workflowStages: []
    } as any;

    const employees = loadEmployees();
    const employee = employees.find(e => e.id === payload.requesterId) || {
      id: payload.requesterId || 'emp-curr',
      employeeCode: 'EMP-001',
      fullName: payload.employeeName || 'الموظف الحالي',
      fullNameEn: 'Current Employee',
      jobTitle: 'موظف',
      department: 'General',
      branchId: 'br-sohar',
      branchName: 'Sohar',
      role: 'EMPLOYEE'
    } as any;

    const attachments = (payload.attachments || []).map((a: any) => ({
      fileName: a.fileName || 'attachment',
      fileSize: a.fileSize || 0,
      fileType: a.fileType || 'application/octet-stream',
      dataUrl: a.dataUrl
    }));

    const result = createEmployeeRequest(
      typeConfig,
      employee,
      payload.values || (payload as any).formData || {},
      attachments
    );

    return Promise.resolve(result);
  }
};
