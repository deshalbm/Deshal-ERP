import { EmployeeRole, EmployeeStatus, ContractType } from '../types';

// ==========================================
// 1. EMPLOYMENT CONTRACTS (عقود العمل)
// ==========================================
export type EmploymentContractStatus =
  | 'DRAFT'          // مسودة
  | 'ACTIVE'         // نشط وساري
  | 'EXPIRING_SOON'  // يقترب من الانتهاء (أقل من 60 يوم)
  | 'EXPIRED'        // منتهي الصلاحية
  | 'RENEWED'        // تم تجديده بعقد جديد
  | 'TERMINATED';    // منتهي / مفسوخ

export type EmploymentContractType =
  | 'FULL_TIME'      // دوام كامل
  | 'PART_TIME'      // دوام جزئي
  | 'FIXED_TERM'     // محدد المدة
  | 'INDEFINITE'     // غير محدد المدة
  | 'PROBATIONARY'   // فترة تجربة
  | 'TRAINEE'        // تدريب مهني
  | 'REMOTE';        // عمل عن بعد

export interface EmploymentContract {
  id: string;
  contractNumber: string; // e.g. "CNT-2026-001"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeCivilId?: string;
  jobTitle: string;
  department: string;
  branchId?: string;
  branchName?: string;
  contractType: EmploymentContractType;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (optional for indefinite)
  probationPeriodMonths: number; // e.g. 3 months
  probationEndDate?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  totalSalary: number;
  currency: string;
  workingDaysPerWeek: number;
  dailyWorkingHours: number;
  annualLeaveDays: number;
  clauses: string[];
  termsAndConditions?: string;
  status: EmploymentContractStatus;
  renewalNoticeDays: number; // e.g. 30 or 60 days
  attachmentUrl?: string;
  signedDate?: string;
  terminatedDate?: string;
  terminationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. PERFORMANCE & KPIS (إدارة الأداء والمؤشرات)
// ==========================================
export type PerformancePeriod = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export type GoalCategory = 'INDIVIDUAL' | 'DEPARTMENT' | 'COMPANY';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetValue: number;
  achievedValue: number;
  unit: string; // e.g. "مهمة", "ريال", "%", "ساعة"
  weightPercentage: number; // e.g. 25 (%)
  startDate: string;
  dueDate: string;
  status: GoalStatus;
  notes?: string;
  createdAt: string;
}

export type KPIStatus = 'ACHIEVED' | 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';

export interface EmployeeKPI {
  id: string;
  employeeId: string;
  employeeName: string;
  kpiName: string;
  description: string;
  period: PerformancePeriod;
  periodLabel: string; // e.g. "Q3 2026", "أغسطس 2026"
  targetValue: number;
  actualValue: number;
  unit: string; // e.g. "OMR", "%", "مكالمة", "مشروع"
  weightPercentage: number; // e.g. 40 (%)
  scorePercentage: number; // calculated e.g. (actual/target)*100
  status: KPIStatus;
  notes?: string;
  createdAt: string;
}

export type ReviewRating =
  | 'EXCEPTIONAL'           // متميز جداً (90-100%)
  | 'EXCEEDS_EXPECTATIONS'  // يتجاوز التوقعات (80-89%)
  | 'MEETS_EXPECTATIONS'    // يلبي التوقعات (70-79%)
  | 'NEEDS_IMPROVEMENT'     // يحتاج تحسين (60-69%)
  | 'UNSATISFACTORY';       // غير مرضٍ (أقل من 60%)

export interface PerformanceReview {
  id: string;
  reviewNumber: string; // e.g. "REV-2026-001"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewCycle: PerformancePeriod;
  reviewPeriod: string; // e.g. "2026 Q2"
  reviewDate: string;
  goalsScore: number; // 0-100
  kpisScore: number; // 0-100
  competenciesScore: number; // 0-100
  overallScore: number; // 0-100
  rating: ReviewRating;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  employeeComments?: string;
  employeeAcknowledged: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'COMPLETED';
  createdAt: string;
}

// ==========================================
// 3. TRAINING & DEVELOPMENT (التدريب والتطوير)
// ==========================================
export type TrainingType = 'INTERNAL' | 'EXTERNAL' | 'ONLINE' | 'WORKSHOP' | 'CERTIFICATION';
export type TrainingStatus = 'PLANNED' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TrainingCourse {
  id: string;
  courseTitle: string;
  provider: string;
  trainingType: TrainingType;
  durationHours: number;
  cost: number;
  currency: string;
  startDate: string;
  endDate: string;
  location?: string;
  description: string;
  targetDepartments: string[];
  maxParticipants: number;
  status: TrainingStatus;
  createdAt: string;
}

export interface EmployeeTrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  courseId?: string;
  courseTitle: string;
  provider: string;
  trainingType: TrainingType;
  startDate: string;
  completionDate?: string;
  hoursCompleted: number;
  scoreOrGrade?: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'DROPPED';
  certificateNumber?: string;
  certificateUrl?: string;
  certificateExpiryDate?: string;
  cost: number;
  currency: string;
  feedback?: string;
  createdAt: string;
}

export interface EmployeeCertificate {
  id: string;
  employeeId: string;
  employeeName: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  attachmentUrl?: string;
  isExpiringSoon: boolean;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

// ==========================================
// 4. DISCIPLINARY ACTIONS (الجزاءات والمخالفات)
// ==========================================
export type DisciplinaryType =
  | 'VERBAL_NOTICE'           // ملاحظة شفهية
  | 'WRITTEN_WARNING'         // إنذار كتابي
  | 'FINAL_WARNING'           // إنذار نهائي
  | 'INFRACTION'              // مخالفة إدارية
  | 'ADMINISTRATIVE_PENALTY'  // جزاء إداري
  | 'SALARY_DEDUCTION'        // خصم من الراتب
  | 'SUSPENSION'              // إيقاف مؤقت عن العمل
  | 'TERMINATION';            // إنهاء خدمات تأديبي

export type DisciplinaryStatus = 'UNDER_REVIEW' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';

export interface DisciplinaryAction {
  id: string;
  actionNumber: string; // e.g. "DISC-2026-001"
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  branchName?: string;
  type: DisciplinaryType;
  violationDate: string; // YYYY-MM-DD
  issueDate: string;
  issuedBy: string;
  issuedByName: string;
  issuedByRole: string;
  reason: string;
  details: string;
  penaltyDetails: string;
  deductionAmount?: number;
  deductionDays?: number;
  suspensionDays?: number;
  employeeExplanation?: string;
  employeeResponseDate?: string;
  employeeAcknowledged: boolean;
  attachments?: string[];
  status: DisciplinaryStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  isNonDeletableAudit: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. EMPLOYEE RECOGNITION (التكريم والتقدير)
// ==========================================
export type RecognitionType =
  | 'THANK_YOU_LETTER'          // رسالة شكر وتقدير
  | 'EMPLOYEE_OF_THE_MONTH'     // موظف الشهر
  | 'ACHIEVEMENT_AWARD'         // درع الإنجاز والتميز
  | 'APPRECIATION_CERTIFICATE'  // شهادة تقدير
  | 'BONUS_REWARD'              // مكافأة مالية تشجيعية
  | 'EXCEPTIONAL_MILESTONE';    // إنجاز استثنائي / خدمة طويلة

export interface EmployeeRecognition {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  type: RecognitionType;
  title: string;
  description: string;
  awardDate: string;
  awardedBy: string;
  awardedByName: string;
  monetaryReward?: number;
  currency?: string;
  badgeIcon: string; // Lucide icon name e.g. "Award", "Trophy", "Star", "HeartHandshake"
  certificateUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

// ==========================================
// 6. CAREER HISTORY & PROMOTIONS (المسار الوظيفي والترقيات)
// ==========================================
export type CareerChangeType =
  | 'HIRE'                // تعيين جديد
  | 'PROMOTION'           // ترقية وظيفية
  | 'TRANSFER'            // نقل فرع / قسم
  | 'SALARY_INCREMENT'    // زيادة راتب
  | 'JOB_TITLE_CHANGE'    // تعديل مسمى وظيفي
  | 'DEPARTMENT_TRANSFER' // نقل قسم
  | 'MANAGER_CHANGE'      // تغيير المدير المباشر
  | 'STATUS_CHANGE';      // تغيير حالة العمل

export interface EmployeeCareerHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  changeType: CareerChangeType;
  changeTitle: string;
  effectiveDate: string;
  previousValue: string;
  newValue: string;
  reason: string;
  approvedBy: string;
  approvedByName: string;
  documentRef?: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// 7. EMPLOYEE DOCUMENTS VAULT (أرشيف وثائق الموظف)
// ==========================================
export type EmployeeDocumentType =
  | 'CIVIL_ID'              // البطاقة المدنية / الهوية
  | 'PASSPORT'              // جواز السفر
  | 'EMPLOYMENT_CONTRACT'   // عقد العمل
  | 'ACADEMIC_DEGREE'       // المؤهل الدراسي
  | 'TRAINING_CERTIFICATE'  // شهادة تدريبية
  | 'OFFICIAL_LETTER'       // خطاب رسمي
  | 'DISCIPLINARY'          // إشعار جزاء
  | 'MEDICAL_FITNESS'       // فحص لياقة طبية
  | 'WORK_PERMIT'           // تصريح العمل
  | 'RESIDENCY'             // بطاقة الإقامة
  | 'RESUME'                // السيرة الذاتية
  | 'OTHER';                // وثيقة أخرى

export interface EmployeeDocumentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: EmployeeDocumentType;
  title: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  fileUrl: string;
  fileSize?: string;
  fileType?: string;
  accessLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'ARCHIVED';
  notes?: string;
  createdAt: string;
}

// ==========================================
// 8. EMPLOYEE EVENTS & GREETINGS (المناسبات والتهاني التلقائية)
// ==========================================
export type EmployeeEventType =
  | 'BIRTHDAY'           // عيد ميلاد
  | 'WORK_ANNIVERSARY'   // ذكرى التعيين السنوية
  | 'MILESTONE_YEARS'    // إكمال سنوات محددة (سنة، 5، 10)
  | 'PROMOTION'          // ترقية وظيفية
  | 'CERTIFICATION'      // الحصول على شهادة مهنية
  | 'MARRIAGE'           // زواج
  | 'NEW_BABY';          // مولود جديد

export interface EmployeeEventGreeting {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhone?: string;
  employeeEmail?: string;
  eventType: EmployeeEventType;
  eventDate: string; // YYYY-MM-DD
  milestoneYears?: number;
  greetingMessage: string;
  isAutomated: boolean;
  status: 'UPCOMING' | 'SENT' | 'DISMISSED';
  sentAt?: string;
  sentChannel?: 'WHATSAPP' | 'EMAIL' | 'INTERNAL_ALERT';
}
