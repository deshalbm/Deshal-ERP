import {
  EmploymentContract,
  PerformanceGoal,
  EmployeeKPI,
  PerformanceReview,
  TrainingCourse,
  EmployeeTrainingRecord,
  EmployeeCertificate,
  DisciplinaryAction,
  EmployeeRecognition,
  EmployeeCareerHistory,
  EmployeeDocumentRecord,
  EmployeeEventGreeting
} from '../types/hr';

export const HR_STORAGE_KEYS = {
  CONTRACTS: 'deshal_hr_contracts_v1',
  GOALS: 'deshal_hr_goals_v1',
  KPIS: 'deshal_hr_kpis_v1',
  REVIEWS: 'deshal_hr_reviews_v1',
  TRAINING_COURSES: 'deshal_hr_courses_v1',
  TRAINING_RECORDS: 'deshal_hr_training_records_v1',
  CERTIFICATES: 'deshal_hr_certificates_v1',
  DISCIPLINARY: 'deshal_hr_disciplinary_v1',
  RECOGNITIONS: 'deshal_hr_recognitions_v1',
  CAREER_HISTORIES: 'deshal_hr_career_histories_v1',
  DOCUMENTS: 'deshal_hr_documents_v1',
  GREETINGS: 'deshal_hr_greetings_v1'
};

// -------------------------------------------------------------------
// 1. DEFAULT SEED DATA - EMPLOYMENT CONTRACTS
// -------------------------------------------------------------------
export const DEFAULT_CONTRACTS: EmploymentContract[] = [
  {
    id: 'cnt-1',
    contractNumber: 'CNT-2023-001',
    employeeId: 'emp-1',
    employeeCode: 'EMP-001',
    employeeName: 'سعيد بن راشد الشحي',
    employeeCivilId: '109847291',
    jobTitle: 'المدير التنفيذي العام',
    department: 'الإدارة العليا',
    branchId: 'branch-sohar',
    branchName: 'فرع صحار الرئيسي',
    contractType: 'INDEFINITE',
    startDate: '2023-01-15',
    probationPeriodMonths: 3,
    probationEndDate: '2023-04-15',
    basicSalary: 1200,
    housingAllowance: 200,
    transportAllowance: 100,
    otherAllowances: 0,
    totalSalary: 1500,
    currency: 'OMR',
    workingDaysPerWeek: 5,
    dailyWorkingHours: 8,
    annualLeaveDays: 30,
    clauses: [
      'يلتزم الطرف الثاني بالقيام بالمهام الإدارية والإشرافية الموكلة إليه وفق معايير الجودة المعتمدة.',
      'يحق للطرف الثاني إجازة سنوية مدفوعة الراتب مدتها 30 يوماً بعد إتمام سنة عمل متصلة.',
      'يلتزم الطرف الثاني بالمحافظة على سرية بيانات الشركة والمستأجرين والمعاملات المالية أثناء وبعد فترة العمل.',
      'تخضع كافة أحكام هذا العقد لقانون العمل العماني الصادر بالمرسوم السلطاني.'
    ],
    termsAndConditions: 'عقد عمل قيادي غير محدد المدة يخضع للقوانين المعمول بها في سلطنة عمان.',
    status: 'ACTIVE',
    renewalNoticeDays: 60,
    signedDate: '2023-01-15',
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'cnt-2',
    contractNumber: 'CNT-2023-002',
    employeeId: 'emp-2',
    employeeCode: 'EMP-002',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    employeeCivilId: '118274910',
    jobTitle: 'رئيسة قسم المحاسبة والمالية',
    department: 'المالية والمحاسبة',
    branchId: 'branch-sohar',
    branchName: 'فرع صحار الرئيسي',
    contractType: 'FIXED_TERM',
    startDate: '2025-10-01',
    endDate: '2026-09-30', // Expiring in ~1 month (Trigger Expiring Soon)
    probationPeriodMonths: 3,
    probationEndDate: '2023-05-01',
    basicSalary: 850,
    housingAllowance: 150,
    transportAllowance: 80,
    otherAllowances: 20,
    totalSalary: 1100,
    currency: 'OMR',
    workingDaysPerWeek: 5,
    dailyWorkingHours: 8,
    annualLeaveDays: 30,
    clauses: [
      'تتولى الموظفة إدارة الحسابات المالية، إعداد القيود المحاسبية، الإقرارات الضريبية ومطابقة كشوف البنوك.',
      'يحظر إفشاء أي معلومات مالية أو أرقام حسابات لأي جهة خارجية دون إذن كتابي من الإدارة.',
      'يتم تجديد العقد سنوياً بموافقة الطرفين الخطية قبل 30 يوماً من انتهائه.'
    ],
    termsAndConditions: 'عقد محدد المدة يخضع للتجديد السنوي.',
    status: 'EXPIRING_SOON',
    renewalNoticeDays: 30,
    signedDate: '2025-10-01',
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z'
  },
  {
    id: 'cnt-3',
    contractNumber: 'CNT-2024-003',
    employeeId: 'emp-3',
    employeeCode: 'EMP-003',
    employeeName: 'أحمد بن علي المعمري',
    employeeCivilId: '107629384',
    jobTitle: 'مدير المبيعات وحجوزات المساحات',
    department: 'المبيعات والمشاريع',
    branchId: 'branch-muscat',
    branchName: 'فرع مسقط - العذيبة',
    contractType: 'FULL_TIME',
    startDate: '2024-06-01',
    endDate: '2027-05-31',
    probationPeriodMonths: 3,
    probationEndDate: '2024-09-01',
    basicSalary: 750,
    housingAllowance: 150,
    transportAllowance: 100,
    otherAllowances: 0,
    totalSalary: 1000,
    currency: 'OMR',
    workingDaysPerWeek: 6,
    dailyWorkingHours: 8,
    annualLeaveDays: 30,
    clauses: [
      'تحقيق مستهدفات المبيعات واستقطاب المستأجرين لقاعات ومساحات الأعمال التابعة للشركة.',
      'عمولة المبيعات تُصرف وفق اللائحة الداخلية المعتمدة للمبيعات.'
    ],
    status: 'ACTIVE',
    renewalNoticeDays: 60,
    signedDate: '2024-06-01',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2026-08-15T12:00:00Z'
  }
];

// -------------------------------------------------------------------
// 2. DEFAULT SEED DATA - PERFORMANCE GOALS & KPIS & REVIEWS
// -------------------------------------------------------------------
export const DEFAULT_GOALS: PerformanceGoal[] = [
  {
    id: 'goal-1',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    title: 'رفع معدل إشغال قاعات التدريب والاجتماعات',
    description: 'تحقيق نسبة إشغال لا تقل عن 85% لفرع مسقط وصحار خلال الربع الثالث.',
    category: 'DEPARTMENT',
    targetValue: 85,
    achievedValue: 88,
    unit: '%',
    weightPercentage: 35,
    startDate: '2026-07-01',
    dueDate: '2026-09-30',
    status: 'COMPLETED',
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'goal-2',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    title: 'توقيع عقود إيجار سنوية لمساحات الأعمال المشتركة',
    description: 'إبرام 12 عقداً سنوياً جديداً مع رواد الأعمال والشركات الناشئة.',
    category: 'INDIVIDUAL',
    targetValue: 12,
    achievedValue: 10,
    unit: 'عقد',
    weightPercentage: 40,
    startDate: '2026-01-01',
    dueDate: '2026-12-31',
    status: 'IN_PROGRESS',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'goal-3',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    title: 'أتمتة المطابقات البنكية والتقارير الضريبية',
    description: 'تقليص زمن إعداد القوائم المالية الشهرية إلى أقل من 3 أيام عمل.',
    category: 'DEPARTMENT',
    targetValue: 3,
    achievedValue: 2,
    unit: 'أيام',
    weightPercentage: 50,
    startDate: '2026-06-01',
    dueDate: '2026-08-31',
    status: 'COMPLETED',
    createdAt: '2026-06-01T08:00:00Z'
  }
];

export const DEFAULT_KPIS: EmployeeKPI[] = [
  {
    id: 'kpi-1',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    kpiName: 'المبيعات الشهرية المحققة (Sales Revenue)',
    description: 'إجمالي إيرادات حجوزات القاعات وعقود الإيجار المحصلة.',
    period: 'MONTHLY',
    periodLabel: 'أغسطس 2026',
    targetValue: 8000,
    actualValue: 9250,
    unit: 'OMR',
    weightPercentage: 40,
    scorePercentage: 115.6,
    status: 'ACHIEVED',
    notes: 'تجاوز المستهدف بفضل الحملة الترويجية لباقات المكاتب.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'kpi-2',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    kpiName: 'معدل رضا عملاء المساحات (CSAT Score)',
    description: 'نسبة رضا المستأجرين في استبيانات ما بعد الفعالية.',
    period: 'MONTHLY',
    periodLabel: 'أغسطس 2026',
    targetValue: 90,
    actualValue: 94,
    unit: '%',
    weightPercentage: 30,
    scorePercentage: 104.4,
    status: 'ACHIEVED',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'kpi-3',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    kpiName: 'دقة المطابقة المحاسبية والامتثال الضريبي',
    description: 'صفر أخطاء في الإقرارات الضريبية ومطابقات الحسابات الختامية.',
    period: 'QUARTERLY',
    periodLabel: 'Q2 2026',
    targetValue: 100,
    actualValue: 99.5,
    unit: '%',
    weightPercentage: 50,
    scorePercentage: 99.5,
    status: 'ACHIEVED',
    createdAt: '2026-04-01T08:00:00Z'
  }
];

export const DEFAULT_REVIEWS: PerformanceReview[] = [
  {
    id: 'rev-1',
    reviewNumber: 'REV-2026-001',
    employeeId: 'emp-3',
    employeeCode: 'EMP-003',
    employeeName: 'أحمد بن علي المعمري',
    jobTitle: 'مدير المبيعات وحجوزات المساحات',
    department: 'المبيعات والمشاريع',
    reviewerId: 'emp-1',
    reviewerName: 'سعيد بن راشد الشحي',
    reviewerRole: 'المدير التنفيذي العام',
    reviewCycle: 'SEMI_ANNUAL',
    reviewPeriod: 'النصف الأول 2026 (H1)',
    reviewDate: '2026-07-10',
    goalsScore: 92,
    kpisScore: 94,
    competenciesScore: 90,
    overallScore: 92.2,
    rating: 'EXCEPTIONAL',
    strengths: 'التزام عالي بتحقيق المستهدفات، مهارات تفاوض ممتازة مع الشركات، سرعة الاستجابة لطلبات المستأجرين.',
    areasForImprovement: 'التوسع في استخدام التقارير الرقمية المؤتمتة ومتابعة العملاء المتأخرين عن التجديد مبكراً.',
    recommendations: 'صرف مكافأة تميز نصف سنوية وترشيح الموظف لدورة القيادة المتقدمة في المبيعات.',
    employeeComments: 'أشكر الإدارة على الدعم المستمر ونتطلع لمضاعفة الإيرادات في النصف الثاني.',
    employeeAcknowledged: true,
    status: 'COMPLETED',
    createdAt: '2026-07-10T10:00:00Z'
  },
  {
    id: 'rev-2',
    reviewNumber: 'REV-2026-002',
    employeeId: 'emp-2',
    employeeCode: 'EMP-002',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    jobTitle: 'رئيسة قسم المحاسبة والمالية',
    department: 'المالية والمحاسبة',
    reviewerId: 'emp-1',
    reviewerName: 'سعيد بن راشد الشحي',
    reviewerRole: 'المدير التنفيذي العام',
    reviewCycle: 'SEMI_ANNUAL',
    reviewPeriod: 'النصف الأول 2026 (H1)',
    reviewDate: '2026-07-12',
    goalsScore: 95,
    kpisScore: 98,
    competenciesScore: 94,
    overallScore: 95.8,
    rating: 'EXCEPTIONAL',
    strengths: 'إدارة مالية دقيقة ومحكمة، صفر ملاحظات تدقيق، كفاءة عالية في ضبط المصروفات وحماية الأجور.',
    areasForImprovement: 'تدريب مساعدي المحاسبة الجدد على نظام ديشال المحاسبي.',
    recommendations: 'تجديد العقد مع ترقية الراتب وزيادة الصلاحيات المالية.',
    employeeAcknowledged: true,
    status: 'COMPLETED',
    createdAt: '2026-07-12T11:00:00Z'
  }
];

// -------------------------------------------------------------------
// 3. DEFAULT SEED DATA - TRAINING & CERTIFICATES
// -------------------------------------------------------------------
export const DEFAULT_TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'crs-1',
    courseTitle: 'الامتثال للوائح ضريبة القيمة المضافة وقانون العمل العماني',
    provider: 'معهد مسقط للمحاسبة والقانون',
    trainingType: 'EXTERNAL',
    durationHours: 24,
    cost: 180,
    currency: 'OMR',
    startDate: '2026-04-10',
    endDate: '2026-04-14',
    location: 'مسقط - فندق شيراتون',
    description: 'تحديث شامل لمتطلبات الضرائب وضوابط عقود العمل وحماية الأجور في سلطنة عمان.',
    targetDepartments: ['المالية والمحاسبة', 'الإدارة العليا'],
    maxParticipants: 15,
    status: 'COMPLETED',
    createdAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 'crs-2',
    courseTitle: 'استراتيجيات التفاوض وإغلاق الصفقات العقارية والتجارية',
    provider: 'أكاديمية رواد الأعمال الخليجية',
    trainingType: 'WORKSHOP',
    durationHours: 16,
    cost: 120,
    currency: 'OMR',
    startDate: '2026-09-15',
    endDate: '2026-09-17',
    location: 'صحار - قاعة تدريب ديشال',
    description: 'ورشة عمل تطبيقية لمسؤولي المبيعات لإدارة عقود المساحات وباقات الأعمال.',
    targetDepartments: ['المبيعات والمشاريع'],
    maxParticipants: 10,
    status: 'PLANNED',
    createdAt: '2026-08-20T08:00:00Z'
  }
];

export const DEFAULT_TRAINING_RECORDS: EmployeeTrainingRecord[] = [
  {
    id: 'tr-1',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    employeeCode: 'EMP-002',
    courseId: 'crs-1',
    courseTitle: 'الامتثال للوائح ضريبة القيمة المضافة وقانون العمل العماني',
    provider: 'معهد مسقط للمحاسبة والقانون',
    trainingType: 'EXTERNAL',
    startDate: '2026-04-10',
    completionDate: '2026-04-14',
    hoursCompleted: 24,
    scoreOrGrade: 'ممتاز (96%)',
    status: 'COMPLETED',
    certificateNumber: 'OM-VAT-2026-8841',
    certificateExpiryDate: '2028-04-14',
    cost: 180,
    currency: 'OMR',
    feedback: 'دورة ممتازة أسهمت في تطبيق تحديثات الإقرارات الضريبية بدقة تامة.',
    createdAt: '2026-04-15T09:00:00Z'
  },
  {
    id: 'tr-2',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    employeeCode: 'EMP-003',
    courseId: 'crs-2',
    courseTitle: 'استراتيجيات التفاوض وإغلاق الصفقات العقارية والتجارية',
    provider: 'أكاديمية رواد الأعمال الخليجية',
    trainingType: 'WORKSHOP',
    startDate: '2026-09-15',
    hoursCompleted: 0,
    status: 'ENROLLED',
    cost: 120,
    currency: 'OMR',
    createdAt: '2026-08-22T10:00:00Z'
  }
];

export const DEFAULT_CERTIFICATES: EmployeeCertificate[] = [
  {
    id: 'cert-1',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    certificateName: 'شهادة زمالة المحاسبين القانونيين (SOCPA / CPA Prep)',
    issuingOrganization: 'الهيئة العامة لسوق المال والجمعية العمانية للمحاسبين',
    issueDate: '2024-05-15',
    expiryDate: '2027-05-15',
    credentialId: 'CPA-OM-49201',
    isExpiringSoon: false,
    status: 'VALID',
    verificationStatus: 'VERIFIED',
    createdAt: '2024-05-20T08:00:00Z'
  },
  {
    id: 'cert-2',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    certificateName: 'الرخصة الاحترافية في إدارة المساحات المشتركة (Workspace Hub)',
    issuingOrganization: 'Global Coworking Alliance',
    issueDate: '2025-08-10',
    expiryDate: '2026-09-25', // Expiring soon in < 30 days
    credentialId: 'GCA-PRO-9921',
    isExpiringSoon: true,
    status: 'EXPIRING_SOON',
    verificationStatus: 'VERIFIED',
    createdAt: '2025-08-15T08:00:00Z'
  }
];

// -------------------------------------------------------------------
// 4. DEFAULT SEED DATA - DISCIPLINARY ACTIONS
// -------------------------------------------------------------------
export const DEFAULT_DISCIPLINARY_ACTIONS: DisciplinaryAction[] = [
  {
    id: 'disc-1',
    actionNumber: 'DISC-2026-001',
    employeeId: 'emp-4',
    employeeCode: 'EMP-004',
    employeeName: 'مريم بنت عبدالله البلوشية',
    department: 'خدمة العملاء والاستقبال',
    branchName: 'فرع صحار الرئيسي',
    type: 'VERBAL_NOTICE',
    violationDate: '2026-07-05',
    issueDate: '2026-07-06',
    issuedBy: 'emp-1',
    issuedByName: 'سعيد بن راشد الشحي',
    issuedByRole: 'المدير التنفيذي العام',
    reason: 'التأخر عن فتح مكتب الاستقبال في الموعد المحدد لمدة 25 دقيقة دون إخطار مسبق.',
    details: 'تم رصد تأخر في بدء خدمة العملاء مما تسبب في انتظار أحد المستأجرين لاستلام بطاقة القاعة.',
    penaltyDetails: 'توجيه تنبيه شفهي أول مع التأكيد على الالتزام بجدول الورديات وإشعار المشرف في حال الطوارئ.',
    employeeExplanation: 'حدث عطل طارئ في المركبة أثناء الطريق وتم إشعار الزميلة بالفرع فور الوصول.',
    employeeResponseDate: '2026-07-06',
    employeeAcknowledged: true,
    status: 'EXECUTED',
    approvedBy: 'سعيد بن راشد الشحي',
    approvedAt: '2026-07-06T14:00:00Z',
    isNonDeletableAudit: true,
    createdAt: '2026-07-06T09:00:00Z',
    updatedAt: '2026-07-06T14:00:00Z'
  }
];

// -------------------------------------------------------------------
// 5. DEFAULT SEED DATA - RECOGNITION & AWARDS
// -------------------------------------------------------------------
export const DEFAULT_RECOGNITIONS: EmployeeRecognition[] = [
  {
    id: 'rec-1',
    employeeId: 'emp-3',
    employeeCode: 'EMP-003',
    employeeName: 'أحمد بن علي المعمري',
    jobTitle: 'مدير المبيعات وحجوزات المساحات',
    department: 'المبيعات والمشاريع',
    type: 'EMPLOYEE_OF_THE_MONTH',
    title: 'موظف الشهر المتميز - يوليو 2026',
    description: 'تقديراً لتحقيق أعلى نسبة إشغال لقاعات الأعمال وصياغة 8 عقود سنوية جديدة لفرعي مسقط وصحار.',
    awardDate: '2026-08-01',
    awardedBy: 'emp-1',
    awardedByName: 'سعيد بن راشد الشحي',
    monetaryReward: 150,
    currency: 'OMR',
    badgeIcon: 'Trophy',
    isPublic: true,
    createdAt: '2026-08-01T09:00:00Z'
  },
  {
    id: 'rec-2',
    employeeId: 'emp-2',
    employeeCode: 'EMP-002',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    jobTitle: 'رئيسة قسم المحاسبة والمالية',
    department: 'المالية والمحاسبة',
    type: 'ACHIEVEMENT_AWARD',
    title: 'درع التميز في الضبط المالي والامتثال الضريبي',
    description: 'تقديراً للجهود الاستثنائية في إتمام التدقيق المالي السنوي وحماية الأجور بدون أي عجز أو ملاحظات.',
    awardDate: '2026-06-30',
    awardedBy: 'emp-1',
    awardedByName: 'سعيد بن راشد الشحي',
    monetaryReward: 200,
    currency: 'OMR',
    badgeIcon: 'Award',
    isPublic: true,
    createdAt: '2026-06-30T10:00:00Z'
  }
];

// -------------------------------------------------------------------
// 6. DEFAULT SEED DATA - CAREER HISTORY
// -------------------------------------------------------------------
export const DEFAULT_CAREER_HISTORIES: EmployeeCareerHistory[] = [
  {
    id: 'ch-1',
    employeeId: 'emp-1',
    employeeName: 'سعيد بن راشد الشحي',
    changeType: 'HIRE',
    changeTitle: 'التعيين الأولي وتأسيس الإدارة',
    effectiveDate: '2023-01-15',
    previousValue: '---',
    newValue: 'المدير التنفيذي العام (الإدارة العليا)',
    reason: 'تأسيس الشركة وإدارة العمليات التشغيلية والفروع.',
    approvedBy: 'مجلس الإدارة',
    approvedByName: 'رئيس مجلس الإدارة',
    documentRef: 'CNT-2023-001',
    createdAt: '2023-01-15T08:00:00Z'
  },
  {
    id: 'ch-2',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    changeType: 'PROMOTION',
    changeTitle: 'ترقية إلى رئيسة قسم المحاسبة والمالية',
    effectiveDate: '2025-01-01',
    previousValue: 'محاسب أول (راتب 950 OMR)',
    newValue: 'رئيسة قسم المحاسبة والمالية (راتب 1,100 OMR)',
    reason: 'نظراً لكفاءتها العالية وقيادة التحول إلى نظام المحاسبة المؤتمت.',
    approvedBy: 'emp-1',
    approvedByName: 'سعيد بن راشد الشحي',
    documentRef: 'PROMO-2025-02',
    createdAt: '2025-01-01T08:00:00Z'
  },
  {
    id: 'ch-3',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    changeType: 'SALARY_INCREMENT',
    changeTitle: 'زيادة راتب سنوية وحافز مبيعات',
    effectiveDate: '2025-06-01',
    previousValue: 'إجمالي 850 OMR',
    newValue: 'إجمالي 1,000 OMR',
    reason: 'تحقيق مستهدفات المبيعات وتوسيع قاعدة مستأجري المساحات.',
    approvedBy: 'emp-1',
    approvedByName: 'سعيد بن راشد الشحي',
    documentRef: 'INC-2025-04',
    createdAt: '2025-06-01T08:00:00Z'
  }
];

// -------------------------------------------------------------------
// 7. DEFAULT SEED DATA - EMPLOYEE DOCUMENTS VAULT
// -------------------------------------------------------------------
export const DEFAULT_DOCUMENTS: EmployeeDocumentRecord[] = [
  {
    id: 'doc-1',
    employeeId: 'emp-1',
    employeeName: 'سعيد بن راشد الشحي',
    documentType: 'CIVIL_ID',
    title: 'البطاقة المدنية الوطنية',
    documentNumber: '109847291',
    issueDate: '2021-03-10',
    expiryDate: '2026-03-10',
    issuingAuthority: 'شرطة عمان السلطانية - الأحوال المدنية',
    fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    fileSize: '1.2 MB',
    fileType: 'image/jpeg',
    accessLevel: 'RESTRICTED',
    status: 'ACTIVE',
    createdAt: '2023-01-15T08:00:00Z'
  },
  {
    id: 'doc-2',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    documentType: 'EMPLOYMENT_CONTRACT',
    title: 'عقد العمل الرسمي المعتمد 2025/2026',
    documentNumber: 'CNT-2023-002',
    issueDate: '2025-10-01',
    expiryDate: '2026-09-30',
    issuingAuthority: 'وزارة العمل - سلطنة عمان',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    fileSize: '2.4 MB',
    fileType: 'application/pdf',
    accessLevel: 'CONFIDENTIAL',
    status: 'EXPIRING_SOON',
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'doc-3',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    documentType: 'ACADEMIC_DEGREE',
    title: 'شهادة بكالوريوس المحاسبة والمالية',
    documentNumber: 'DEG-SQU-2018-992',
    issueDate: '2018-06-15',
    issuingAuthority: 'جامعة السلطان قابوس',
    fileUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    fileSize: '3.1 MB',
    fileType: 'application/pdf',
    accessLevel: 'CONFIDENTIAL',
    status: 'ACTIVE',
    createdAt: '2023-02-01T08:00:00Z'
  }
];

// -------------------------------------------------------------------
// 8. DEFAULT SEED DATA - EVENTS & GREETINGS
// -------------------------------------------------------------------
export const DEFAULT_GREETINGS: EmployeeEventGreeting[] = [
  {
    id: 'grt-1',
    employeeId: 'emp-3',
    employeeName: 'أحمد بن علي المعمري',
    employeePhone: '+968 99887766',
    employeeEmail: 'ahmed.sales@digititech.com',
    eventType: 'WORK_ANNIVERSARY',
    eventDate: '2026-06-01',
    milestoneYears: 2,
    greetingMessage: 'أسرة ديشال لإدارة الأعمال تهنئك بمناسبة إكمال سنتين من العطاء المتميز والإنجاز المستمر معنا!',
    isAutomated: true,
    status: 'SENT',
    sentAt: '2026-06-01T07:00:00Z',
    sentChannel: 'WHATSAPP'
  },
  {
    id: 'grt-2',
    employeeId: 'emp-2',
    employeeName: 'فاطمة بنت ناصر البلوشي',
    employeePhone: '+968 98112233',
    employeeEmail: 'fatima.acc@digititech.com',
    eventType: 'BIRTHDAY',
    eventDate: '2026-09-08',
    greetingMessage: 'كل عام وأنتِ بخير وصحة ونجاح! نتمنى لكِ عاماً مليئاً بالتوفيق والتألق من أسرة ديشال.',
    isAutomated: true,
    status: 'UPCOMING'
  }
];

// -------------------------------------------------------------------
// STORAGE LOADER & SAVER UTILITIES
// -------------------------------------------------------------------

// Contracts
export function loadEmploymentContracts(): EmploymentContract[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CONTRACTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load contracts from storage:', e);
  }
  saveEmploymentContracts(DEFAULT_CONTRACTS);
  return DEFAULT_CONTRACTS;
}

export function saveEmploymentContracts(contracts: EmploymentContract[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  } catch (e) {
    console.error('Failed to save contracts:', e);
  }
}

// Goals
export function loadPerformanceGoals(): PerformanceGoal[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.GOALS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load goals:', e);
  }
  savePerformanceGoals(DEFAULT_GOALS);
  return DEFAULT_GOALS;
}

export function savePerformanceGoals(goals: PerformanceGoal[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals:', e);
  }
}

// KPIs
export function loadEmployeeKPIs(): EmployeeKPI[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.KPIS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load KPIs:', e);
  }
  saveEmployeeKPIs(DEFAULT_KPIS);
  return DEFAULT_KPIS;
}

export function saveEmployeeKPIs(kpis: EmployeeKPI[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.KPIS, JSON.stringify(kpis));
  } catch (e) {
    console.error('Failed to save KPIs:', e);
  }
}

// Reviews
export function loadPerformanceReviews(): PerformanceReview[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.REVIEWS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
  savePerformanceReviews(DEFAULT_REVIEWS);
  return DEFAULT_REVIEWS;
}

export function savePerformanceReviews(reviews: PerformanceReview[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews:', e);
  }
}

// Training Courses
export function loadTrainingCourses(): TrainingCourse[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.TRAINING_COURSES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load courses:', e);
  }
  saveTrainingCourses(DEFAULT_TRAINING_COURSES);
  return DEFAULT_TRAINING_COURSES;
}

export function saveTrainingCourses(courses: TrainingCourse[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.TRAINING_COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses:', e);
  }
}

// Training Records
export function loadEmployeeTrainingRecords(): EmployeeTrainingRecord[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.TRAINING_RECORDS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load training records:', e);
  }
  saveEmployeeTrainingRecords(DEFAULT_TRAINING_RECORDS);
  return DEFAULT_TRAINING_RECORDS;
}

export function saveEmployeeTrainingRecords(records: EmployeeTrainingRecord[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save training records:', e);
  }
}

// Certificates
export function loadEmployeeCertificates(): EmployeeCertificate[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CERTIFICATES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load certificates:', e);
  }
  saveEmployeeCertificates(DEFAULT_CERTIFICATES);
  return DEFAULT_CERTIFICATES;
}

export function saveEmployeeCertificates(certs: EmployeeCertificate[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
  } catch (e) {
    console.error('Failed to save certificates:', e);
  }
}

// Disciplinary
export function loadDisciplinaryActions(): DisciplinaryAction[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.DISCIPLINARY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load disciplinary actions:', e);
  }
  saveDisciplinaryActions(DEFAULT_DISCIPLINARY_ACTIONS);
  return DEFAULT_DISCIPLINARY_ACTIONS;
}

export function saveDisciplinaryActions(actions: DisciplinaryAction[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.DISCIPLINARY, JSON.stringify(actions));
  } catch (e) {
    console.error('Failed to save disciplinary actions:', e);
  }
}

// Recognitions
export function loadEmployeeRecognitions(): EmployeeRecognition[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.RECOGNITIONS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load recognitions:', e);
  }
  saveEmployeeRecognitions(DEFAULT_RECOGNITIONS);
  return DEFAULT_RECOGNITIONS;
}

export function saveEmployeeRecognitions(recs: EmployeeRecognition[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.RECOGNITIONS, JSON.stringify(recs));
  } catch (e) {
    console.error('Failed to save recognitions:', e);
  }
}

// Career Histories
export function loadEmployeeCareerHistories(): EmployeeCareerHistory[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.CAREER_HISTORIES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load career histories:', e);
  }
  saveEmployeeCareerHistories(DEFAULT_CAREER_HISTORIES);
  return DEFAULT_CAREER_HISTORIES;
}

export function saveEmployeeCareerHistories(histories: EmployeeCareerHistory[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.CAREER_HISTORIES, JSON.stringify(histories));
  } catch (e) {
    console.error('Failed to save career histories:', e);
  }
}

// Documents
export function loadEmployeeDocuments(): EmployeeDocumentRecord[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.DOCUMENTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load employee documents:', e);
  }
  saveEmployeeDocuments(DEFAULT_DOCUMENTS);
  return DEFAULT_DOCUMENTS;
}

export function saveEmployeeDocuments(docs: EmployeeDocumentRecord[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save employee documents:', e);
  }
}

// Greetings
export function loadEmployeeGreetings(): EmployeeEventGreeting[] {
  try {
    const saved = localStorage.getItem(HR_STORAGE_KEYS.GREETINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load greetings:', e);
  }
  saveEmployeeGreetings(DEFAULT_GREETINGS);
  return DEFAULT_GREETINGS;
}

export function saveEmployeeGreetings(greetings: EmployeeEventGreeting[]): void {
  try {
    localStorage.setItem(HR_STORAGE_KEYS.GREETINGS, JSON.stringify(greetings));
  } catch (e) {
    console.error('Failed to save greetings:', e);
  }
}
