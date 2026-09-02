import { EmployeeRole } from '../types';

export type RequestCategory =
  | 'DOCUMENTS'
  | 'ADMINISTRATIVE'
  | 'FINANCIAL'
  | 'ASSETS'
  | 'PROCUREMENT'
  | 'HR'
  | 'CUSTOM';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PROCESSING'
  | 'COMPLETED';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'attachment'
  | 'employee'
  | 'department'
  | 'company'
  | 'branch'
  | 'email'
  | 'phone'
  | 'address';

export interface FormFieldOption {
  labelAr: string;
  labelEn: string;
  value: string;
}

export interface FormFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  regexPattern?: string;
  regexErrorMessageAr?: string;
  regexErrorMessageEn?: string;
  allowedFileTypes?: string[];
  maxFileSizeMB?: number;
}

export interface FormFieldConditional {
  dependsOnFieldId: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'IS_NOT_EMPTY';
  value: any;
}

export interface RequestFormField {
  id: string;
  labelAr: string;
  labelEn: string;
  type: FormFieldType;
  required: boolean;
  placeholderAr?: string;
  placeholderEn?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  conditional?: FormFieldConditional;
  order: number;
  helpTextAr?: string;
  helpTextEn?: string;
  width?: 'full' | 'half' | 'third';
}

export type WorkflowApproverType =
  | 'DIRECT_MANAGER'
  | 'DEPARTMENT_MANAGER'
  | 'HR'
  | 'FINANCE'
  | 'ADMINISTRATIVE'
  | 'STOREKEEPER'
  | 'SPECIFIC_ROLE'
  | 'SPECIFIC_USER';

export interface WorkflowStage {
  stageIndex: number;
  stageNameAr: string;
  stageNameEn: string;
  approverType: WorkflowApproverType;
  approverRoleId?: EmployeeRole;
  approverUserId?: string;
  slaHours?: number;
  isFinalApproval?: boolean;
}

export interface RequestTypeConfig {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: RequestCategory;
  icon: string; // Lucide icon identifier
  color: string; // Tailwind color class / hex
  order: number;
  isActive: boolean;
  eligibleRoles?: EmployeeRole[];
  eligibleDepartments?: string[];
  requiresApproval: boolean;
  isAutoApproved: boolean;
  allowsCancellation: boolean;
  allowsResubmit: boolean;
  slaHours: number;
  defaultPriority: RequestPriority;
  fields: RequestFormField[];
  workflowStages: WorkflowStage[];
  documentTemplateId?: string;
  generateDocumentOn?: 'AUTO_APPROVAL' | 'FINAL_APPROVAL' | 'NEVER';
  createdAt: string;
  updatedAt: string;
}

export interface RequestApprovalStageRecord {
  stageIndex: number;
  stageNameAr: string;
  stageNameEn: string;
  approverType: WorkflowApproverType;
  approverRoleId?: EmployeeRole;
  approverUserId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'SKIPPED';
  decisionByUserId?: string;
  decisionByUserName?: string;
  decisionByUserRole?: string;
  decisionAt?: string;
  comments?: string;
  digitalSignatureUrl?: string;
}

export interface RequestTimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  actionLabelAr: string;
  actionLabelEn: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actorAvatar?: string;
  detailsAr: string;
  detailsEn: string;
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;
}

export interface RequestAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface RequestComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface RequestDocument {
  id: string;
  documentNumber: string;
  templateId: string;
  templateNameAr: string;
  templateNameEn: string;
  generatedAt: string;
  verificationCode: string;
  qrPayload: string;
  titleAr: string;
  titleEn: string;
  contentHtml?: string;
  metadata: Record<string, any>;
  officialStampApplied: boolean;
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface EmployeeRequest {
  id: string;
  requestNumber: string; // e.g. REQ-2026-0001
  typeId: string;
  typeCode: string;
  typeNameAr: string;
  typeNameEn: string;
  typeCategory: RequestCategory;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeNameEn?: string;
  employeeJobTitle?: string;
  department: string;
  branchId?: string;
  branchName?: string;
  status: RequestStatus;
  priority: RequestPriority;
  currentStageIndex: number;
  values: Record<string, any>;
  approvals: RequestApprovalStageRecord[];
  timeline: RequestTimelineEvent[];
  attachments: RequestAttachment[];
  comments: RequestComment[];
  generatedDocument?: RequestDocument;
  slaDeadline?: string;
  isSlaBreached?: boolean;
  submittedAt: string;
  completedAt?: string;
  rejectionReason?: string;
  returnedReason?: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  descriptionAr?: string;
  headerTitleAr: string;
  headerTitleEn: string;
  bodyTemplateAr: string;
  bodyTemplateEn: string;
  footerNotesAr?: string;
  footerNotesEn?: string;
  includeQrVerification: boolean;
  includeSalaryTable?: boolean;
  includeStamp: boolean;
  signatoryTitleAr?: string;
  signatoryNameAr?: string;
  signatoryTitleEn?: string;
  signatoryNameEn?: string;
}

export interface RequestStats {
  totalRequests: number;
  pendingApproval: number;
  underReview: number;
  completed: number;
  completedCount: number;
  rejected: number;
  returned: number;
  autoApprovedCount: number;
  slaBreachedCount: number;
  averageProcessingHours: number;
  avgProcessingHours: number;
  slaComplianceRate: number;
  byCategory: Record<RequestCategory, number>;
  byDepartment: Record<string, number>;
}
