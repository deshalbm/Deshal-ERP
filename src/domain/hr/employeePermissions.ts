/**
 * Employee Permissions & Role Matrix — Deshal ERP
 * Domain Layer: Role-permission mappings, permission configuration dictionary,
 * and permission evaluation logic.
 */

import { EmployeeRole, EmployeePermission } from "../../types";

export type PermissionCategory =
  | "vouchers"
  | "pos"
  | "inventory"
  | "purchases"
  | "crm"
  | "spaces"
  | "services"
  | "hr"
  | "attendance"
  | "requests"
  | "management";

export interface PermissionCategoryMeta {
  key: PermissionCategory;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
}

export const PERMISSION_CATEGORIES_META: PermissionCategoryMeta[] = [
  {
    key: "vouchers",
    titleAr: "المالية والحسابات والسندات",
    titleEn: "Financials & Vouchers",
    descriptionAr: "إدارة سندات القبض والصرف، القيود المحاسبية، الفواتير والتقارير الختامية",
    descriptionEn: "Vouchers, general ledger entries, tax invoices & financial reports",
    iconName: "Receipt"
  },
  {
    key: "pos",
    titleAr: "نقطة البيع والكاشير",
    titleEn: "POS Terminal & Cashier",
    descriptionAr: "إدارة ورديات نقطة البيع، المبيعات الفورية، الخصومات ودرج النقدية",
    descriptionEn: "POS shifts, fast counter checkout, discounts & cash drawer control",
    iconName: "ShoppingCart"
  },
  {
    key: "inventory",
    titleAr: "المخزون والمستودعات",
    titleEn: "Inventory & Warehousing",
    descriptionAr: "إدارة الاصناف، تسعير المنتجات، الجرد الدوري والمناقلات بين المخازن",
    descriptionEn: "Product catalog, stock levels, stocktake & warehouse transfers",
    iconName: "Package"
  },
  {
    key: "purchases",
    titleAr: "المشتريات والموردين",
    titleEn: "Purchases & Suppliers",
    descriptionAr: "إدارة أوامر الشراء، فواتير التوريد، والاعتمادات المالية للموردين",
    descriptionEn: "Purchase orders, vendor invoicing & purchase approvals",
    iconName: "Truck"
  },
  {
    key: "crm",
    titleAr: "إدارة العملاء والعلاقات (CRM)",
    titleEn: "CRM & Customers",
    descriptionAr: "سجل العملاء، تتبع فرص المبيعات، ومتابعة الأنشطة والاتصالات",
    descriptionEn: "Customer directory, sales pipeline deals & client activity tracking",
    iconName: "Users"
  },
  {
    key: "spaces",
    titleAr: "المساحات والعقارات والعقود",
    titleEn: "Spaces, Bookings & Contracts",
    descriptionAr: "إدارة العقارات، القاعات، حجز المساحات، وعقود الإيجار والأقساط",
    descriptionEn: "Property listings, space reservations & lease agreement management",
    iconName: "Building2"
  },
  {
    key: "services",
    titleAr: "الخدمات والباقات",
    titleEn: "Services & Packages",
    descriptionAr: "إدارة دليل الخدمات، التسعير، وحجز ومتابعة تنفيذ الخدمات",
    descriptionEn: "Service catalog, customized packages & booking execution",
    iconName: "Briefcase"
  },
  {
    key: "hr",
    titleAr: "الموارد البشرية والرواتب",
    titleEn: "HR & Payroll",
    descriptionAr: "سجلات الموظفين، مسيرات الرواتب (WPS)، والعقود وتصفية المستحقات",
    descriptionEn: "Staff directory, monthly WPS payroll processing & contract management",
    iconName: "UserCheck"
  },
  {
    key: "attendance",
    titleAr: "الحضور والانصراف والكشك",
    titleEn: "Attendance & Kiosk",
    descriptionAr: "سجلات الحضور، أجهزة الكشك اللوحي، الاعتمادات وصور التحقق",
    descriptionEn: "Attendance logs, tablet kiosk devices, approvals & verification photos",
    iconName: "Clock"
  },
  {
    key: "requests",
    titleAr: "الطلبات والمستندات",
    titleEn: "Requests & Documents",
    descriptionAr: "إدارة النماذج الإدارية، الطلبات الرسمية، والأرشيف الرقمي للوثائق",
    descriptionEn: "Administrative requests, approval workflows & document archive",
    iconName: "FileText"
  },
  {
    key: "management",
    titleAr: "الفروع وإعدادات النظام",
    titleEn: "Branches, System & Settings",
    descriptionAr: "إدارة الفروع والمستودعات، إعدادات الشركة، والتدقيق والرقابة العامة",
    descriptionEn: "Branch management, system configurations & auditor control",
    iconName: "Settings"
  }
];

export const PERMISSION_CONFIG: {
  id: EmployeePermission;
  label: string;
  category: PermissionCategory;
  description: string;
}[] = [
  // 1. Financials & Vouchers (vouchers)
  {
    id: "view_vouchers",
    label: "عرض وتصفح السندات والفواتير",
    category: "vouchers",
    description: "عرض سندات القبض والصرف والفواتير الضريبية وعروض الأسعار"
  },
  {
    id: "create_vouchers",
    label: "إنشاء وتحرير السندات والفواتير",
    category: "vouchers",
    description: "إمكانية تحرير سندات القبض والصرف، فواتير ضريبية وعروض أسعار"
  },
  {
    id: "edit_vouchers",
    label: "تعديل السندات المحررة",
    category: "vouchers",
    description: "تعديل المبالغ، البنود، أو الحسابات في السندات السابقة"
  },
  {
    id: "delete_vouchers",
    label: "حذف وإلغاء السندات",
    category: "vouchers",
    description: "صلاحية إلغاء أو حذف سندات القبض والصرف من السجل"
  },
  {
    id: "approve_vouchers",
    label: "اعتماد وتصديق السندات المالية",
    category: "vouchers",
    description: "الموافقة الاعتمادية النهائية على السندات والفواتير قبل الترحيل"
  },
  {
    id: "close_financial_period",
    label: "إغلاق الفترات المالية والسنوات المحاسبية",
    category: "vouchers",
    description: "إغلاق الشهر أو السنة المالية وترحيل الحسابات الختامية"
  },
  {
    id: "print_export_vouchers",
    label: "طباعة وتصدير السندات PDF",
    category: "vouchers",
    description: "تنزيل وطباعة السندات بنماذج A4 و A5 والإيصالات الحرارية"
  },
  {
    id: "apply_discounts",
    label: "منح الخصومات والتخفيضات",
    category: "vouchers",
    description: "صلاحية تطبيق خصومات سعرية على السندات والفواتير"
  },
  {
    id: "manage_general_ledger",
    label: "إدارة شجرة الحسابات وقيود اليومية",
    category: "vouchers",
    description: "إضافة وتعديل حسابات الدليل المحاسبي وترحيل قيود اليومية المحاسبية"
  },
  {
    id: "view_financial_reports",
    label: "عرض التقارير المالية والختامية",
    category: "vouchers",
    description: "عرض ميزان المراجعة، الأرباح والخسائر، والميزانية العمومية والتقارير المالية"
  },
  {
    id: "financial_admin_override",
    label: "تجاوز السقوف والقيود المالية الاستثنائية",
    category: "vouchers",
    description: "صلاحية التجاوز الإداري الاستثنائي للقيود والحدود المالية"
  },

  // 2. POS Terminal & Cashier (pos)
  {
    id: "pos_view_sales",
    label: "عرض سجلات ومبيعات نقطة البيع",
    category: "pos",
    description: "عرض الورديات السابقة وسجلات المبيعات والعمليات اليومية"
  },
  {
    id: "pos_open_shift",
    label: "فتح وغلق ورديات الكاشير",
    category: "pos",
    description: "بدء وردية جديدة، تسجيل المبلغ الافتتاحي، وإغلاق الوردية وحساب العجز/الزيادة"
  },
  {
    id: "pos_create_order",
    label: "إنشاء المبيعات وإصدار الفواتير الفورية",
    category: "pos",
    description: "تسجيل مبيعات نقطة البيع واستلام المبالغ نقداً أو بالبطاقة أو الأقساط"
  },
  {
    id: "pos_edit_order",
    label: "تعديل الطلبات المعلقة في نقطة البيع",
    category: "pos",
    description: "تعديل الكميات أو البنود في الطلبات الجارية أو المعلقة"
  },
  {
    id: "pos_apply_discount",
    label: "تطبيق خصومات نقطة البيع",
    category: "pos",
    description: "منح خصم مباشر على فاتورة الكاشير أو الأصناف الفردية"
  },
  {
    id: "pos_void_item",
    label: "إلغاء الأصناف أو الطلبات في الكاشير",
    category: "pos",
    description: "حذف صنف من سلة الشراء أو إلغاء الطلب بالكامل قبل إتمام الدفع"
  },
  {
    id: "pos_cash_drawer",
    label: "فتح درج النقدية يدويًا",
    category: "pos",
    description: "فتح درج النقدية بدون عملية بيع لأغراض التدقيق أو النثرية"
  },
  {
    id: "pos_close_shift_override",
    label: "اعتماد وإغلاق الوردية وتصفية الفروقات",
    category: "pos",
    description: "تصفية واعتماد فروقات النقدية وإغلاق ورديات الكاشير إدارياً"
  },
  {
    id: "pos_settings",
    label: "إعدادات وطابعات وأجهزة الكاشير",
    category: "pos",
    description: "إعداد شاشات الكاشير والطابعات الحرارية والأجهزة الملحقة"
  },

  // 3. Inventory & Warehousing (inventory)
  {
    id: "view_inventory",
    label: "عرض المنتجات وسجلات المخزون",
    category: "inventory",
    description: "عرض دليل المنتجات، كميات الجرد، وأسعار التكلفة والبيع"
  },
  {
    id: "manage_inventory",
    label: "إدارة المخزون والتسعير",
    category: "inventory",
    description: "إضافة وتعديل المنتجات، تعديل كميات الجرد وتحديث أسعار التكلفة والبيع"
  },
  {
    id: "delete_inventory",
    label: "حذف وإلغاء أصناف المنتجات",
    category: "inventory",
    description: "حذف الأصناف أو أرشفة المنتجات من دليل المخزون"
  },
  {
    id: "manage_transfers",
    label: "المناقلات والتحويل المخزني",
    category: "inventory",
    description: "تحويل البضائع والأصناف بين مستودعات وفروع الشركة"
  },
  {
    id: "approve_transfers",
    label: "اعتماد واستلام التحويلات المخزنية",
    category: "inventory",
    description: "الموافقة الاعتمادية وتأكيد استلام البضائع المحولة بين المستودعات"
  },
  {
    id: "inventory_stocktake",
    label: "إجراء وتسوية الجرد المخزني",
    category: "inventory",
    description: "تسجيل كميات الجرد الفعلي وتسوية العجز أو الزيادة في المخزون"
  },
  {
    id: "inventory_categories",
    label: "إدارة التصنيفات والوحدات",
    category: "inventory",
    description: "إضافة وتعديل تصنيفات المنتجات ووحدات القياس والبارکود"
  },
  {
    id: "inventory_settings",
    label: "إعدادات وتنبيهات حد الأمان للمخزون",
    category: "inventory",
    description: "ضبط قواعد النقص المخزني، حركات المخازن وتكامل البار كود"
  },

  // 4. Purchases & Suppliers (purchases)
  {
    id: "view_purchases",
    label: "عرض أوامر وفواتير المشتريات",
    category: "purchases",
    description: "الاطلاع على أوامر الشراء وفواتير التوريد وسجلات الموردين"
  },
  {
    id: "manage_purchases",
    label: "إدارة المشتريات وفواتير الموردين",
    category: "purchases",
    description: "تسجيل أوامر الشراء، فواتير التوريد، وسندات الصرف للموردين"
  },
  {
    id: "delete_purchases",
    label: "حذف وإلغاء أوامر وفواتير الشراء",
    category: "purchases",
    description: "إلغاء أو حذف فواتير التوريد وأوامر الشراء غير المعتمدة"
  },
  {
    id: "manage_suppliers",
    label: "إدارة الموردين وجهات الاتصال",
    category: "purchases",
    description: "إضافة بيانات الموردين، حساباتهم وأرقام التواصل والتقييمات"
  },
  {
    id: "approve_purchase_orders",
    label: "اعتماد أوامر الشراء الرسمية",
    category: "purchases",
    description: "الموافقة الاعتمادية على طلبات وأوامر التوريد الشراء قبل التنفيذ"
  },
  {
    id: "purchases_settings",
    label: "إعدادات وسياسات الشراء",
    category: "purchases",
    description: "تعديل حدود الاعتماد المالي للمشتريات وشروط التوريد"
  },

  // 5. CRM & Customers (crm)
  {
    id: "view_customers",
    label: "عرض سجلات وحسابات العملاء",
    category: "crm",
    description: "الاطلاع على دليل العملاء، سجل التفاعلات، والمعاملات السابقة"
  },
  {
    id: "manage_customers",
    label: "إدارة بيانات العملاء",
    category: "crm",
    description: "إضافة وتعديل بيانات العملاء، الحدود الائتمانية، وسجل التفاعلات"
  },
  {
    id: "delete_customers",
    label: "حذف وإلغاء سجلات العملاء",
    category: "crm",
    description: "حذف أو أرشفة ملفات العملاء وسجلات التواصل"
  },
  {
    id: "crm_pipeline_mgmt",
    label: "إدارة مسار المبيعات والفرص",
    category: "crm",
    description: "إدارة مراحل الصفقات والفرص الاستثمارية وتتبع مسار المبيعات"
  },
  {
    id: "crm_activities_mgmt",
    label: "إدارة الأنشطة والمهام وتواصل العملاء",
    category: "crm",
    description: "جدولة المكالمات، الاجتماعات ومتابعة تفاعلات العملاء"
  },
  {
    id: "crm_settings",
    label: "إعدادات وتصنيفات مراحل CRM",
    category: "crm",
    description: "تخصيص مراحل الصفقات، مصادر العملاء، وقواعد المتابعة التلقائية"
  },

  // 6. Spaces, Bookings & Contracts (spaces)
  {
    id: "view_spaces",
    label: "عرض العقارات والمساحات والحجوزات",
    category: "spaces",
    description: "عرض العقارات والقاعات والمكاتب وجداول الحجوزات والعقود"
  },
  {
    id: "manage_spaces",
    label: "إدارة العقارات والقاعات والمساحات",
    category: "spaces",
    description: "إضافة وتعديل بيانات العقارات، القاعات، المكاتب والتسعير"
  },
  {
    id: "delete_spaces",
    label: "حذف وتعطيل المساحات والعقارات",
    category: "spaces",
    description: "حذف المساحات أو تعطيلها عن الاستخدام والحجز"
  },
  {
    id: "manage_space_bookings",
    label: "إدارة الحجوزات والمواعيد",
    category: "spaces",
    description: "حجز المساحات والقاعات، تأكيد أو إلغاء المواعيد وتوليد الإيصالات"
  },
  {
    id: "cancel_space_bookings",
    label: "إلغاء واسترداد مبالغ الحجوزات",
    category: "spaces",
    description: "إلغاء حجز المساحة ومعالجة استرداد المبالغ المالية"
  },
  {
    id: "manage_lease_contracts",
    label: "إدارة عقود الإيجار والأقساط",
    category: "spaces",
    description: "تحرير عقود الإيجار، جدولة الأقساط، وتحصيل دفعات الإيجار والضمانات"
  },
  {
    id: "terminate_lease_contracts",
    label: "فسخ وإغلاق عقود الإيجار",
    category: "spaces",
    description: "إنهاء عقود الإيجار مبكراً، تصفية الضمان وتسوية الأقساط"
  },
  {
    id: "spaces_settings",
    label: "إعدادات وقواعد المساحات والعقود",
    category: "spaces",
    description: "ضبط شروط الإيجار، ساعات العمل، ومواعيد التأخير والغرامات"
  },

  // 7. Services & Packages (services)
  {
    id: "view_services",
    label: "عرض دليل الخدمات والباقات",
    category: "services",
    description: "استعراض دليل الخدمات والأسعار والباقات المتاحة"
  },
  {
    id: "manage_services",
    label: "إدارة دليل الخدمات والأسعار",
    category: "services",
    description: "إضافة وتعديل قائمة الخدمات، التسعير والباقات المخصصة"
  },
  {
    id: "delete_services",
    label: "حذف وإلغاء تفعيل الخدمات",
    category: "services",
    description: "حذف صنف خدمة أو إيقاف توفرها للعملاء"
  },
  {
    id: "manage_service_bookings",
    label: "حجز وإدارة طلبات الخدمات",
    category: "services",
    description: "تنسيق تقديم الخدمات للعملاء وتأكيد مواعيد التنفيذ وتسليم الأعمال"
  },
  {
    id: "cancel_service_bookings",
    label: "إلغاء ومراجعة طلبات الخدمات",
    category: "services",
    description: "إلغاء طلب خدمة أو تعديل حالة التنفيذ والتأجيل"
  },
  {
    id: "services_settings",
    label: "إعدادات وسياسات تقديم الخدمات",
    category: "services",
    description: "ضبط شروط الضمان، مدة التنفيذ، وقواعد الخدمة"
  },

  // 8. HR & Payroll (hr)
  {
    id: "view_employees",
    label: "عرض دليل وسجلات الموظفين",
    category: "hr",
    description: "استعراض كادر الموظفين والبيانات الوظيفية العامة"
  },
  {
    id: "manage_employees",
    label: "إدارة الموظفين وتوزيع الصلاحيات",
    category: "hr",
    description: "إضافة وتعديل الموظفين، تحديد الأدوار ومنح الصلاحيات"
  },
  {
    id: "delete_employees",
    label: "حذف أو إنهاء خدمات الموظفين",
    category: "hr",
    description: "أرشفة وحذف سجلات الموظفين وإنهاء الخدمة الإداري"
  },
  {
    id: "view_salaries",
    label: "الاطلاع على الرواتب والبيانات المالية للموظفين",
    category: "hr",
    description: "الاطلاع على الرواتب الأساسية، البدلات والحسابات البنكية للموظفين"
  },
  {
    id: "manage_payroll",
    label: "اعتماد وصرف مسيرات الرواتب (WPS)",
    category: "hr",
    description: "معالجة الرواتب الشهرية، المكافآت والخصومات وتوليد ملفات WPS والسندات"
  },
  {
    id: "approve_payroll",
    label: "الاعتماد النهائي لمسير الرواتب",
    category: "hr",
    description: "صلاحية الاعتماد المالي النهائي لمسير الرواتب قبل التحويل البنكي"
  },
  {
    id: "manage_contracts_eosb",
    label: "إدارة عقود العمل وتصفية مكافأة نهاية الخدمة",
    category: "hr",
    description: "تحرير عقود العمل، تجديدها وتصفية المستحقات والإنهاء الإداري"
  },
  {
    id: "hr_settings",
    label: "إعدادات ولوائح الموارد البشرية",
    category: "hr",
    description: "تعديل قواعد الرواتب، سياسات التأمينات الاجتماعي (PASI)، واللوائح الداخلية"
  },

  // 9. Attendance & Kiosk (attendance)
  {
    id: "attendance_view",
    label: "عرض سجلات الحركات وحضور الموظفين",
    category: "attendance",
    description: "الاطلاع على الحركات اللحظية، سجلات الحضور، الانصراف والمهمات"
  },
  {
    id: "attendance_create",
    label: "تسجيل حركات الحضور والانصراف (Kiosk)",
    category: "attendance",
    description: "استخدام أجهزة الكشك لتسجيل الحضور، الخروج والمهمات الميدانية"
  },
  {
    id: "attendance_edit",
    label: "طلب تعديل وتصحيح حركات الحضور",
    category: "attendance",
    description: "إنشاء طلبات تعديل لحركات الحضور المنسية أو الخاطئة مع حفظ الأثر التدقيقي"
  },
  {
    id: "attendance_delete",
    label: "حذف أو إلغاء حركات الحضور",
    category: "attendance",
    description: "صلاحية استثنائية لحذف الحركات غير الصحيحة مع التوثيق الرقابي"
  },
  {
    id: "attendance_approve",
    label: "اعتماد حركات وتعديلات الحضور",
    category: "attendance",
    description: "مراجعة واعتماد طلبات تعديل أوقات الحضور والانصراف والمهمات الخارجية"
  },
  {
    id: "attendance_reports",
    label: "تقارير وتحليلات الحضور وساعات العمل",
    category: "attendance",
    description: "تصدير تقارير التأخير، الغياب، ساعات العمل الإضافية وساعات المهمات"
  },
  {
    id: "attendance_photos",
    label: "عرض صور التحقق من الهوية الملتقطة بالكشك",
    category: "attendance",
    description: "صلاحية محمية للاطلاع على الصور الشخصية الملتقطة أثناء تسجيل الحضور"
  },
  {
    id: "attendance_devices",
    label: "إدارة وتأمين أجهزة الكشك اللوحية (Kiosk Devices)",
    category: "attendance",
    description: "تسجيل الأجهزة اللوحية، توليد التوكنات، والقفل أو التعطيل عن بعد"
  },
  {
    id: "movement_types_mgmt",
    label: "إدارة وتخصيص أنواع الحركات الإدارية",
    category: "attendance",
    description: "إضافة وتعديل وتفعيل أنواع الحركات (مهمة عمل، استراحة، طوارئ... إلخ)"
  },
  {
    id: "employee_pin_mgmt",
    label: "إدارة رموز الأمان (PIN) للموظفين",
    category: "attendance",
    description: "توليد وتعيين وإعادة ضبط وتشفير رموز الدخول السرية الخاصة بالموظفين"
  },
  {
    id: "attendance_settings",
    label: "إعدادات وسياسات الحضور والانصراف",
    category: "attendance",
    description: "تعديل قواعد فترات السماح، مهلات القفل الأمني، وحساب ساعات العمل"
  },
  {
    id: "kiosk_mode_only",
    label: "وضع جهاز الكشك اللوحي المقيد فقط",
    category: "attendance",
    description: "صلاحية محصورة في واجهة الكشك لتسجيل الحضور بدون وصول للنظام"
  },

  // 10. Requests & Documents (requests)
  {
    id: "view_requests",
    label: "عرض الطلبات والمعاملات الإدارية",
    category: "requests",
    description: "استعراض طلبات الإجازات، السلف، والمعاملات الرسمية"
  },
  {
    id: "manage_requests",
    label: "إدارة النماذج والطلبات الإدارية",
    category: "requests",
    description: "تقديم واعتماد المعاملات والطلبات الرسمية والطلبات الخاصة"
  },
  {
    id: "approve_requests",
    label: "اعتماد والموافقة على الطلبات الرسمية",
    category: "requests",
    description: "صلاحية الموافقة الاعتمادية أو الرفض للطلبات والمعاملات المقدمة"
  },
  {
    id: "delete_requests",
    label: "حذف وإلغاء الطلبات الإدارية",
    category: "requests",
    description: "حذف أو إلغاء الطلبات والمعاملات قبل الاعتماد"
  },
  {
    id: "view_documents",
    label: "عرض واستعراض الوثائق والأرشيف",
    category: "requests",
    description: "تصفح مستندات الموظفين والشركة والأرشيف الرقمي"
  },
  {
    id: "manage_documents",
    label: "إدارة الأرشيف والوثائق الرسمية",
    category: "requests",
    description: "رفع، تنظيم وحفظ المستندات والوثائق المؤسسية والأرشيف الرقمي"
  },
  {
    id: "delete_documents",
    label: "حذف وإتلاف المستندات الرقمية",
    category: "requests",
    description: "صلاحية إزالة وحذف المستندات الحساسة والوثائق من الأرشيف"
  },
  {
    id: "requests_settings",
    label: "إعدادات مسارات الاعتماد ونماذج الطلبات",
    category: "requests",
    description: "تخصيص أنواع الطلبات، نماذج المعاملات، وسلسلة الموافقات"
  },

  // 11. Branches, System & Settings (management)
  {
    id: "view_branches",
    label: "عرض بيانات وقائمة الفروع والمستودعات",
    category: "management",
    description: "الاطلاع على الفروع المستودعات والبيانات التابعة"
  },
  {
    id: "manage_branches",
    label: "إدارة الفروع والمستودعات",
    category: "management",
    description: "إضافة وتعديل فروع الشركة وبياناتها الإدارية والضريبية"
  },
  {
    id: "delete_branches",
    label: "حذف وإغلاق الفروع والمستودعات",
    category: "management",
    description: "صلاحية إغلاق الفرع أو إزالته من قائمة الفروع النشطة"
  },
  {
    id: "view_reports",
    label: "الاطلاع على التقارير العامة والإحصائيات",
    category: "management",
    description: "عرض إجمالي الإيرادات، الأرباح، تقارير الفروع وحركة الأموال"
  },
  {
    id: "edit_settings",
    label: "تعديل إعدادات الشركة وقوالب الطباعة",
    category: "management",
    description: "تغيير الشعار، الألوان، الختم الرسمي، الحسابات البنكية وبيانات الترويسة"
  },
  {
    id: "system_audit_logs",
    label: "عرض واستخراج سجلات التدقيق والأمان",
    category: "management",
    description: "الاطلاع على سجلات حركة المستخدمين، العمليات الحساسة وتدقيق الأمان"
  },
  {
    id: "auditor_read_only",
    label: "صلاحية التفتيش الرقابي والمدقق (قراءة فقط)",
    category: "management",
    description: "إمكانية الوصول والاطلاع الكامل والتفتيش الرقابي دون تعديل البيانات"
  },
  {
    id: "collaborator_limited",
    label: "صلاحيات المتعاون الخارجي المقيدة",
    category: "management",
    description: "الوصول المخصص لإدخال المعاملات والمراجعة الاستشارية"
  },
  {
    id: "management_admin_override",
    label: "صلاحية التجاوز الإداري الشامل",
    category: "management",
    description: "صلاحية الفيتو والتجاوز الإداري الاستثنائي لكافة السياسات والضوابط"
  }
];

export const ALL_PERMISSIONS: EmployeePermission[] = PERMISSION_CONFIG.map((p) => p.id);

export const ROLE_DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermission[]> = {
  ADMIN: [...ALL_PERMISSIONS],
  MANAGER: [
    "view_vouchers",
    "create_vouchers",
    "edit_vouchers",
    "approve_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_financial_reports",
    "pos_view_sales",
    "pos_open_shift",
    "pos_create_order",
    "pos_edit_order",
    "pos_apply_discount",
    "pos_close_shift_override",
    "view_inventory",
    "manage_inventory",
    "manage_transfers",
    "approve_transfers",
    "inventory_stocktake",
    "inventory_categories",
    "view_purchases",
    "manage_purchases",
    "manage_suppliers",
    "approve_purchase_orders",
    "view_customers",
    "manage_customers",
    "crm_pipeline_mgmt",
    "crm_activities_mgmt",
    "view_spaces",
    "manage_spaces",
    "manage_space_bookings",
    "manage_lease_contracts",
    "view_services",
    "manage_services",
    "manage_service_bookings",
    "view_employees",
    "manage_employees",
    "view_salaries",
    "manage_payroll",
    "approve_payroll",
    "attendance_view",
    "attendance_create",
    "attendance_approve",
    "attendance_reports",
    "attendance_photos",
    "view_requests",
    "manage_requests",
    "approve_requests",
    "view_documents",
    "manage_documents",
    "view_branches",
    "manage_branches",
    "view_reports"
  ],
  ACCOUNTANT: [
    "view_vouchers",
    "create_vouchers",
    "edit_vouchers",
    "approve_vouchers",
    "close_financial_period",
    "print_export_vouchers",
    "apply_discounts",
    "manage_general_ledger",
    "view_financial_reports",
    "pos_view_sales",
    "view_inventory",
    "view_purchases",
    "manage_purchases",
    "manage_suppliers",
    "approve_purchase_orders",
    "view_customers",
    "manage_customers",
    "view_spaces",
    "manage_lease_contracts",
    "view_services",
    "view_employees",
    "view_salaries",
    "manage_payroll",
    "approve_payroll",
    "manage_contracts_eosb",
    "attendance_view",
    "attendance_reports",
    "view_requests",
    "approve_requests",
    "view_documents",
    "view_branches",
    "view_reports"
  ],
  SALES: [
    "view_vouchers",
    "create_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "pos_view_sales",
    "pos_open_shift",
    "pos_create_order",
    "pos_apply_discount",
    "view_inventory",
    "view_customers",
    "manage_customers",
    "crm_pipeline_mgmt",
    "crm_activities_mgmt",
    "view_spaces",
    "manage_space_bookings",
    "view_services",
    "manage_service_bookings",
    "attendance_create"
  ],
  STOREKEEPER: [
    "view_inventory",
    "manage_inventory",
    "delete_inventory",
    "manage_transfers",
    "approve_transfers",
    "inventory_stocktake",
    "inventory_categories",
    "inventory_settings",
    "view_purchases",
    "manage_purchases",
    "manage_suppliers",
    "attendance_create"
  ],
  RECEPTIONIST: [
    "view_vouchers",
    "create_vouchers",
    "print_export_vouchers",
    "pos_create_order",
    "view_customers",
    "manage_customers",
    "view_spaces",
    "manage_space_bookings",
    "view_services",
    "manage_service_bookings",
    "view_requests",
    "manage_requests",
    "attendance_create"
  ],
  COLLABORATOR: [
    "view_vouchers",
    "create_vouchers",
    "print_export_vouchers",
    "view_customers",
    "manage_customers",
    "view_reports",
    "collaborator_limited"
  ],
  AUDITOR: [
    "view_vouchers",
    "view_financial_reports",
    "pos_view_sales",
    "view_inventory",
    "view_purchases",
    "view_customers",
    "view_spaces",
    "view_services",
    "view_employees",
    "view_salaries",
    "attendance_view",
    "attendance_reports",
    "print_export_vouchers",
    "view_requests",
    "view_documents",
    "view_branches",
    "view_reports",
    "system_audit_logs",
    "auditor_read_only"
  ],
  KIOSK_TABLET: [
    "kiosk_mode_only"
  ],
  CUSTOM: [
    "view_vouchers",
    "create_vouchers",
    "print_export_vouchers",
    "attendance_create"
  ]
};

/**
 * Evaluates active permissions for an employee.
 * Returns array of granted EmployeePermission items.
 * Role provides defaults. If custom permissions array is present on employee,
 * it acts as the authoritative custom matrix override without conflicts.
 */
export function evaluateEmployeePermissions(
  employeeOrRole?: EmployeeRole | { role?: EmployeeRole; permissions?: EmployeePermission[] } | null,
  customPermissions?: EmployeePermission[]
): EmployeePermission[] {
  if (!employeeOrRole) return [];

  if (typeof employeeOrRole === "string") {
    const role = employeeOrRole as EmployeeRole;
    if (customPermissions && Array.isArray(customPermissions)) {
      return Array.from(new Set(customPermissions));
    }
    return ROLE_DEFAULT_PERMISSIONS[role] || [];
  }

  const role = employeeOrRole.role;
  const permissions = customPermissions ?? employeeOrRole.permissions;

  if (permissions && Array.isArray(permissions)) {
    return Array.from(new Set(permissions));
  }

  if (role && ROLE_DEFAULT_PERMISSIONS[role]) {
    return ROLE_DEFAULT_PERMISSIONS[role];
  }

  return [];
}

/**
 * Checks whether an employee (or role) has a specific granted permission.
 * Strictly evaluates custom granted permissions without conflicts.
 */
export function hasPermission(
  employeeOrRole: EmployeeRole | { role?: EmployeeRole; permissions?: EmployeePermission[] } | null | undefined,
  permission: EmployeePermission,
  customPermissions?: EmployeePermission[]
): boolean {
  if (!employeeOrRole) return false;
  const activePermissions = evaluateEmployeePermissions(employeeOrRole, customPermissions);
  return activePermissions.includes(permission);
}

/**
 * Utility helper to retrieve permission configs grouped by category key.
 */
export function getPermissionsByCategory(): Record<
  PermissionCategory,
  typeof PERMISSION_CONFIG
> {
  const result: Record<PermissionCategory, typeof PERMISSION_CONFIG> = {
    vouchers: [],
    pos: [],
    inventory: [],
    purchases: [],
    crm: [],
    spaces: [],
    services: [],
    hr: [],
    attendance: [],
    requests: [],
    management: []
  };

  PERMISSION_CONFIG.forEach((config) => {
    if (result[config.category]) {
      result[config.category].push(config);
    }
  });

  return result;
}
