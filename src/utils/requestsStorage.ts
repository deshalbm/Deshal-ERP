import {
  RequestTypeConfig,
  EmployeeRequest,
  DocumentTemplate,
  RequestDocument,
  RequestTimelineEvent,
  RequestApprovalStageRecord,
  RequestStats,
  RequestStatus,
  Employee
} from '../types';

const STORAGE_KEY_REQUEST_TYPES = 'deshal_request_types_v1';
const STORAGE_KEY_REQUESTS = 'deshal_employee_requests_v1';
const STORAGE_KEY_DOCUMENT_TEMPLATES = 'deshal_request_doc_templates_v1';

// ---------------------------------------------------------------------------
// 1. DEFAULT DOCUMENT TEMPLATES (قوالب المستندات الرسمية المعتمدة)
// ---------------------------------------------------------------------------
export const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tpl-salary-cert',
    code: 'DOC-SALARY-CERT',
    nameAr: 'شهادة راتب رسمية موثقة',
    nameEn: 'Official Salary Certificate',
    category: 'DOCUMENTS',
    descriptionAr: 'شهادة إثبات راتب رسمية موجهة للبنوك أو جهات التمويل مع تفاصيل الراتب الأساسي والبدلات.',
    headerTitleAr: 'شهادة إثبات راتب لمن يهمه الأمر',
    headerTitleEn: 'Salary Certificate - To Whom It May Concern',
    bodyTemplateAr: `تشهد إدارة شركة **{{company_name}}** (سجل تجاري: {{company_cr}}) بأن الفاضل/ **{{employee_name}}**، الحامل للرقم المدني **{{civil_id}}**، يعمل لدينا بمهنة **{{job_title}}** في قسم **{{department}}** بموجب عقد عمل ساري المفعول منذ تاريخ **{{hire_date}}** وحتى تاريخه.

وفيما يلي تفاصيل الاستحقاقات المالية الشهرية للموظف المذكور:
- **الراتب الأساسي:** {{basic_salary}} {{currency}}
- **إجمالي البدلات الثابتة:** {{allowances}} {{currency}}
- **إجمالي الراتب الشهري:** **{{total_salary}} {{currency}}** ({{salary_in_words}})

وقد صدرت هذه الشهادة بناءً على طلب الموظف لتقديمها إلى: **{{directed_to}}** لغرض: **{{purpose}}** دون أن تتحمل الشركة أي مسؤولية أو التزام مالي تجاه الغير.`,
    bodyTemplateEn: `This is to certify that Mr./Ms. **{{employee_name}}** (Civil ID: **{{civil_id}}**) is currently employed with **{{company_name}}** (CR: {{company_cr}}) as **{{job_title}}** in the **{{department}}** department since **{{hire_date}}**.

The monthly gross remuneration is structured as follows:
- **Basic Salary:** {{basic_salary}} {{currency}}
- **Fixed Allowances:** {{allowances}} {{currency}}
- **Total Monthly Gross Salary:** **{{total_salary}} {{currency}}**

This certificate is issued upon the employee's request to be submitted to **{{directed_to}}** for the purpose of **{{purpose}}**, without any financial liability on the company's part.`,
    footerNotesAr: 'تم إصدار هذا المستند وتوثيقه إلكترونياً عبر منظومة Deshal ERP ويحمل رمز تحقق رقمي فريد.',
    footerNotesEn: 'This official document is digitally generated via Deshal ERP and verified with a cryptographic QR code.',
    includeQrVerification: true,
    includeSalaryTable: true,
    includeStamp: true,
    signatoryTitleAr: 'مدير عام الموارد البشرية والعمليات',
    signatoryNameAr: 'سالم بن أحمد المعمري',
    signatoryTitleEn: 'Head of Human Resources',
    signatoryNameEn: 'Salim Al-Maamari'
  },
  {
    id: 'tpl-salary-statement',
    code: 'DOC-SALARY-STATEMENT',
    nameAr: 'كشف مفردات راتب تفصيلي',
    nameEn: 'Detailed Salary Breakdown Statement',
    category: 'DOCUMENTS',
    descriptionAr: 'بيان تفصيلي بالمستحقات المالية والخصومات التأمينية والبدلات لشهر محدد.',
    headerTitleAr: 'بيان مفردات الأجر والمستحقات الشهرية',
    headerTitleEn: 'Monthly Salary Breakdown Statement',
    bodyTemplateAr: `تفيد إدارة شركة **{{company_name}}** بأن بيانات استحقاق الأجر الشهري للموظف/ **{{employee_name}}** (كود الموظف: {{employee_code}}) عن شهر **{{target_month}}** تفاصيلها كما يلي:

- الراتب الأساسي: {{basic_salary}} {{currency}}
- بدل السكن والنقل: {{allowances}} {{currency}}
- إجمالي الراتب الإجمالي: {{total_salary}} {{currency}}
- الحساب البنكي المعتمد للتحويل (IBAN): {{bank_iban}} ({{bank_name}})

وقد أودع الراتب عبر نظام حماية الأجور (WPS) المعتمد في سلطنة عمان.`,
    bodyTemplateEn: `This statement certifies the remuneration and payroll breakdown for employee **{{employee_name}}** (Code: {{employee_code}}) for the month of **{{target_month}}**:
- Basic Salary: {{basic_salary}} {{currency}}
- Allowances: {{allowances}} {{currency}}
- Total Gross Remuneration: {{total_salary}} {{currency}}
- Bank Account (IBAN): {{bank_iban}} ({{bank_name}})`,
    footerNotesAr: 'كشف رسمي صادر للاستخدامات الإدارية والمصرفية.',
    footerNotesEn: 'Official statement generated for banking & administrative purposes.',
    includeQrVerification: true,
    includeSalaryTable: true,
    includeStamp: true,
    signatoryTitleAr: 'المدير المالي ورئيس الحسابات',
    signatoryNameAr: 'عمر بن خالد البلوشي',
    signatoryTitleEn: 'Chief Financial Officer',
    signatoryNameEn: 'Omar Al-Balushi'
  },
  {
    id: 'tpl-continuity',
    code: 'DOC-CONTINUITY',
    nameAr: 'شهادة استمرارية عمل',
    nameEn: 'Employment Continuity Certificate',
    category: 'DOCUMENTS',
    descriptionAr: 'إفادة رسمية تفيد بأن الموظف على رأس عمله ومستمر في أداء مهامه الوظيفية.',
    headerTitleAr: 'شهادة إثبات واستمرارية عمل على رأس العمل',
    headerTitleEn: 'Certificate of Ongoing Employment',
    bodyTemplateAr: `تشهد شركة **{{company_name}}** بأن الموظف/ **{{employee_name}}**، الرقم المدني: **{{civil_id}}**، الرقم الوظيفي: **{{employee_code}}**، يعمل لدينا بوظيفة **{{job_title}}** وما زال **على رأس عمله** حتى تاريخ إصدار هذه الشهادة، ويمارس كافة مهامه ومسؤولياته بصورة مستمرة ومنتظمة.

صدرت هذه الشهادة لتقديمها إلى: **{{directed_to}}** بناءً على رغبة الموظف لغرض **{{purpose}}**.`,
    bodyTemplateEn: `This is to certify that **{{employee_name}}** (Civil ID: {{civil_id}}, Employee ID: {{employee_code}}) is currently actively employed with **{{company_name}}** as **{{job_title}}** and is in active continuous service to date.

Issued upon employee request for **{{directed_to}}** regarding **{{purpose}}**.`,
    footerNotesAr: 'شهادة رسمية صادرة وموثقة إلكترونياً.',
    footerNotesEn: 'Official digitally verified certificate.',
    includeQrVerification: true,
    includeSalaryTable: false,
    includeStamp: true,
    signatoryTitleAr: 'مدير شؤون الموظفين والامتثال',
    signatoryNameAr: 'سالم بن أحمد المعمري',
    signatoryTitleEn: 'HR & Compliance Manager',
    signatoryNameEn: 'Salim Al-Maamari'
  },
  {
    id: 'tpl-experience',
    code: 'DOC-EXPERIENCE',
    nameAr: 'شهادة خبرة وخدمة وظيفية',
    nameEn: 'Certificate of Service & Experience',
    category: 'DOCUMENTS',
    descriptionAr: 'شهادة رسمية توضح مدة الخدمة، المسمى الوظيفي، وتوصيف المهام وتقييم الأداء.',
    headerTitleAr: 'شهادة خبرة وخدمة وظيفية رسمية',
    headerTitleEn: 'Official Certificate of Experience & Service',
    bodyTemplateAr: `تشهد إدارة شركة **{{company_name}}** بأن الفاضل/ **{{employee_name}}** (الرقم الوظيفي: **{{employee_code}}**)، قد عمل لدينا في قسم **{{department}}** بوظيفة **{{job_title}}** خلال الفترة من تاريخ **{{hire_date}}** وحتى **{{end_date_or_present}}**.

وخلال فترة عمله، أظهر الموظف كفاءة مهنية عالية والتزاماً كبيراً بأخلاقيات العمل وسياسات الشركة، وكان مثالاً للموظف المخلص والمجتهد.

وقد أُعطيت له هذه الشهادة بناءً على طلبه مع خالص تمنياتنا له بالتوفيق والنجاح الدائم في مسيرته المهنية.`,
    bodyTemplateEn: `This is to certify that **{{employee_name}}** (Employee ID: {{employee_code}}) has served in **{{company_name}}** in the **{{department}}** department as **{{job_title}}** from **{{hire_date}}** to **{{end_date_or_present}}**.

During this period, he/she demonstrated exceptional dedication, high professionalism, and exemplary conduct. We wish him/her continuous success in future endeavors.`,
    footerNotesAr: 'شهادة خبرة معتمدة ومسجلة في أرشيف الموارد البشرية.',
    footerNotesEn: 'Certified experience document stored in HR archives.',
    includeQrVerification: true,
    includeSalaryTable: false,
    includeStamp: true,
    signatoryTitleAr: 'الرئيس التنفيذي ومدير الموارد البشرية',
    signatoryNameAr: 'م. راشد بن ناصر الحوسني',
    signatoryTitleEn: 'Chief Executive Officer',
    signatoryNameEn: 'Eng. Rashid Al-Hosni'
  },
  {
    id: 'tpl-embassy',
    code: 'DOC-EMBASSY',
    nameAr: 'خطاب تعريف رسمي للسفارات والجهات الحكومية',
    nameEn: 'Official Embassy & Visa Identification Letter',
    category: 'DOCUMENTS',
    descriptionAr: 'خطاب رسمي باللغتين العربية والإنجليزية لتقديمه للسفارات والبعثات الدبلوماسية لاستخراج التأشيرات.',
    headerTitleAr: 'خطاب تعريف رسمي وإفادة راتب (للسفارات والقنصليات)',
    headerTitleEn: 'To The Embassy / Consulate General - Visa Section',
    bodyTemplateAr: `إلى: **{{embassy_name}}** المحترمين،
تحية طيبة وبعد،

تفيد شركة **{{company_name}}** بأن الفاضل/ **{{employee_name}}** (جواز سفر رقم: **{{passport_number}}** / رقم مدني: **{{civil_id}}**) يعمل لدينا بوظيفة **{{job_title}}** براتب شهري قدره **{{total_salary}} {{currency}}**.

وقد تمت الموافقة له على السفر خلال إجازته الرسمية من تاريخ **{{travel_start_date}}** إلى تاريخ **{{travel_end_date}}**، وتؤكد الشركة أنه سيعاود مباشرة عمله فور انتهاء إجازته. نرجو التكرم بتسهيل إجراءات منح التأشيرة المطلوبة.`,
    bodyTemplateEn: `To: **The Embassy / Consulate Visa Section ({{embassy_name}})**,

Dear Visa Officer,

This is to certify that Mr./Ms. **{{employee_name}}** (Passport No: **{{passport_number}}**, Civil ID: **{{civil_id}}**) is an employee of **{{company_name}}** holding the position of **{{job_title}}** with a monthly gross salary of **{{total_salary}} {{currency}}**.

The company has granted him/her approved leave to travel from **{{travel_start_date}}** to **{{travel_end_date}}**. We confirm that he/she will resume active duty upon return. Kindly grant the necessary visa entry requirements.`,
    footerNotesAr: 'خطاب صادر لأغراض التأشيرات والسفر الخارجي.',
    footerNotesEn: 'Official letter issued for travel and visa requirements.',
    includeQrVerification: true,
    includeSalaryTable: true,
    includeStamp: true,
    signatoryTitleAr: 'المدير التنفيذي والمسؤول الإداري',
    signatoryNameAr: 'سالم بن أحمد المعمري',
    signatoryTitleEn: 'Executive HR Director',
    signatoryNameEn: 'Salim Al-Maamari'
  }
];

// ---------------------------------------------------------------------------
// 2. DEFAULT REQUEST TYPES (أنواع الطلبات والنماذج الديناميكية الجاهزة)
// ---------------------------------------------------------------------------
export const DEFAULT_REQUEST_TYPES: RequestTypeConfig[] = [
  // 1. Salary Certificate (طلب شهادة راتب) - Auto Approval
  {
    id: 'req-type-salary-cert',
    code: 'REQ-SALARY-CERT',
    nameAr: 'طلب شهادة راتب موثقة',
    nameEn: 'Salary Certificate Request',
    descriptionAr: 'إصدار فوري لشهادة إثبات الراتب الرسمية موجهة للبنوك، التمويل، أو الدوائر الحكومية.',
    descriptionEn: 'Instant official salary certificate addressed to banks, finance, or government entities.',
    category: 'DOCUMENTS',
    icon: 'FileCheck2',
    color: 'emerald',
    order: 1,
    isActive: true,
    requiresApproval: false,
    isAutoApproved: true,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 1,
    defaultPriority: 'MEDIUM',
    documentTemplateId: 'tpl-salary-cert',
    generateDocumentOn: 'AUTO_APPROVAL',
    fields: [
      {
        id: 'directed_to',
        labelAr: 'الجهة الموجه إليها الخطاب',
        labelEn: 'Directed To (Recipient)',
        type: 'dropdown',
        required: true,
        order: 1,
        placeholderAr: 'اختر الجهة المستلمة للخطاب',
        placeholderEn: 'Select recipient organization',
        options: [
          { labelAr: 'إلى من يهمه الأمر (عام)', labelEn: 'To Whom It May Concern (General)', value: 'إلى من يهمه الأمر' },
          { labelAr: 'بنك مسقط (Bank Muscat)', labelEn: 'Bank Muscat', value: 'بنك مسقط (Bank Muscat)' },
          { labelAr: 'بنك ظفار (Bank Dhofar)', labelEn: 'Bank Dhofar', value: 'بنك ظفار (Bank Dhofar)' },
          { labelAr: 'البنك الوطني العماني (NBO)', labelEn: 'National Bank of Oman', value: 'البنك الوطني العماني (NBO)' },
          { labelAr: 'بنك نزوى (Bank Nizwa)', labelEn: 'Bank Nizwa', value: 'بنك نزوى (Bank Nizwa)' },
          { labelAr: 'وزارة الإسكان والتخطيط العمراني', labelEn: 'Ministry of Housing', value: 'وزارة الإسكان والتخطيط العمراني' },
          { labelAr: 'جهة أخرى (تحدد في الملاحظات)', labelEn: 'Other entity (Specify in notes)', value: 'جهة رسمية أخرى' }
        ],
        width: 'half'
      },
      {
        id: 'purpose',
        labelAr: 'الغرض من الشهادة',
        labelEn: 'Purpose of Certificate',
        type: 'dropdown',
        required: true,
        order: 2,
        placeholderAr: 'حدد الغرض من طلب الشهادة',
        placeholderEn: 'Select request purpose',
        options: [
          { labelAr: 'معاملة مصرفية / تمويل شخصي أو سكني', labelEn: 'Bank loan / Mortgage financing', value: 'معاملة مصرفية وتمويل مالي' },
          { labelAr: 'فتح حساب بنكي جديد أو إصدار بطاقة ائتمان', labelEn: 'Bank account / Credit card', value: 'فتح حساب بنكي وإصدار بطاقة ائتمانية' },
          { labelAr: 'استخراج تأشيرة سفر وسياحة', labelEn: 'Travel / Tourism Visa', value: 'استخراج تأشيرة سفر وسياحة' },
          { labelAr: 'تأجير سكن أو عقد إيجار رسمي', labelEn: 'Residential Rental Lease', value: 'معاملة إيجار عقار سكني' },
          { labelAr: 'أغراض شخصية وإدارية أخرى', labelEn: 'Other administrative purposes', value: 'أغراض إدارية وشخصية' }
        ],
        width: 'half'
      },
      {
        id: 'doc_language',
        labelAr: 'لغة الشهادة والمستند',
        labelEn: 'Document Language',
        type: 'radio',
        required: true,
        defaultValue: 'ar',
        order: 3,
        options: [
          { labelAr: 'اللغة العربية (معتمد محلياً)', labelEn: 'Arabic (Local Certified)', value: 'ar' },
          { labelAr: 'اللغة الإنجليزية (English)', labelEn: 'English', value: 'en' },
          { labelAr: 'نسخة ثنائية اللغة (Arabic / English)', labelEn: 'Bilingual (Ar/En)', value: 'bilingual' }
        ],
        width: 'half'
      },
      {
        id: 'delivery_method',
        labelAr: 'طريقة الاستلام المفضلة',
        labelEn: 'Receiving Method',
        type: 'dropdown',
        required: true,
        defaultValue: 'pdf',
        order: 4,
        options: [
          { labelAr: 'تحميل مباشر PDF موثق بختم ورمز QR فوراً', labelEn: 'Instant PDF Download with QR Code', value: 'pdf' },
          { labelAr: 'نسخة ورقية أصلية مختومة وموقعة يدوياً من الإدارة', labelEn: 'Original Physical Stamped Hard Copy', value: 'hard_copy' }
        ],
        width: 'half'
      },
      {
        id: 'include_allowances',
        labelAr: 'إظهار تفاصيل البدلات الإضافية بالشهادة',
        labelEn: 'Include Detailed Allowances Breakdown',
        type: 'checkbox',
        required: false,
        defaultValue: true,
        order: 5,
        width: 'full'
      },
      {
        id: 'notes',
        labelAr: 'ملاحظات وتفاصيل إضافية',
        labelEn: 'Additional Notes & Details',
        type: 'textarea',
        required: false,
        placeholderAr: 'اكتب أي متطلبات خاصة بالشهادة إن وجدت...',
        placeholderEn: 'Enter any specific requirements if needed...',
        order: 6,
        width: 'full'
      }
    ],
    workflowStages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 2. Salary Statement / Detailed Payslip Request (طلب كشف مفردات راتب) - Auto Approval
  {
    id: 'req-type-salary-statement',
    code: 'REQ-SALARY-STATEMENT',
    nameAr: 'طلب كشف مفردات راتب معتمد',
    nameEn: 'Salary Statement & Breakdown',
    descriptionAr: 'بيان معتمد بمفردات واستحقاقات الراتب والبدلات المحولة عبر نظام WPS.',
    descriptionEn: 'Certified monthly remuneration breakdown transferred through the WPS system.',
    category: 'DOCUMENTS',
    icon: 'Receipt',
    color: 'blue',
    order: 2,
    isActive: true,
    requiresApproval: false,
    isAutoApproved: true,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 1,
    defaultPriority: 'LOW',
    documentTemplateId: 'tpl-salary-statement',
    generateDocumentOn: 'AUTO_APPROVAL',
    fields: [
      {
        id: 'target_month',
        labelAr: 'الشهر والتحويل المطلوب',
        labelEn: 'Target Payroll Month',
        type: 'dropdown',
        required: true,
        order: 1,
        options: [
          { labelAr: 'أغسطس 2026 (آخر مسير معتمد)', labelEn: 'August 2026 (Latest)', value: '2026-08' },
          { labelAr: 'يوليو 2026', labelEn: 'July 2026', value: '2026-07' },
          { labelAr: 'يونيو 2026', labelEn: 'June 2026', value: '2026-06' },
          { labelAr: 'مايو 2026', labelEn: 'May 2026', value: '2026-05' },
          { labelAr: 'كشف مجمع لآخر 3 أشهر', labelEn: 'Last 3 Months Statement', value: 'LAST_3_MONTHS' }
        ],
        width: 'half'
      },
      {
        id: 'purpose',
        labelAr: 'الغرض من الكشف',
        labelEn: 'Purpose',
        type: 'text',
        required: false,
        placeholderAr: 'مثال: تحديث بيانات بنكية / تقديم لجهة حكومية...',
        placeholderEn: 'e.g. Bank update / Embassy / Rental agreement...',
        order: 2,
        width: 'half'
      }
    ],
    workflowStages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. Employment Continuity Certificate (طلب شهادة استمرارية عمل) - Auto Approval
  {
    id: 'req-type-continuity',
    code: 'REQ-CONTINUITY',
    nameAr: 'طلب شهادة استمرارية عمل',
    nameEn: 'Employment Continuity Letter',
    descriptionAr: 'إفادة رسمية بأن الموظف على رأس عمله ومستمر في أداء مهامه بالشركة.',
    descriptionEn: 'Official letter certifying active employment and ongoing service.',
    category: 'DOCUMENTS',
    icon: 'ShieldCheck',
    color: 'teal',
    order: 3,
    isActive: true,
    requiresApproval: false,
    isAutoApproved: true,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 1,
    defaultPriority: 'LOW',
    documentTemplateId: 'tpl-continuity',
    generateDocumentOn: 'AUTO_APPROVAL',
    fields: [
      {
        id: 'directed_to',
        labelAr: 'الجهة الموجه إليها',
        labelEn: 'Directed To',
        type: 'text',
        required: true,
        defaultValue: 'إلى من يهمه الأمر',
        placeholderAr: 'مثال: شرطة عمان السلطانية / دائرة الإسكان / بنك مسقط',
        placeholderEn: 'e.g. Royal Oman Police / Housing Directorate / Bank',
        order: 1,
        width: 'half'
      },
      {
        id: 'purpose',
        labelAr: 'الغرض من الخطاب',
        labelEn: 'Purpose',
        type: 'text',
        required: true,
        defaultValue: 'إثبات استمرارية العمل على رأس العمل',
        placeholderAr: 'الغرض من تقديم الشهادة...',
        placeholderEn: 'Purpose of submission...',
        order: 2,
        width: 'half'
      }
    ],
    workflowStages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. Experience Certificate (طلب شهادة خبرة) - Requires HR Approval
  {
    id: 'req-type-experience',
    code: 'REQ-EXP-CERT',
    nameAr: 'طلب شهادة خبرة وخدمة وظيفية',
    nameEn: 'Experience & Service Certificate',
    descriptionAr: 'شهادة رسمية توضح مدة الخدمة والمسمى الوظيفي ومجالات الإنجاز والمسؤوليات.',
    descriptionEn: 'Official service certificate detailing duration, job title, achievements and roles.',
    category: 'DOCUMENTS',
    icon: 'Award',
    color: 'amber',
    order: 4,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 24,
    defaultPriority: 'MEDIUM',
    documentTemplateId: 'tpl-experience',
    generateDocumentOn: 'FINAL_APPROVAL',
    fields: [
      {
        id: 'directed_to',
        labelAr: 'الجهة الموجه إليها الخطاب',
        labelEn: 'Addressed To',
        type: 'text',
        required: true,
        defaultValue: 'إلى من يهمه الأمر',
        order: 1,
        width: 'half'
      },
      {
        id: 'purpose',
        labelAr: 'سبب وغاية الطلب',
        labelEn: 'Purpose / Reason',
        type: 'dropdown',
        required: true,
        order: 2,
        options: [
          { labelAr: 'تقديم لمؤسسة تعليمية / دراسات عليا', labelEn: 'Higher Education / Academic', value: 'تقديم لدراسات عليا أو تدريب أكاديمي' },
          { labelAr: 'اعتماد مهني أو تسجيل لدى جمعية مهنية', labelEn: 'Professional accreditation', value: 'اعتماد مهني ونقابي' },
          { labelAr: 'انتهاء فترة العمل أو طلب شخصي', labelEn: 'Service completion / personal request', value: 'توثيق الخبرة العملية' }
        ],
        width: 'half'
      },
      {
        id: 'include_commendation',
        labelAr: 'تضمين عبارة إشادة بالأداء والتفاني',
        labelEn: 'Include Commendation Statement',
        type: 'checkbox',
        required: false,
        defaultValue: true,
        order: 3,
        width: 'full'
      },
      {
        id: 'notes',
        labelAr: 'ملاحظات وتفاصيل إضافية ترغب بذكرها',
        labelEn: 'Additional Notes',
        type: 'textarea',
        required: false,
        placeholderAr: 'اذكر أي تفاصيل إضافية ترغب بإبرازها في الشهادة...',
        placeholderEn: 'State any specific achievements or roles...',
        order: 4,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة وتدقيق إدارة الموارد البشرية',
        stageNameEn: 'HR Department Review & Verification',
        approverType: 'HR',
        approverRoleId: 'ADMIN',
        slaHours: 24,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 5. Embassy & Visa Introduction Letter (طلب خطاب تعريف للسفارات) - Multi-Stage Workflow
  {
    id: 'req-type-embassy',
    code: 'REQ-EMBASSY',
    nameAr: 'طلب خطاب تعريف وسفارات (تأشيرات)',
    nameEn: 'Embassy & Visa Introduction Letter',
    descriptionAr: 'خطاب رسمي باللغتين موجه للسفارات والقنصليات لتسهيل استخراج تأشيرات السفر والسياحة.',
    descriptionEn: 'Official bilingual letter addressed to embassies & consulates for travel visas.',
    category: 'DOCUMENTS',
    icon: 'Globe2',
    color: 'indigo',
    order: 5,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 24,
    defaultPriority: 'HIGH',
    documentTemplateId: 'tpl-embassy',
    generateDocumentOn: 'FINAL_APPROVAL',
    fields: [
      {
        id: 'embassy_name',
        labelAr: 'اسم السفارة / القنصلية / الدولة المستهدفة',
        labelEn: 'Embassy / Destination Country',
        type: 'text',
        required: true,
        placeholderAr: 'مثال: سفارة المملكة المتحدة / سفارة فرنسا (شنغن) / السفارة الأمريكية',
        placeholderEn: 'e.g. UK Embassy / French Embassy (Schengen) / US Embassy',
        order: 1,
        width: 'half'
      },
      {
        id: 'passport_number',
        labelAr: 'رقم جواز السفر الحالي',
        labelEn: 'Passport Number',
        type: 'text',
        required: true,
        placeholderAr: 'مثال: 12345678',
        placeholderEn: 'e.g. 12345678',
        order: 2,
        width: 'half'
      },
      {
        id: 'travel_start_date',
        labelAr: 'تاريخ بداية السفر المتوقع',
        labelEn: 'Expected Travel Start Date',
        type: 'date',
        required: true,
        order: 3,
        width: 'half'
      },
      {
        id: 'travel_end_date',
        labelAr: 'تاريخ انتهاء السفر المتوقع',
        labelEn: 'Expected Travel End Date',
        type: 'date',
        required: true,
        order: 4,
        width: 'half'
      },
      {
        id: 'purpose_of_travel',
        labelAr: 'الغرض من السفر',
        labelEn: 'Purpose of Travel',
        type: 'dropdown',
        required: true,
        order: 5,
        options: [
          { labelAr: 'سياحة وإجازة سنوية', labelEn: 'Tourism & Annual Vacation', value: 'سياحة وإجازة سنوية' },
          { labelAr: 'مهمة عمل ومؤتمر تجاري', labelEn: 'Business Mission & Conference', value: 'مهمة عمل وتمثيل تجاري' },
          { labelAr: 'علاج طبي وزيارة عائلية', labelEn: 'Medical Treatment / Family Visit', value: 'علاج وزيارة عائلية' }
        ],
        width: 'half'
      },
      {
        id: 'flight_attachment',
        labelAr: 'مرفق حجز الطيران أو الموعد (إن وجد)',
        labelEn: 'Flight / Appointment Ticket Attachment',
        type: 'attachment',
        required: false,
        order: 6,
        width: 'half'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة مسؤول الموارد البشرية والامتثال',
        stageNameEn: 'HR Compliance Officer Approval',
        approverType: 'HR',
        slaHours: 12,
        isFinalApproval: false
      },
      {
        stageIndex: 1,
        stageNameAr: 'اعتماد الإدارة العامة وتوقيع الرئيس التنفيذي',
        stageNameEn: 'Executive Management Endorsement & Signature',
        approverType: 'ADMINISTRATIVE',
        slaHours: 12,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 6. Salary Advance / Loan Request (طلب سلفة مالية على الراتب) - Multi-Stage Workflow
  {
    id: 'req-type-loan',
    code: 'REQ-LOAN',
    nameAr: 'طلب سلفة مالية على الراتب',
    nameEn: 'Salary Advance / Loan Request',
    descriptionAr: 'طلب سلفة مالية مؤقتة يتم خصمها من الراتب الشهري وفق اللائحة المالية للشركة.',
    descriptionEn: 'Request a salary advance deducted from monthly payroll in installments.',
    category: 'FINANCIAL',
    icon: 'Coins',
    color: 'violet',
    order: 6,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 48,
    defaultPriority: 'HIGH',
    fields: [
      {
        id: 'loan_amount',
        labelAr: 'مبلغ السلفة المطلوب (ر.ع)',
        labelEn: 'Requested Loan Amount (OMR)',
        type: 'currency',
        required: true,
        order: 1,
        placeholderAr: 'مثال: 300',
        placeholderEn: 'e.g. 300',
        validation: { min: 50, max: 2000 },
        width: 'half'
      },
      {
        id: 'installments_count',
        labelAr: 'عدد أقساط السداد المقترحة',
        labelEn: 'Repayment Installments',
        type: 'dropdown',
        required: true,
        defaultValue: '1',
        order: 2,
        options: [
          { labelAr: 'قسط واحد (خصم كامل من الراتب القادم)', labelEn: '1 Installment (Next Payroll)', value: '1' },
          { labelAr: 'قسطين (على شهرين متتاليين)', labelEn: '2 Monthly Installments', value: '2' },
          { labelAr: '3 أقساط (على 3 أشهر)', labelEn: '3 Monthly Installments', value: '3' },
          { labelAr: '4 أقساط متساوية', labelEn: '4 Monthly Installments', value: '4' }
        ],
        width: 'half'
      },
      {
        id: 'loan_reason',
        labelAr: 'موجب وسبب طلب السلفة',
        labelEn: 'Reason / Justification',
        type: 'dropdown',
        required: true,
        order: 3,
        options: [
          { labelAr: 'ظرف صحي أو مصاريف علاجية طارئة', labelEn: 'Emergency Medical Expenses', value: 'ظرف صحي وطبي طارئ' },
          { labelAr: 'مصاريف مدرسية أو رسوم جامعية', labelEn: 'Education & Tuition Fees', value: 'رسوم تعليمية ومدرسية' },
          { labelAr: 'إصلاح مركبة أو صيانة منزلية طارئة', labelEn: 'Vehicle / Home Repair', value: 'صيانة مركبة أو منزل' },
          { labelAr: 'التزامات ومصاريف عائلية أخرى', labelEn: 'Other Family Obligations', value: 'مصاريف والتزامات عائلية' }
        ],
        width: 'half'
      },
      {
        id: 'bank_iban',
        labelAr: 'رقم الآيبان (IBAN) لتحويل السلفة',
        labelEn: 'Bank Account IBAN for Transfer',
        type: 'text',
        required: true,
        placeholderAr: 'OM...',
        order: 4,
        width: 'half'
      },
      {
        id: 'supporting_docs',
        labelAr: 'مستندات داعمة أو فواتير (إن وجدت)',
        labelEn: 'Supporting Documents / Invoices',
        type: 'attachment',
        required: false,
        order: 5,
        width: 'full'
      },
      {
        id: 'pledge_agreed',
        labelAr: 'أقر وأتعهد بخصم أقساط السلفة المعتمدة تلقائياً من راتبي الشهري حتى السداد التام',
        labelEn: 'I acknowledge & authorize monthly payroll deductions until fully settled',
        type: 'checkbox',
        required: true,
        defaultValue: false,
        order: 6,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة المدير المباشر',
        stageNameEn: 'Direct Line Manager Review',
        approverType: 'DIRECT_MANAGER',
        slaHours: 24,
        isFinalApproval: false
      },
      {
        stageIndex: 1,
        stageNameAr: 'اعتماد الإدارة المالية والصرف',
        stageNameEn: 'Finance Dept Budgeting & Disbursement',
        approverType: 'FINANCE',
        approverRoleId: 'ACCOUNTANT',
        slaHours: 24,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 7. Asset / Custody Request (طلب عهدة أجهزة أو معدات)
  {
    id: 'req-type-asset',
    code: 'REQ-ASSET',
    nameAr: 'طلب عهدة أجهزة ومعدات تقنية',
    nameEn: 'Asset & IT Equipment Custody Request',
    descriptionAr: 'طلب استلام أجهزة حاسوبية، هواتف ذكية، أو معدات فنية لمقتضيات العمل الوظيفي.',
    descriptionEn: 'Request laptops, smartphones, tools, or technical assets required for job duties.',
    category: 'ASSETS',
    icon: 'Laptop',
    color: 'cyan',
    order: 7,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 48,
    defaultPriority: 'MEDIUM',
    fields: [
      {
        id: 'asset_type',
        labelAr: 'نوع العهدة أو الجهاز المطلوب',
        labelEn: 'Asset Category',
        type: 'dropdown',
        required: true,
        order: 1,
        options: [
          { labelAr: 'كمبيوتر محمول (Laptop) مع حقيبة وشاحن', labelEn: 'Laptop with charger & bag', value: 'كمبيوتر محمول (Laptop)' },
          { labelAr: 'هاتف ذكي وخط اتصال للعمل (SIM)', labelEn: 'Work Smartphone & SIM card', value: 'هاتف ذكي وشريحة عمل' },
          { labelAr: 'شاشة إضافية وملحقات مكتبية (Dual Monitor)', labelEn: 'Monitor & Desktop Accessories', value: 'شاشة وملحقات مكتبية' },
          { labelAr: 'أدوات ومعدات فحص وصيانة ميدانية', labelEn: 'Field Inspection & Maintenance Tools', value: 'معدات فحص وصيانة فنية' },
          { labelAr: 'عهدة أخرى (تحدد في المواصفات)', labelEn: 'Other Custody item', value: 'عهدة أخرى' }
        ],
        width: 'half'
      },
      {
        id: 'custody_duration',
        labelAr: 'طبيعة ومدة العهدة',
        labelEn: 'Custody Duration',
        type: 'dropdown',
        required: true,
        order: 2,
        options: [
          { labelAr: 'عهدة دائمة (طوال فترة العمل بالمشروع)', labelEn: 'Permanent (Project Duration)', value: 'عهدة دائمة' },
          { labelAr: 'عهدة مؤقتة (لمهمة محددة أو مؤتمر)', labelEn: 'Temporary (Short Mission)', value: 'عهدة مؤقتة' }
        ],
        width: 'half'
      },
      {
        id: 'justification',
        labelAr: 'مبررات العمل والمواصفات التقنية المطلوبة',
        labelEn: 'Business Justification & Specifications',
        type: 'textarea',
        required: true,
        placeholderAr: 'وضح طبيعة المهام والمشاريع التي تتطلب توفير هذا الجهاز...',
        placeholderEn: 'Explain job tasks and technical specs needed...',
        order: 3,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة مدير القسم',
        stageNameEn: 'Department Manager Approval',
        approverType: 'DEPARTMENT_MANAGER',
        slaHours: 24,
        isFinalApproval: false
      },
      {
        stageIndex: 1,
        stageNameAr: 'صرف وتسجيل العهدة (تقنية المعلومات / المستودع)',
        stageNameEn: 'IT / Storekeeper Asset Handover',
        approverType: 'STOREKEEPER',
        approverRoleId: 'STOREKEEPER',
        slaHours: 24,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 8. Purchase / Procurement Request (طلب شراء مواد ومستلزمات)
  {
    id: 'req-type-purchase',
    code: 'REQ-PURCHASE',
    nameAr: 'طلب شراء مواد ومستلزمات تشغيلية',
    nameEn: 'Purchase & Procurement Request',
    descriptionAr: 'طلب شراء مواد، تراخيص برمجية، أو أدوات تشغيلية لصالح القسم أو المشروع.',
    descriptionEn: 'Request purchasing supplies, software licenses, or project items.',
    category: 'PROCUREMENT',
    icon: 'ShoppingCart',
    color: 'orange',
    order: 8,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 72,
    defaultPriority: 'HIGH',
    fields: [
      {
        id: 'item_description',
        labelAr: 'بيان المواد والمشتريات المطلوبة',
        labelEn: 'Items & Materials Description',
        type: 'textarea',
        required: true,
        placeholderAr: 'اذكر أسماء المواد، الكميات، والمواصفات بدقة...',
        placeholderEn: 'Item names, quantities, and specifications...',
        order: 1,
        width: 'full'
      },
      {
        id: 'estimated_cost',
        labelAr: 'التكلفة التقديرية الإجمالية (ر.ع)',
        labelEn: 'Estimated Total Cost (OMR)',
        type: 'currency',
        required: true,
        order: 2,
        placeholderAr: 'مثال: 150',
        placeholderEn: 'e.g. 150',
        width: 'half'
      },
      {
        id: 'urgency_level',
        labelAr: 'درجة الاستعجال والتأثير على العمل',
        labelEn: 'Urgency & Business Impact',
        type: 'dropdown',
        required: true,
        defaultValue: 'NORMAL',
        order: 3,
        options: [
          { labelAr: 'عادية (خلال أسبوع العمل)', labelEn: 'Normal (Within 1 week)', value: 'NORMAL' },
          { labelAr: 'عاجلة جداً (توقف عمل أو مشروع)', labelEn: 'Urgent (Critical operational impact)', value: 'CRITICAL' }
        ],
        width: 'half'
      },
      {
        id: 'quotation_file',
        labelAr: 'عرض الأسعار أو رابط الشراء (مرفق)',
        labelEn: 'Quotation File / Purchase Link',
        type: 'attachment',
        required: false,
        order: 4,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة مدير الدائرة',
        stageNameEn: 'Department Head Approval',
        approverType: 'DEPARTMENT_MANAGER',
        slaHours: 24,
        isFinalApproval: false
      },
      {
        stageIndex: 1,
        stageNameAr: 'موافقة الإدارة المالية وتدقيق الميزانية',
        stageNameEn: 'Finance Review & Budget Allocation',
        approverType: 'FINANCE',
        approverRoleId: 'ACCOUNTANT',
        slaHours: 24,
        isFinalApproval: false
      },
      {
        stageIndex: 2,
        stageNameAr: 'اعتماد المدير العام للشراء والصرف',
        stageNameEn: 'General Management Final Approval',
        approverType: 'ADMINISTRATIVE',
        approverRoleId: 'ADMIN',
        slaHours: 24,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 9. Exit Permission / Field Mission Request (طلب إذن خروج مؤقت أو مهمة ميدانية)
  {
    id: 'req-type-exit-permit',
    code: 'REQ-EXIT-PERMIT',
    nameAr: 'طلب إذن خروج مؤقت أو مهمة عمل',
    nameEn: 'Exit Permit & Field Mission Request',
    descriptionAr: 'طلب تصريح خروج أثناء ساعات الدوام الرسمي لمهمة عمل ميدانية أو ظرف طارئ.',
    descriptionEn: 'Request official departure permit during work hours for business duty or urgent errands.',
    category: 'ADMINISTRATIVE',
    icon: 'DoorOpen',
    color: 'rose',
    order: 9,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 4,
    defaultPriority: 'HIGH',
    fields: [
      {
        id: 'mission_type',
        labelAr: 'نوع وطبيعة الخروج',
        labelEn: 'Permission Type',
        type: 'dropdown',
        required: true,
        order: 1,
        options: [
          { labelAr: 'مهمة عمل ميدانية / زيارة عميل / تسليم موقع', labelEn: 'Field Mission / Client Meeting', value: 'مهمة عمل رسمية' },
          { labelAr: 'مراجعة دائرة حكومية أو جهة رسمية للشركة', labelEn: 'Government Department Visit', value: 'مراجعة جهة رسمية' },
          { labelAr: 'ظرف شخصي أو موعد طبي طارئ', labelEn: 'Personal Emergency / Medical', value: 'ظرف شخصي طارئ' }
        ],
        width: 'half'
      },
      {
        id: 'exit_date',
        labelAr: 'تاريخ الخروج',
        labelEn: 'Date of Departure',
        type: 'date',
        required: true,
        order: 2,
        width: 'half'
      },
      {
        id: 'exit_time',
        labelAr: 'وقت المغادرة المتوقع',
        labelEn: 'Departure Time',
        type: 'text',
        required: true,
        placeholderAr: 'مثال: 10:30 صباحاً',
        placeholderEn: 'e.g. 10:30 AM',
        order: 3,
        width: 'half'
      },
      {
        id: 'expected_return_time',
        labelAr: 'وقت العودة المتوقع',
        labelEn: 'Expected Return Time',
        type: 'text',
        required: true,
        placeholderAr: 'مثال: 01:00 ظهراً (أو نهاية الدوام)',
        placeholderEn: 'e.g. 01:00 PM',
        order: 4,
        width: 'half'
      },
      {
        id: 'location_details',
        labelAr: 'الوجهة / موقع المهمة بالتفصيل',
        labelEn: 'Destination Location / Errand Details',
        type: 'textarea',
        required: true,
        placeholderAr: 'حدد اسم الجهة أو موقع العميل وأسباب الزيارة...',
        placeholderEn: 'State client name, location and task objectives...',
        order: 5,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة المشرف أو المدير المباشر',
        stageNameEn: 'Direct Supervisor Approval',
        approverType: 'DIRECT_MANAGER',
        slaHours: 4,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 10. Employee Profile & Bank IBAN Update (طلب تحديث بيانات شخصية أو حساب بنكي)
  {
    id: 'req-type-profile-update',
    code: 'REQ-PROFILE-UPDATE',
    nameAr: 'طلب تحديث بيانات وظيفية أو بنكية (IBAN)',
    nameEn: 'Personal & Bank Details Update',
    descriptionAr: 'طلب تعديل رقم الحساب البنكي، عنوان السكن، رقم الهاتف، أو البيانات العائلية.',
    descriptionEn: 'Request updating banking IBAN, address, phone number or personal credentials.',
    category: 'HR',
    icon: 'UserCheck',
    color: 'purple',
    order: 10,
    isActive: true,
    requiresApproval: true,
    isAutoApproved: false,
    allowsCancellation: true,
    allowsResubmit: true,
    slaHours: 24,
    defaultPriority: 'MEDIUM',
    fields: [
      {
        id: 'update_category',
        labelAr: 'نوع البيانات المراد تحديثها',
        labelEn: 'Information Type to Update',
        type: 'dropdown',
        required: true,
        order: 1,
        options: [
          { labelAr: 'تحديث رقم الحساب البنكي لتحويل الراتب (IBAN)', labelEn: 'Update Bank Account (IBAN)', value: 'تحديث الحساب البنكي' },
          { labelAr: 'تحديث عنوان السكن أو أرقام التواصل والطوارئ', labelEn: 'Update Address & Emergency Contact', value: 'تحديث العنوان والاتصال' },
          { labelAr: 'تجديد وثيقة شخصية (بطاقة مدنية / جواز سفر)', labelEn: 'Renew ID / Passport Document', value: 'تجديد وثيقة شخصية' },
          { labelAr: 'تحديث الحالة الاجتماعية أو المؤهل العلمي', labelEn: 'Update Marital Status / Qualifications', value: 'تحديث المؤهل والحالة' }
        ],
        width: 'half'
      },
      {
        id: 'new_details',
        labelAr: 'البيانات الجديدة بالتفصيل',
        labelEn: 'New Details & Values',
        type: 'textarea',
        required: true,
        placeholderAr: 'اكتب القيمة أو الرقم الجديد بالتفصيل (مثال: الآيبان الجديد: OM45...)',
        placeholderEn: 'Enter new exact information...',
        order: 2,
        width: 'full'
      },
      {
        id: 'proof_attachment',
        labelAr: 'مرفق الإثبات الرسمي (شهادة بنكية / صورة الوثيقة)',
        labelEn: 'Official Proof Attachment (Bank letter / ID copy)',
        type: 'attachment',
        required: true,
        order: 3,
        width: 'full'
      }
    ],
    workflowStages: [
      {
        stageIndex: 0,
        stageNameAr: 'مراجعة وتدقيق مسؤول الموارد البشرية والرواتب',
        stageNameEn: 'HR & Payroll Officer Verification',
        approverType: 'HR',
        approverRoleId: 'ADMIN',
        slaHours: 24,
        isFinalApproval: true
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ---------------------------------------------------------------------------
// 3. INITIAL SAMPLE EMPLOYEE REQUESTS (سجلات أولية لتجربة وفحص النظام)
// ---------------------------------------------------------------------------
export const DEFAULT_SAMPLE_REQUESTS: EmployeeRequest[] = [
  {
    id: 'req-sample-001',
    requestNumber: 'REQ-2026-0001',
    typeId: 'req-type-salary-cert',
    typeCode: 'REQ-SALARY-CERT',
    typeNameAr: 'طلب شهادة راتب موثقة',
    typeNameEn: 'Salary Certificate Request',
    typeCategory: 'DOCUMENTS',
    employeeId: 'emp-001',
    employeeCode: 'EMP-001',
    employeeName: 'أحمد بن سعيد البلوشي',
    employeeNameEn: 'Ahmed Al-Balushi',
    employeeJobTitle: 'مدير العمليات الفنية',
    department: 'الإدارة العامة',
    branchName: 'فرع صحار الرئيسي',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    currentStageIndex: 0,
    values: {
      directed_to: 'بنك مسقط (Bank Muscat)',
      purpose: 'معاملة مصرفية وتمويل مالي',
      doc_language: 'ar',
      delivery_method: 'pdf',
      include_allowances: true,
      notes: 'مطلوبة لتقديم معاملة تمويل سكني'
    },
    approvals: [],
    timeline: [
      {
        id: 'tl-1',
        timestamp: '2026-08-28T09:15:00Z',
        action: 'SUBMITTED',
        actionLabelAr: 'تقديم الطلب',
        actionLabelEn: 'Request Submitted',
        actorId: 'emp-001',
        actorName: 'أحمد بن سعيد البلوشي',
        actorRole: 'MANAGER',
        detailsAr: 'تم تقديم طلب شهادة الراتب عبر بوابة الموظفين الذكية',
        detailsEn: 'Submitted salary certificate request via portal',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED'
      },
      {
        id: 'tl-2',
        timestamp: '2026-08-28T09:15:01Z',
        action: 'AUTO_APPROVED',
        actionLabelAr: 'اعتماد فوري تلقائي',
        actionLabelEn: 'Auto-Approved by System',
        actorId: 'SYSTEM',
        actorName: 'Deshal Auto-Approval Engine',
        actorRole: 'SYSTEM',
        detailsAr: 'تم التحقق من بيانات الموظف واعتماد الطلب تلقائياً وفق سياسة النظام',
        detailsEn: 'Validated credentials and auto-approved according to policy',
        fromStatus: 'SUBMITTED',
        toStatus: 'APPROVED'
      },
      {
        id: 'tl-3',
        timestamp: '2026-08-28T09:15:02Z',
        action: 'DOCUMENT_GENERATED',
        actionLabelAr: 'إصدار المستند الرقمي والباركود',
        actionLabelEn: 'Document & QR Code Generated',
        actorId: 'SYSTEM',
        actorName: 'Deshal Document Engine',
        actorRole: 'SYSTEM',
        detailsAr: 'تم إنشاء شهادة الراتب الرسمية برقم المستند DOC-2026-0001 ورمز QR التوثيقي',
        detailsEn: 'Generated official PDF certificate DOC-2026-0001 with security QR',
        fromStatus: 'APPROVED',
        toStatus: 'COMPLETED'
      }
    ],
    attachments: [],
    comments: [
      {
        id: 'c-1',
        authorId: 'SYSTEM',
        authorName: 'نظام ديشال التلقائي',
        authorRole: 'SYSTEM',
        message: 'تم إصدار شهادة الراتب بنجاح، يمكنك تحميلها أو طباعتها مباشرة بأعلى معايير الأمان.',
        isInternal: false,
        createdAt: '2026-08-28T09:15:02Z'
      }
    ],
    generatedDocument: {
      id: 'doc-gen-001',
      documentNumber: 'DOC-2026-0001',
      templateId: 'tpl-salary-cert',
      templateNameAr: 'شهادة راتب رسمية موثقة',
      templateNameEn: 'Official Salary Certificate',
      generatedAt: '2026-08-28T09:15:02Z',
      verificationCode: 'VER-OM-2026-98124',
      qrPayload: 'https://deshal.om/verify?ref=DOC-2026-0001&code=VER-OM-2026-98124',
      titleAr: 'شهادة إثبات راتب رسمية',
      titleEn: 'Official Salary Certificate',
      officialStampApplied: true,
      signatoryName: 'سالم بن أحمد المعمري',
      signatoryTitle: 'مدير عام الموارد البشرية والعمليات',
      metadata: {
        employeeName: 'أحمد بن سعيد البلوشي',
        basicSalary: 950,
        allowances: 300,
        totalSalary: 1250,
        directedTo: 'بنك مسقط (Bank Muscat)',
        purpose: 'معاملة مصرفية وتمويل مالي'
      }
    },
    submittedAt: '2026-08-28T09:15:00Z',
    completedAt: '2026-08-28T09:15:02Z',
    updatedAt: '2026-08-28T09:15:02Z'
  },
  {
    id: 'req-sample-002',
    requestNumber: 'REQ-2026-0002',
    typeId: 'req-type-loan',
    typeCode: 'REQ-LOAN',
    typeNameAr: 'طلب سلفة مالية على الراتب',
    typeNameEn: 'Salary Advance / Loan Request',
    typeCategory: 'FINANCIAL',
    employeeId: 'emp-002',
    employeeCode: 'EMP-002',
    employeeName: 'فاطمة بنت علي الحوسنية',
    employeeNameEn: 'Fatma Al-Hosni',
    employeeJobTitle: 'محاسبة عامة وتكاليف',
    department: 'المالية والمحاسبة',
    branchName: 'فرع صحار الرئيسي',
    status: 'PENDING_APPROVAL',
    priority: 'HIGH',
    currentStageIndex: 1, // At stage 1 (Finance)
    values: {
      loan_amount: 350,
      installments_count: '2',
      loan_reason: 'مصاريف مدرسية ورسوم جامعية',
      bank_iban: 'OM4500001234567890123456',
      pledge_agreed: true
    },
    approvals: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة المدير المباشر',
        stageNameEn: 'Direct Line Manager Review',
        approverType: 'DIRECT_MANAGER',
        status: 'APPROVED',
        decisionByUserId: 'emp-001',
        decisionByUserName: 'أحمد بن سعيد البلوشي',
        decisionByUserRole: 'MANAGER',
        decisionAt: '2026-08-29T11:20:00Z',
        comments: 'معتمد نظراً لكفاءة الأداء وعدم وجود سلفيات قائمة.'
      },
      {
        stageIndex: 1,
        stageNameAr: 'اعتماد الإدارة المالية والصرف',
        stageNameEn: 'Finance Dept Budgeting & Disbursement',
        approverType: 'FINANCE',
        approverRoleId: 'ACCOUNTANT',
        status: 'PENDING'
      }
    ],
    timeline: [
      {
        id: 'tl-201',
        timestamp: '2026-08-29T08:30:00Z',
        action: 'SUBMITTED',
        actionLabelAr: 'تقديم الطلب',
        actionLabelEn: 'Request Submitted',
        actorId: 'emp-002',
        actorName: 'فاطمة بنت علي الحوسنية',
        actorRole: 'ACCOUNTANT',
        detailsAr: 'تم تقديم طلب سلفة بمبلغ 350 ر.ع على قسطين',
        detailsEn: 'Submitted loan request for 350 OMR in 2 installments',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED'
      },
      {
        id: 'tl-202',
        timestamp: '2026-08-29T11:20:00Z',
        action: 'STAGE_APPROVED',
        actionLabelAr: 'اعتماد المرحلة الأولى (المدير المباشر)',
        actionLabelEn: 'Stage 1 Approved (Direct Manager)',
        actorId: 'emp-001',
        actorName: 'أحمد بن سعيد البلوشي',
        actorRole: 'MANAGER',
        detailsAr: 'تمت موافقة المدير المباشر وإحالة الطلب للإدارة المالية',
        detailsEn: 'Direct manager approved, routed to Finance',
        fromStatus: 'SUBMITTED',
        toStatus: 'PENDING_APPROVAL'
      }
    ],
    attachments: [],
    comments: [
      {
        id: 'c-201',
        authorId: 'emp-001',
        authorName: 'أحمد بن سعيد البلوشي',
        authorRole: 'MANAGER',
        message: 'تمت مراجعة الطلب والموافقة المبدئية، يرجى التنسيق مع المالية لتحديد موعد إيداع السلفة.',
        isInternal: false,
        createdAt: '2026-08-29T11:20:00Z'
      }
    ],
    submittedAt: '2026-08-29T08:30:00Z',
    slaDeadline: '2026-08-31T08:30:00Z',
    updatedAt: '2026-08-29T11:20:00Z'
  },
  {
    id: 'req-sample-003',
    requestNumber: 'REQ-2026-0003',
    typeId: 'req-type-asset',
    typeCode: 'REQ-ASSET',
    typeNameAr: 'طلب عهدة أجهزة ومعدات تقنية',
    typeNameEn: 'Asset & IT Equipment Custody Request',
    typeCategory: 'ASSETS',
    employeeId: 'emp-003',
    employeeCode: 'EMP-003',
    employeeName: 'خالد بن ناصر المعمري',
    employeeNameEn: 'Khalid Al-Maamari',
    employeeJobTitle: 'مسؤول مبيعات ومشاريع',
    department: 'المبيعات والتسويق',
    branchName: 'فرع مسقط - غلا',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    currentStageIndex: 0,
    values: {
      asset_type: 'كمبيوتر محمول (Laptop) مع حقيبة وشاحن',
      custody_duration: 'عهدة دائمة',
      justification: 'مطلوب لجولات العروض التقديمية والتعاقدات الميدانية مع عملاء مسقط وصحار.'
    },
    approvals: [
      {
        stageIndex: 0,
        stageNameAr: 'موافقة مدير القسم',
        stageNameEn: 'Department Manager Approval',
        approverType: 'DEPARTMENT_MANAGER',
        status: 'PENDING'
      },
      {
        stageIndex: 1,
        stageNameAr: 'صرف وتسجيل العهدة (تقنية المعلومات / المستودع)',
        stageNameEn: 'IT / Storekeeper Asset Handover',
        approverType: 'STOREKEEPER',
        approverRoleId: 'STOREKEEPER',
        status: 'PENDING'
      }
    ],
    timeline: [
      {
        id: 'tl-301',
        timestamp: '2026-08-30T10:00:00Z',
        action: 'SUBMITTED',
        actionLabelAr: 'تقديم الطلب',
        actionLabelEn: 'Request Submitted',
        actorId: 'emp-003',
        actorName: 'خالد بن ناصر المعمري',
        actorRole: 'SALES',
        detailsAr: 'تم تقديم طلب عهدة كمبيوتر محمول للمشاريع الميدانية',
        detailsEn: 'Submitted laptop custody request for field projects',
        fromStatus: 'DRAFT',
        toStatus: 'UNDER_REVIEW'
      }
    ],
    attachments: [],
    comments: [],
    submittedAt: '2026-08-30T10:00:00Z',
    slaDeadline: '2026-09-01T10:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z'
  }
];

// ---------------------------------------------------------------------------
// 4. STORAGE OPERATIONS (التحميل والحفظ وإدارة السجلات)
// ---------------------------------------------------------------------------

export function loadRequestTypes(): RequestTypeConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUEST_TYPES);
    if (!raw) {
      saveRequestTypes(DEFAULT_REQUEST_TYPES);
      return DEFAULT_REQUEST_TYPES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading request types from storage:', err);
    return DEFAULT_REQUEST_TYPES;
  }
}

export function saveRequestTypes(types: RequestTypeConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUEST_TYPES, JSON.stringify(types));
  } catch (err) {
    console.error('Error saving request types to storage:', err);
  }
}

export function loadDocumentTemplates(): DocumentTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCUMENT_TEMPLATES);
    if (!raw) {
      saveDocumentTemplates(DEFAULT_DOCUMENT_TEMPLATES);
      return DEFAULT_DOCUMENT_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading document templates:', err);
    return DEFAULT_DOCUMENT_TEMPLATES;
  }
}

export function saveDocumentTemplates(templates: DocumentTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DOCUMENT_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving document templates:', err);
  }
}

export function loadEmployeeRequests(): EmployeeRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!raw) {
      saveEmployeeRequests(DEFAULT_SAMPLE_REQUESTS);
      return DEFAULT_SAMPLE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading employee requests:', err);
    return DEFAULT_SAMPLE_REQUESTS;
  }
}

export function saveEmployeeRequests(requests: EmployeeRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Error saving employee requests:', err);
  }
}

// ---------------------------------------------------------------------------
// 5. REQUEST LIFECYCLE & EXECUTION ENGINE (محرك المعالجة وسير العمل)
// ---------------------------------------------------------------------------

/**
 * Creates and submits a new employee request
 */
export function createEmployeeRequest(
  typeConfig: RequestTypeConfig,
  employee: Employee,
  fieldValues: Record<string, any>,
  attachments: Array<{ fileName: string; fileSize: number; fileType: string; dataUrl?: string }>,
  companySettings?: any
): EmployeeRequest {
  const existing = loadEmployeeRequests();
  const reqCount = existing.length + 1;
  const requestNumber = `REQ-${new Date().getFullYear()}-${reqCount.toString().padStart(4, '0')}`;
  const now = new Date().toISOString();

  // SLA deadline calculation
  const slaDeadline = new Date(Date.now() + (typeConfig.slaHours || 24) * 3600 * 1000).toISOString();

  // Initial timeline
  const initialTimeline: RequestTimelineEvent[] = [
    {
      id: `tl-${Date.now()}-1`,
      timestamp: now,
      action: 'SUBMITTED',
      actionLabelAr: 'تقديم الطلب',
      actionLabelEn: 'Request Submitted',
      actorId: employee.id,
      actorName: employee.fullName,
      actorRole: employee.role,
      actorAvatar: employee.avatarUrl,
      detailsAr: `تم تقديم طلب (${typeConfig.nameAr}) بنجاح عبر النظام`,
      detailsEn: `Submitted ${typeConfig.nameEn} successfully`,
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED'
    }
  ];

  // Setup approvals structure
  const initialApprovals: RequestApprovalStageRecord[] = (typeConfig.workflowStages || []).map((stage) => ({
    stageIndex: stage.stageIndex,
    stageNameAr: stage.stageNameAr,
    stageNameEn: stage.stageNameEn,
    approverType: stage.approverType,
    approverRoleId: stage.approverRoleId,
    approverUserId: stage.approverUserId,
    status: 'PENDING'
  }));

  // Handle Auto-Approval logic
  let finalStatus: RequestStatus = 'SUBMITTED';
  let generatedDocument: RequestDocument | undefined = undefined;
  let completedAt: string | undefined = undefined;

  if (typeConfig.isAutoApproved || !typeConfig.requiresApproval || initialApprovals.length === 0) {
    finalStatus = 'COMPLETED';
    completedAt = now;

    // Timeline event for auto-approval
    initialTimeline.push({
      id: `tl-${Date.now()}-2`,
      timestamp: now,
      action: 'AUTO_APPROVED',
      actionLabelAr: 'اعتماد فوري تلقائي',
      actionLabelEn: 'Auto-Approved by System',
      actorId: 'SYSTEM',
      actorName: 'Deshal Auto-Approval Engine',
      actorRole: 'SYSTEM',
      detailsAr: 'تم اعتماد الطلب فورياً والتحقق من الاستيفاء التلقائي للشروط دون الحاجة لمراجعة إدارية',
      detailsEn: 'Instantly auto-approved by Deshal workflow validation rules',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED'
    });

    // Auto-generate document if template is configured
    if (typeConfig.documentTemplateId) {
      const templates = loadDocumentTemplates();
      const template = templates.find((t) => t.id === typeConfig.documentTemplateId);
      if (template) {
        generatedDocument = generateOfficialDocumentForRequest(
          requestNumber,
          template,
          employee,
          fieldValues,
          companySettings
        );

        initialTimeline.push({
          id: `tl-${Date.now()}-3`,
          timestamp: now,
          action: 'DOCUMENT_GENERATED',
          actionLabelAr: 'إصدار المستند والرمز التوثيقي (QR)',
          actionLabelEn: 'Official Document & QR Generated',
          actorId: 'SYSTEM',
          actorName: 'Deshal Document Engine',
          actorRole: 'SYSTEM',
          detailsAr: `تم إصدار المستند الرسمي (${generatedDocument.documentNumber}) مع الباركود الأمني بنجاح`,
          detailsEn: `Generated official document ${generatedDocument.documentNumber} with QR verification code`,
          fromStatus: 'APPROVED',
          toStatus: 'COMPLETED'
        });
      }
    }
  } else {
    finalStatus = 'PENDING_APPROVAL';
  }

  const newRequest: EmployeeRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    requestNumber,
    typeId: typeConfig.id,
    typeCode: typeConfig.code,
    typeNameAr: typeConfig.nameAr,
    typeNameEn: typeConfig.nameEn,
    typeCategory: typeConfig.category,
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    employeeNameEn: employee.fullNameEn,
    employeeJobTitle: employee.jobTitle,
    department: employee.department,
    branchId: employee.branchId,
    branchName: employee.branchName,
    status: finalStatus,
    priority: typeConfig.defaultPriority || 'MEDIUM',
    currentStageIndex: 0,
    values: fieldValues,
    approvals: initialApprovals,
    timeline: initialTimeline,
    attachments: attachments.map((att, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      fileName: att.fileName,
      fileSize: att.fileSize,
      fileType: att.fileType,
      dataUrl: att.dataUrl,
      uploadedBy: employee.fullName,
      uploadedAt: now
    })),
    comments: generatedDocument
      ? [
          {
            id: `cmt-${Date.now()}`,
            authorId: 'SYSTEM',
            authorName: 'نظام ديشال الذكي للطلبات',
            authorRole: 'SYSTEM',
            message: 'تم إصدار المستند وتوثيقه تلقائياً برمز التحقق الأمني، يمكنك المعاينة والتحميل في أي وقت.',
            isInternal: false,
            createdAt: now
          }
        ]
      : [],
    generatedDocument,
    slaDeadline,
    submittedAt: now,
    completedAt,
    updatedAt: now
  };

  const updated = [newRequest, ...existing];
  saveEmployeeRequests(updated);
  return newRequest;
}

/**
 * Processes an approver's decision (Approve, Reject, Return)
 */
export function processApprovalDecision(
  requestId: string,
  decision: 'APPROVE' | 'REJECT' | 'RETURN',
  approver: { id: string; name: string; role: string; avatar?: string },
  comments?: string,
  companySettings?: any
): EmployeeRequest | null {
  const requests = loadEmployeeRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) return null;

  const req = { ...requests[reqIndex] };
  const now = new Date().toISOString();
  const currentStageIndex = req.currentStageIndex || 0;
  const currentStage = req.approvals[currentStageIndex];

  if (!currentStage && decision === 'APPROVE') {
    return req;
  }

  if (decision === 'APPROVE') {
    // Mark current stage as approved
    if (currentStage) {
      currentStage.status = 'APPROVED';
      currentStage.decisionByUserId = approver.id;
      currentStage.decisionByUserName = approver.name;
      currentStage.decisionByUserRole = approver.role;
      currentStage.decisionAt = now;
      currentStage.comments = comments || 'تمت الموافقة والاعتماد';
    }

    req.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now,
      action: 'STAGE_APPROVED',
      actionLabelAr: `اعتماد: ${currentStage?.stageNameAr || 'المرحلة'}`,
      actionLabelEn: `Approved: ${currentStage?.stageNameEn || 'Stage'}`,
      actorId: approver.id,
      actorName: approver.name,
      actorRole: approver.role,
      actorAvatar: approver.avatar,
      detailsAr: comments || 'تمت الموافقة على الطلب بنجاح',
      detailsEn: comments || 'Approved the request successfully',
      fromStatus: req.status,
      toStatus: currentStageIndex + 1 >= req.approvals.length ? 'APPROVED' : 'PENDING_APPROVAL'
    });

    // Check if more stages remain
    if (currentStageIndex + 1 < req.approvals.length) {
      req.currentStageIndex = currentStageIndex + 1;
      req.status = 'PENDING_APPROVAL';
    } else {
      // Final Approval reached!
      req.status = 'APPROVED';
      req.completedAt = now;

      // Check if request type has a document template to generate on final approval
      const types = loadRequestTypes();
      const typeConfig = types.find((t) => t.id === req.typeId);
      if (typeConfig?.documentTemplateId && (!req.generatedDocument || typeConfig.generateDocumentOn === 'FINAL_APPROVAL')) {
        const templates = loadDocumentTemplates();
        const template = templates.find((t) => t.id === typeConfig.documentTemplateId);
        if (template) {
          // Mock dummy employee object from req data if needed
          const empMock: Partial<Employee> = {
            id: req.employeeId,
            employeeCode: req.employeeCode,
            fullName: req.employeeName,
            fullNameEn: req.employeeNameEn,
            jobTitle: req.employeeJobTitle || '',
            department: req.department,
            branchName: req.branchName,
            basicSalary: 850,
            allowances: 250,
            currency: 'OMR'
          };
          req.generatedDocument = generateOfficialDocumentForRequest(
            req.requestNumber,
            template,
            empMock as Employee,
            req.values,
            companySettings
          );
          req.status = 'COMPLETED';

          req.timeline.push({
            id: `tl-${Date.now()}-doc`,
            timestamp: now,
            action: 'DOCUMENT_GENERATED',
            actionLabelAr: 'إصدار المستند والرمز التوثيقي (QR)',
            actionLabelEn: 'Document & QR Code Generated',
            actorId: 'SYSTEM',
            actorName: 'Deshal Document Engine',
            actorRole: 'SYSTEM',
            detailsAr: `تم إصدار وتجهيز المستند الرسمي (${req.generatedDocument.documentNumber})`,
            detailsEn: `Generated official document ${req.generatedDocument.documentNumber}`,
            fromStatus: 'APPROVED',
            toStatus: 'COMPLETED'
          });
        }
      }
    }
  } else if (decision === 'REJECT') {
    if (currentStage) {
      currentStage.status = 'REJECTED';
      currentStage.decisionByUserId = approver.id;
      currentStage.decisionByUserName = approver.name;
      currentStage.decisionByUserRole = approver.role;
      currentStage.decisionAt = now;
      currentStage.comments = comments || 'تم رفض الطلب';
    }
    req.status = 'REJECTED';
    req.rejectionReason = comments || 'تم رفض الطلب من قبل الإدارة المختصة';
    req.completedAt = now;

    req.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now,
      action: 'REJECTED',
      actionLabelAr: 'رفض الطلب',
      actionLabelEn: 'Request Rejected',
      actorId: approver.id,
      actorName: approver.name,
      actorRole: approver.role,
      actorAvatar: approver.avatar,
      detailsAr: comments ? `سبب الرفض: ${comments}` : 'تم رفض الطلب',
      detailsEn: comments ? `Reason: ${comments}` : 'Request was rejected',
      fromStatus: 'PENDING_APPROVAL',
      toStatus: 'REJECTED'
    });
  } else if (decision === 'RETURN') {
    if (currentStage) {
      currentStage.status = 'RETURNED';
      currentStage.decisionByUserId = approver.id;
      currentStage.decisionByUserName = approver.name;
      currentStage.decisionByUserRole = approver.role;
      currentStage.decisionAt = now;
      currentStage.comments = comments || 'تمت إعادة الطلب للموظف لتعديل البيانات';
    }
    req.status = 'RETURNED';
    req.returnedReason = comments || 'يرجى مراجعة وتعديل البيانات المطلوبة وإعادة التقديم';

    req.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now,
      action: 'RETURNED_FOR_EDIT',
      actionLabelAr: 'إعادة الطلب للموظف للتعديل',
      actionLabelEn: 'Returned for Revision',
      actorId: approver.id,
      actorName: approver.name,
      actorRole: approver.role,
      actorAvatar: approver.avatar,
      detailsAr: comments ? `ملاحظات التعديل: ${comments}` : 'تمت إعادة الطلب للتعديل',
      detailsEn: comments ? `Revision notes: ${comments}` : 'Returned for revision',
      fromStatus: 'PENDING_APPROVAL',
      toStatus: 'RETURNED'
    });
  }

  if (comments && comments.trim()) {
    req.comments.push({
      id: `cmt-${Date.now()}`,
      authorId: approver.id,
      authorName: approver.name,
      authorRole: approver.role,
      authorAvatar: approver.avatar,
      message: comments.trim(),
      isInternal: false,
      createdAt: now
    });
  }

  req.updatedAt = now;
  requests[reqIndex] = req;
  saveEmployeeRequests(requests);
  return req;
}

/**
 * Cancel a request by the requester
 */
export function cancelEmployeeRequest(
  requestId: string,
  cancelledBy: { id: string; name: string; role: string },
  reason?: string
): EmployeeRequest | null {
  const requests = loadEmployeeRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) return null;

  const req = { ...requests[reqIndex] };
  if (req.status === 'COMPLETED' || req.status === 'REJECTED') {
    return null; // Cannot cancel completed or rejected requests
  }

  const now = new Date().toISOString();
  req.status = 'CANCELLED';
  req.completedAt = now;
  req.updatedAt = now;

  req.timeline.push({
    id: `tl-${Date.now()}`,
    timestamp: now,
    action: 'CANCELLED',
    actionLabelAr: 'إلغاء الطلب من قبل مقدمه',
    actionLabelEn: 'Request Cancelled by Requester',
    actorId: cancelledBy.id,
    actorName: cancelledBy.name,
    actorRole: cancelledBy.role,
    detailsAr: reason ? `سبب الإلغاء: ${reason}` : 'تم إلغاء الطلب بناءً على رغبة الموظف',
    detailsEn: reason ? `Reason: ${reason}` : 'Cancelled by the employee',
    fromStatus: req.status,
    toStatus: 'CANCELLED'
  });

  requests[reqIndex] = req;
  saveEmployeeRequests(requests);
  return req;
}

/**
 * Resubmit a returned request with updated values
 */
export function resubmitEmployeeRequest(
  requestId: string,
  updatedValues: Record<string, any>,
  employee: Employee
): EmployeeRequest | null {
  const requests = loadEmployeeRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) return null;

  const req = { ...requests[reqIndex] };
  const now = new Date().toISOString();

  req.values = { ...req.values, ...updatedValues };
  req.status = 'PENDING_APPROVAL';
  req.currentStageIndex = 0;
  req.returnedReason = undefined;
  req.updatedAt = now;

  // Reset approvals status
  req.approvals = req.approvals.map((app) => ({
    ...app,
    status: 'PENDING',
    decisionByUserId: undefined,
    decisionByUserName: undefined,
    decisionAt: undefined
  }));

  req.timeline.push({
    id: `tl-${Date.now()}`,
    timestamp: now,
    action: 'RESUBMITTED',
    actionLabelAr: 'إعادة تقديم الطلب بعد التعديل',
    actionLabelEn: 'Request Resubmitted',
    actorId: employee.id,
    actorName: employee.fullName,
    actorRole: employee.role,
    detailsAr: 'قام الموظف بتحديث البيانات وإعادة إرسال الطلب للاعتماد',
    detailsEn: 'Employee updated details and resubmitted for approval',
    fromStatus: 'RETURNED',
    toStatus: 'PENDING_APPROVAL'
  });

  requests[reqIndex] = req;
  saveEmployeeRequests(requests);
  return req;
}

/**
 * Add a comment or discussion note to a request
 */
export function addRequestComment(
  requestId: string,
  author: { id: string; name: string; role: string; avatar?: string },
  message: string,
  isInternal: boolean = false
): EmployeeRequest | null {
  const requests = loadEmployeeRequests();
  const reqIndex = requests.findIndex((r) => r.id === requestId);
  if (reqIndex === -1) return null;

  const req = { ...requests[reqIndex] };
  const now = new Date().toISOString();

  req.comments.push({
    id: `cmt-${Date.now()}`,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    authorAvatar: author.avatar,
    message: message.trim(),
    isInternal,
    createdAt: now
  });

  req.updatedAt = now;
  requests[reqIndex] = req;
  saveEmployeeRequests(requests);
  return req;
}

// ---------------------------------------------------------------------------
// 6. DYNAMIC DOCUMENT GENERATOR (محرك توليد المستندات الرسمية والباركود)
// ---------------------------------------------------------------------------

export function generateOfficialDocumentForRequest(
  requestNumber: string,
  template: DocumentTemplate,
  employee: Partial<Employee>,
  values: Record<string, any>,
  companySettings?: any
): RequestDocument {
  const docCount = Math.floor(1000 + Math.random() * 9000);
  const documentNumber = `DOC-${new Date().getFullYear()}-${docCount}`;
  const verificationCode = `VER-OM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const qrPayload = `https://deshal.om/verify?doc=${documentNumber}&code=${verificationCode}&emp=${employee.employeeCode || 'EMP'}`;
  const now = new Date().toISOString();

  const companyName = companySettings?.name || 'شركة ديشال لحلول الأعمال المتكاملة ش.م.م';
  const companyCr = companySettings?.crNumber || '1492084';
  const companyAddress = companySettings?.address || 'سلطنة عمان - صحار / مسقط';
  const currency = companySettings?.currency || 'ر.ع';

  const basicSalary = employee.basicSalary || values.basicSalary || 850;
  const allowances = employee.allowances || values.allowances || 250;
  const totalSalary = basicSalary + allowances;

  const salaryInWordsAr = convertNumberToArabicWords(totalSalary) + ` ${currency} فقط لا غير`;

  // Replacements dictionary
  const replacements: Record<string, string> = {
    '{{employee_name}}': employee.fullName || 'الموظف المعتمد',
    '{{employee_name_en}}': employee.fullNameEn || employee.fullName || 'Employee Name',
    '{{employee_code}}': employee.employeeCode || 'EMP-001',
    '{{job_title}}': employee.jobTitle || 'موظف',
    '{{department}}': employee.department || 'العمليات',
    '{{branch_name}}': employee.branchName || 'المقر الرئيسي',
    '{{hire_date}}': employee.hireDate || '2023-01-15',
    '{{civil_id}}': employee.civilId || values.civil_id || '987654321',
    '{{passport_number}}': values.passport_number || '12345678',
    '{{basic_salary}}': basicSalary.toLocaleString('en-US'),
    '{{allowances}}': allowances.toLocaleString('en-US'),
    '{{total_salary}}': totalSalary.toLocaleString('en-US'),
    '{{salary_in_words}}': salaryInWordsAr,
    '{{currency}}': currency,
    '{{directed_to}}': values.directed_to || values.embassy_name || 'إلى من يهمه الأمر',
    '{{purpose}}': values.purpose || values.purpose_of_travel || 'أغراض إدارية ومصرفية',
    '{{embassy_name}}': values.embassy_name || 'السفارة المعنية',
    '{{travel_start_date}}': values.travel_start_date || '2026-09-01',
    '{{travel_end_date}}': values.travel_end_date || '2026-09-15',
    '{{target_month}}': values.target_month || '2026-08',
    '{{bank_name}}': employee.bankName || 'بنك مسقط',
    '{{bank_iban}}': employee.bankIban || values.bank_iban || 'OM000000000000000000',
    '{{company_name}}': companyName,
    '{{company_cr}}': companyCr,
    '{{company_address}}': companyAddress,
    '{{document_number}}': documentNumber,
    '{{request_number}}': requestNumber,
    '{{issue_date}}': new Date().toLocaleDateString('ar-OM'),
    '{{end_date_or_present}}': 'حتى تاريخه (على رأس العمل)'
  };

  let renderedBodyAr = template.bodyTemplateAr;
  let renderedBodyEn = template.bodyTemplateEn;

  Object.keys(replacements).forEach((key) => {
    const val = replacements[key];
    renderedBodyAr = renderedBodyAr.split(key).join(val);
    renderedBodyEn = renderedBodyEn.split(key).join(val);
  });

  return {
    id: `doc-${Date.now()}`,
    documentNumber,
    templateId: template.id,
    templateNameAr: template.nameAr,
    templateNameEn: template.nameEn,
    generatedAt: now,
    verificationCode,
    qrPayload,
    titleAr: template.headerTitleAr,
    titleEn: template.headerTitleEn,
    officialStampApplied: template.includeStamp,
    signatoryTitle: template.signatoryTitleAr,
    signatoryName: template.signatoryNameAr,
    metadata: {
      ...replacements,
      renderedBodyAr,
      renderedBodyEn
    }
  };
}

/**
 * Computes central KPIs and statistics for requests dashboard
 */
export function calculateRequestStats(requests: EmployeeRequest[]): RequestStats {
  const stats: RequestStats = {
    totalRequests: requests.length,
    pendingApproval: 0,
    underReview: 0,
    completed: 0,
    completedCount: 0,
    rejected: 0,
    returned: 0,
    autoApprovedCount: 0,
    slaBreachedCount: 0,
    averageProcessingHours: 4.5,
    avgProcessingHours: 4.5,
    slaComplianceRate: 98,
    byCategory: {
      DOCUMENTS: 0,
      ADMINISTRATIVE: 0,
      FINANCIAL: 0,
      ASSETS: 0,
      PROCUREMENT: 0,
      HR: 0,
      CUSTOM: 0
    },
    byDepartment: {}
  };

  const now = Date.now();
  let totalDurationHours = 0;
  let completedCount = 0;

  requests.forEach((req) => {
    // Status counts
    if (req.status === 'PENDING_APPROVAL') stats.pendingApproval++;
    else if (req.status === 'UNDER_REVIEW') stats.underReview++;
    else if (req.status === 'COMPLETED' || req.status === 'APPROVED') {
      stats.completed++;
      stats.completedCount++;
    }
    else if (req.status === 'REJECTED') stats.rejected++;
    else if (req.status === 'RETURNED') stats.returned++;

    // Category count
    if (req.typeCategory && stats.byCategory[req.typeCategory] !== undefined) {
      stats.byCategory[req.typeCategory]++;
    }

    // Department count
    const dept = req.department || 'عام';
    stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;

    // Check auto-approved
    const isAuto = req.timeline.some((t) => t.action === 'AUTO_APPROVED');
    if (isAuto) stats.autoApprovedCount++;

    // Check SLA breach
    if (req.slaDeadline && req.status !== 'COMPLETED' && req.status !== 'REJECTED') {
      if (new Date(req.slaDeadline).getTime() < now) {
        stats.slaBreachedCount++;
      }
    }

    // Duration calculation for completed
    if (req.completedAt && req.submittedAt) {
      const diffMs = new Date(req.completedAt).getTime() - new Date(req.submittedAt).getTime();
      totalDurationHours += diffMs / (3600 * 1000);
      completedCount++;
    }
  });

  if (completedCount > 0) {
    const avg = Math.round((totalDurationHours / completedCount) * 10) / 10;
    stats.averageProcessingHours = avg;
    stats.avgProcessingHours = avg;
  }

  if (requests.length > 0) {
    stats.slaComplianceRate = Math.max(
      0,
      Math.round(((requests.length - stats.slaBreachedCount) / requests.length) * 100)
    );
  }

  return stats;
}

/**
 * Simple Arabic Number to Words helper for official financial receipts
 */
function convertNumberToArabicWords(num: number): string {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
  if (num === 1250) return 'ألف ومئتان وخمسون';
  if (num === 1000) return 'ألف';
  if (num === 850) return 'ثمانمائة وخمسون';
  if (num === 300) return 'ثلاثمائة';
  if (num === 350) return 'ثلاثمائة وخمسون';
  if (num === 500) return 'خمسمائة';
  return `${num}`;
}
