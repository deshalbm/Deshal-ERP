/**
 * Employee Permissions & Role Matrix — Deshal ERP
 * Domain Layer: Role-permission mappings and permission configuration dictionary.
 */

import { EmployeeRole, EmployeePermission } from "../../types";

export const ROLE_DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermission[]> = {
  ADMIN: [
    "create_vouchers",
    "edit_vouchers",
    "delete_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "manage_branches",
    "manage_employees",
    "view_salaries",
    "edit_settings",
    "attendance_view",
    "attendance_create",
    "attendance_edit",
    "attendance_delete",
    "attendance_approve",
    "attendance_reports",
    "attendance_photos",
    "attendance_devices",
    "movement_types_mgmt",
    "employee_pin_mgmt",
    "attendance_settings"
  ],
  MANAGER: [
    "create_vouchers",
    "edit_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "manage_branches",
    "attendance_view",
    "attendance_create",
    "attendance_approve",
    "attendance_reports",
    "attendance_photos"
  ],
  ACCOUNTANT: [
    "create_vouchers",
    "edit_vouchers",
    "print_export_vouchers",
    "apply_discounts",
    "view_reports",
    "manage_purchases",
    "manage_suppliers",
    "manage_customers",
    "view_salaries",
    "attendance_view",
    "attendance_reports"
  ],
  SALES: [
    "create_vouchers",
    "print_export_vouchers",
    "manage_customers",
    "manage_inventory",
    "attendance_create"
  ],
  STOREKEEPER: [
    "manage_inventory",
    "manage_transfers",
    "manage_purchases",
    "attendance_create"
  ],
  RECEPTIONIST: [
    "create_vouchers",
    "print_export_vouchers",
    "manage_customers",
    "attendance_create"
  ],
  COLLABORATOR: [
    "create_vouchers",
    "print_export_vouchers",
    "manage_customers",
    "view_reports",
    "collaborator_limited"
  ],
  AUDITOR: [
    "view_reports",
    "view_salaries",
    "attendance_view",
    "attendance_reports",
    "print_export_vouchers",
    "auditor_read_only"
  ],
  KIOSK_TABLET: [
    "kiosk_mode_only"
  ],
  CUSTOM: [
    "create_vouchers",
    "print_export_vouchers",
    "attendance_create"
  ]
};

export const PERMISSION_CONFIG: {
  id: EmployeePermission;
  label: string;
  category: "vouchers" | "inventory" | "purchases" | "crm" | "management" | "attendance";
  description: string;
}[] = [
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
    id: "manage_inventory",
    label: "إدارة المخزون والتسعير",
    category: "inventory",
    description: "إضافة وتعديل المنتجات، تعديل كميات الجرد وتحديث أسعار التكلفة والبيع"
  },
  {
    id: "manage_transfers",
    label: "المناقلات والتحويل المخزني",
    category: "inventory",
    description: "تحويل البضائع والأصناف بين مستودعات وفروع الشركة"
  },
  {
    id: "manage_purchases",
    label: "إدارة المشتريات وفواتير الموردين",
    category: "purchases",
    description: "تسجيل أوامر الشراء، فواتير التوريد، وسندات الصرف للموردين"
  },
  {
    id: "manage_suppliers",
    label: "إدارة الموردين وجهات الاتصال",
    category: "purchases",
    description: "إضافة بيانات الموردين، حساباتهم وأرقام التواصل"
  },
  {
    id: "manage_customers",
    label: "إدارة علاقات العملاء (CRM)",
    category: "crm",
    description: "إضافة وتعديل بيانات العملاء، الحدود الائتمانية، وسجل التفاعلات"
  },
  {
    id: "manage_branches",
    label: "إدارة الفروع والمستودعات",
    category: "management",
    description: "إضافة وتعديل فروع الشركة وبياناتها الإدارية والضريبية"
  },
  {
    id: "manage_employees",
    label: "إدارة الموظفين وتوزيع الصلاحيات",
    category: "management",
    description: "إضافة وتعديل الموظفين، تحديد الأدوار ومنح الصلاحيات"
  },
  {
    id: "view_reports",
    label: "الاطلاع على التقارير المالية والإحصائيات",
    category: "management",
    description: "عرض إجمالي الإيرادات، الأرباح، تقارير الفروع وحركة الأموال"
  },
  {
    id: "view_salaries",
    label: "الاطلاع على الرواتب والبيانات المالية للموظفين",
    category: "management",
    description: "الاطلاع على الرواتب الأساسية، البدلات والحسابات البنكية للموظفين"
  },
  {
    id: "edit_settings",
    label: "تعديل إعدادات الشركة وقوالب الطباعة",
    category: "management",
    description: "تغيير الشعار، الألوان، الختم الرسمي، الحسابات البنكية وبيانات الترويسة"
  },
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
  }
];
