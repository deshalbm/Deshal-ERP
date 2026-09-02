# 🏢 Deshal Business Management ERP

> **Deshal ERP** هي منصة متكاملة وذكية لإدارة الأعمال والمؤسسات، مصممة لتوحيد العمليات التشغيلية والمالية والإدارية داخل منظومة واحدة مترابطة، سهلة الاستخدام، قابلة للتوسع، وآمنة.

---

# 1. Project Identity

## Product Name

**Deshal Business Management ERP**

## Short Name

**Deshal ERP**

## Product Type

Integrated Business Management and Enterprise Resource Planning Platform.

## Product Vision

أن تصبح Deshal ERP منصة موحدة لإدارة الأعمال تجمع العمليات اليومية، العملاء، المبيعات، الخدمات، المساحات، الموارد البشرية، المحاسبة، المخزون، المستندات، الطلبات، والتقارير داخل نظام واحد مترابط.

الهدف ليس إنشاء مجموعة صفحات أو برامج منفصلة داخل واجهة واحدة.

الهدف هو إنشاء:

> **Single Integrated Business Platform**

حيث تنتقل البيانات والعمليات بين الوحدات دون الحاجة إلى إعادة إدخال المعلومات نفسها.

---

# 2. Product Mission

تم تصميم Deshal ERP لمساعدة المؤسسات على:

* توحيد البيانات.
* أتمتة العمليات.
* تقليل الإدخال اليدوي المتكرر.
* تقليل الأخطاء التشغيلية.
* تحسين تجربة الموظفين.
* تسريع الوصول إلى المعلومات.
* توفير رؤية واضحة للإدارة.
* ضمان إمكانية التتبع والمراجعة.
* تحسين أمن البيانات.
* بناء نظام قابل للتوسع مستقبلاً.

---

# 3. Core Product Principles

يجب أن تلتزم جميع عمليات تطوير Deshal ERP بالمبادئ التالية.

## 3.1 Single Source of Truth

يجب ألا توجد مصادر متعددة ومتضاربة لنفس البيانات.

كل نوع من البيانات يجب أن يكون له مصدر واضح ومعتمد.

مثال:

```text
Customer
   ↓
CRM / Customer Core
   ↓
Sales
   ↓
Invoices
   ↓
Payments
   ↓
Accounting
```

يجب عدم إنشاء نسخة مستقلة من بيانات العميل داخل كل وحدة.

---

## 3.2 Integration Before Duplication

قبل إنشاء جدول أو Component أو خدمة أو منطق جديد، يجب البحث عن الموجود.

المبدأ:

> **Reuse → Extend → Integrate → Create**

ولا يتم إنشاء بديل إلا عند وجود سبب معماري واضح.

---

## 3.3 ERP Is Process-Oriented

النظام يجب أن يدير العمليات، وليس فقط البيانات.

مثال:

```text
Lead
→ Qualification
→ Opportunity
→ Quotation
→ Sales Order / Contract
→ Service Delivery / Booking
→ Invoice
→ Payment
→ Accounting
```

---

## 3.4 Security by Design

الأمان جزء من التصميم وليس إضافة لاحقة.

جميع العمليات الحساسة يجب أن تراعي:

* Authentication
* Authorization
* Server-side validation
* Data access control
* Audit logging
* Secure secrets management
* Input validation

---

## 3.5 Beginner-Friendly UX

يجب أن يكون النظام قابلاً للاستخدام من قبل:

* المستخدم المبتدئ.
* الموظف الجديد.
* المدير.
* المحاسب.
* موظف الموارد البشرية.
* موظف المبيعات.

بدون الحاجة إلى تدريب طويل.

---

# 4. Source of Truth and Documentation Priority

عند وجود تعارض بين المعلومات، يجب اتباع الأولوية التالية:

## Technical Source of Truth

1. الكود الفعلي الحالي.
2. قاعدة البيانات والـSchema الفعلي.
3. ملفات الإعدادات والبنية التقنية.
4. AGENTS.md.
5. ملفات `.agent/context/`.
6. ملفات `.agent/skills/`.

## Product and Business Source of Truth

1. المتطلبات المعتمدة للمشروع.
2. الوثائق الحالية في `docs/requirements/`.
3. هذا الملف `about.md`.
4. الوثائق القديمة أو التاريخية.

---

## Important Rule

وجود ميزة موصوفة في هذا الملف لا يعني بالضرورة أنها مطبقة بالكامل في الكود.

لا تعتبر أي ميزة موجودة أو مكتملة إلا بعد التحقق من:

```text
UI
+
Business Logic
+
Data Storage
+
API / Backend
+
Security
+
Permissions
+
Integration
+
Testing
```

---

# 5. Target Users

يدعم النظام عدداً من أنواع المستخدمين، بما في ذلك:

* System Administrators
* Company Owners
* Executive Management
* Accountants
* Finance Officers
* Sales Teams
* CRM Teams
* HR Teams
* Payroll Officers
* Operations Teams
* Reception Staff
* Cashiers
* Warehouse Staff
* Managers
* Employees
* Customers
* Tenants
* External Partners

يجب أن تكون تجربة المستخدم وصلاحياته مرتبطة بدوره ومسؤولياته.

---

# 6. ERP Home and Workspace Philosophy

الصفحة الرئيسية ليست صفحة محاسبة افتراضياً.

يجب أن تكون الصفحة الرئيسية:

> **Role-Based ERP Workspace**

مثال:

### Accountant

يرى:

* Pending Entries
* Bank Reconciliation
* Payables
* Receivables
* Financial KPIs

### Salesperson

يرى:

* My Leads
* My Opportunities
* Today's Activities
* Follow-ups
* Pipeline Value

### HR Officer

يرى:

* Attendance
* Leave Requests
* Employee Requests
* Contracts
* HR Alerts

### Executive

يرى:

* Revenue
* Expenses
* Profit
* Cash Position
* Sales
* Operational KPIs

---

# 7. Functional Architecture

## Main Modules

```text
Deshal ERP
│
├── Home & Workspace
│
├── CRM & Sales
│
├── Finance
│
├── Accounting
│
├── POS
│
├── Spaces & Booking
│
├── Contracts & Leasing
│
├── Services & Subscriptions
│
├── Inventory
│
├── Purchasing & Suppliers
│
├── HR
│
├── Attendance
│
├── Payroll
│
├── Requests & Approvals
│
├── Documents
│
├── Reporting & Analytics
│
├── Notifications
│
├── AI Assistant
│
└── Administration & Settings
```

---

# 8. CRM and Sales

CRM يجب أن يدير دورة العميل وليس مجرد قائمة جهات اتصال.

## Core Flow

```text
Lead
→ Qualification
→ Opportunity
→ Pipeline
→ Activities
→ Quotation
→ Sale / Contract
→ Invoice
→ Payment
→ Retention
→ Renewal
```

## CRM Components

### Leads

إدارة العملاء المحتملين.

### Opportunities

إدارة فرص البيع الفعلية.

### Pipelines

إدارة مراحل دورة البيع حسب نوع الخدمة أو النشاط.

### Activities

تشمل:

* Calls
* Meetings
* WhatsApp
* Emails
* Follow-ups
* Tasks
* Reminders
* Site Visits

### Customers

السجل الرئيسي للعميل.

### Customer 360°

يجب أن يعرض:

* بيانات العميل.
* جهات الاتصال.
* الفرص.
* الأنشطة.
* عروض الأسعار.
* العقود.
* الفواتير.
* المدفوعات.
* الخدمات.
* الحجوزات.
* المستندات.

---

# 9. Pipelines and Opportunities

Pipeline هو طريقة لإدارة دورة الفرص.

يمكن أن يكون لدى النظام أكثر من Pipeline.

مثال:

### Office Rental Pipeline

```text
New
→ Qualified
→ Site Visit
→ Proposal
→ Negotiation
→ Contract
→ Won / Lost
```

### Training and Hall Booking Pipeline

```text
Inquiry
→ Requirements
→ Quotation
→ Confirmation
→ Booking
→ Completed / Lost
```

### Business Services Pipeline

```text
Lead
→ Consultation
→ Proposal
→ Negotiation
→ Contract
→ Won / Lost
```

يجب أن تكون الـPipelines قابلة للتخصيص.

---

# 10. Finance Suite

تشمل إدارة العمليات المالية اليومية.

## Core Functions

* Finance Dashboard
* Receipts
* Payments
* Invoices
* Quotations
* Recurring Billing
* Payment Tracking
* Financial Documents
* Printing
* PDF Export
* Financial History

---

# 11. Accounting Suite

المحاسبة هي المحرك المالي المركزي للنظام.

## Core Principles

```text
Business Transaction
        ↓
Journal Entry
        ↓
Posting
        ↓
General Ledger
        ↓
Trial Balance
        ↓
Financial Statements
```

## Core Functions

* Chart of Accounts
* General Journal
* Journal Entries
* Adjusting Entries
* Reversing Entries
* General Ledger
* Trial Balance
* Income Statement
* Balance Sheet
* Account Statements
* Bank Reconciliation
* Cost Centers
* Fiscal Periods
* Closing
* Audit Trail

---

## Accounting Rules

### Double Entry

يجب أن يكون:

```text
Total Debit = Total Credit
```

### Posted Entries

لا يتم تعديل القيود المرحلة مباشرة.

يجب استخدام:

* Reversal
* Adjustment
* Correcting Entry

مع الحفاظ على سجل المراجعة.

---

# 12. POS

نقطة البيع يجب أن تدعم العمليات السريعة.

تشمل:

* Product Search
* Barcode Scanning
* Manual Product Selection
* Multiple Payment Methods
* Receipt Printing
* Invoice Generation
* Cashier Session Management
* Sales History

يجب أن تتكامل العمليات مع:

* Inventory
* Customers
* Payments
* Accounting

---

# 13. Spaces, Properties and Booking

## Spaces

إدارة:

* Offices
* Meeting Rooms
* Training Rooms
* Workspaces

## Booking

يدعم الحجز حسب:

* Hour
* Day
* Week
* Month

ويجب أن يدعم:

* Availability Checking
* Conflict Prevention
* Pricing
* Customer Assignment
* Booking Confirmation

---

# 14. Contracts and Leasing

إدارة دورة العقد:

```text
Draft
→ Review
→ Approval
→ Signature
→ Active
→ Renewal / Expiry
```

تشمل:

* Contract Templates
* Digital Signatures
* Attachments
* Installment Schedules
* Payments
* Renewal Alerts
* Contract History

---

# 15. Services and Subscriptions

إدارة:

* Services
* Service Packages
* Pricing
* Subscriptions
* Usage Quotas
* Renewals

يجب أن تكون الخدمات قابلة للربط مع:

* Customers
* Contracts
* Bookings
* Invoices
* CRM Opportunities

---

# 16. Inventory

تشمل:

* Products
* Product Categories
* Warehouses
* Stock Movement
* Stock Transfers
* Stock Adjustment
* Barcode
* Reorder Levels
* Inventory Reports

يجب منع التناقضات في أرصدة المخزون.

---

# 17. Purchasing and Suppliers

تشمل دورة:

```text
Purchase Request
→ Approval
→ Purchase Order
→ Goods Receipt
→ Supplier Invoice
→ Payment
→ Accounting
```

---

# 18. HR

إدارة دورة حياة الموظف.

## Employee 360°

يشمل:

* Personal Information
* Employment Information
* Documents
* Contracts
* Career History
* Attendance
* Leave
* Payroll
* Performance
* Training
* Disciplinary Records
* Recognition

---

# 19. Attendance

يدعم النظام تسجيل حركة الموظف.

## Movement Types

* Check In
* Check Out
* Business Mission Out
* Business Mission Return
* Emergency Out
* Emergency Return

## Kiosk

يمكن تشغيل النظام على:

* iPad
* Tablet
* Kiosk Device

ويستخدم:

```text
Employee PIN
+
Automatic Photo
+
Confirmation Message
```

يجب أن يكون وضع الكشك مقيداً وآمناً.

---

# 20. Payroll

يشمل:

* Salary Structures
* Basic Salary
* Allowances
* Deductions
* Advances
* Payroll Runs
* Payslips
* WPS Support
* Payroll Accounting Integration

يجب ألا يعمل Payroll بمعزل عن:

* HR
* Attendance
* Accounting

---

# 21. Dynamic Requests and Forms

يجب أن يوفر النظام محركاً عاماً لبناء وإدارة الطلبات.

## Examples

* Salary Certificate
* Employment Continuity Certificate
* Payslip Request
* Leave Request
* Advance Request
* HR Requests
* Custom Requests

## Request Lifecycle

```text
Draft
→ Submitted
→ Under Review
→ Approved / Rejected
→ Issued / Completed
```

بعض الطلبات يجب أن تكون قابلة للإصدار التلقائي.

وبعضها يحتاج:

* Approval
* Multi-level Approval
* Specific Department Routing

---

# 22. Documents

إدارة:

* Contracts
* Certificates
* Employee Documents
* Customer Documents
* Attachments

يجب دعم:

* Permissions
* Versioning عند الحاجة
* Auditability
* Secure Access

---

# 23. Notifications and Workflows

يجب أن يدعم النظام:

* In-App Notifications
* Task Notifications
* Approval Notifications
* Reminders
* Workflow Events

مثال:

```text
New Lead
→ Assign Salesperson
→ Create Follow-up
→ Send Notification
```

---

# 24. Reporting and Analytics

يجب توفير مركز تقارير موحد.

## Categories

### Financial

* Trial Balance
* General Ledger
* P&L
* Balance Sheet
* Cash Flow

### Sales

* Sales Performance
* Pipeline
* Conversion Rate
* Revenue by Source

### HR

* Attendance
* Leave
* Payroll
* Performance

### Inventory

* Stock Valuation
* Stock Movement
* Low Stock

### Management

* KPIs
* Revenue
* Expenses
* Profitability
* Operational Performance

---

# 25. AI Assistant

يجب أن يعمل الذكاء الاصطناعي كمساعد للمستخدم.

أمثلة:

* تحليل البيانات.
* المساعدة في فهم التقارير.
* صياغة المستندات.
* تلخيص المعلومات.
* اقتراح الإجراءات.

لا يجب أن يتجاوز مساعد الذكاء الاصطناعي صلاحيات المستخدم.

---

# 26. Security Architecture

يجب تطبيق الأمان على عدة مستويات.

## Authentication

تحديد هوية المستخدم.

## Authorization

تحديد ما يستطيع المستخدم فعله.

## Permissions

يجب دعم صلاحيات مثل:

* View
* Create
* Edit
* Delete
* Approve
* Export
* Import
* Post
* Reverse
* Assign

---

## Permission Scope

يمكن تقييد البيانات حسب:

* Company
* Branch
* Department
* Role
* User
* Warehouse
* Pipeline

---

# 27. Audit Logging

يجب تسجيل العمليات المهمة.

مثل:

* إنشاء سجل.
* تعديل سجل.
* حذف.
* اعتماد.
* رفض.
* ترحيل قيد.
* عكس قيد.
* تغيير صلاحيات.

يجب أن يتضمن السجل:

```text
Who
What
When
Where
Before
After
```

عند الحاجة وبما يتوافق مع متطلبات الخصوصية والأداء.

---

# 28. UX and Navigation Standards

يجب أن تكون تجربة المستخدم:

* واضحة.
* متسقة.
* قابلة للاكتشاف.
* مناسبة للمبتدئين.
* سريعة.

## Shared UX Features

* Global Search
* Command Palette
* Quick Create
* Favorites
* Recent Pages
* Breadcrumbs
* Tooltips
* Help Center
* Clear Empty States
* Clear Error States
* Consistent Forms
* Consistent Tables

---

# 29. Language and Direction

يجب دعم:

```text
Arabic (RTL)
English (LTR)
```

ولا يجب اعتبار دعم اللغة مجرد ترجمة النصوص.

يجب مراعاة:

* Layout Direction
* Icons
* Tables
* Forms
* Date Formats
* Number Formats

---

# 30. Technical Architecture Principles

التقنيات الفعلية المستخدمة يجب أن يتم تحديدها من الكود وملفات الإعدادات.

قد تشمل المنظومة طبقات مثل:

```text
Frontend
   ↓
Application / Business Logic
   ↓
API / Backend
   ↓
Database / Storage
   ↓
External Integrations
```

يجب الحفاظ على فصل واضح للمسؤوليات.

---

# 31. Current Technology Stack

التقنيات المتوقعة أو المستخدمة في المشروع يجب التحقق منها من الكود الفعلي.

قد تشمل:

* React
* TypeScript
* Vite
* Tailwind CSS
* Node.js
* Express
* Supabase
* Google Gemini
* PWA Technologies
* PDF and Printing Libraries
* WhatsApp Integration

> **Important:** لا تعتمد على هذه القائمة وحدها عند اتخاذ قرار تقني. يجب دائماً مراجعة `package.json` والبنية الفعلية للمشروع.

---

# 32. Development Principles

قبل إنشاء أي Feature:

```text
Understand
↓
Inspect Existing Code
↓
Identify Reusable Assets
↓
Identify Gaps
↓
Plan
↓
Implement
↓
Test
↓
Review
↓
Document
```

---

# 33. Definition of Done

لا تعتبر أي ميزة مكتملة بسبب وجود واجهة مستخدم فقط.

الميزة مكتملة عندما يتوفر:

* Functional UI
* Business Logic
* Data Persistence
* API Integration عند الحاجة
* Validation
* Permissions
* Security
* Error Handling
* Audit Logging عند الحاجة
* Integration
* Testing
* Acceptance Criteria

---

# 34. Prohibited Development Behavior

لا يجب:

* إعادة بناء النظام بدون سبب.
* حذف وظائف موجودة بشكل عشوائي.
* إنشاء Components مكررة.
* استخدام Mock Data كبديل للإنتاج.
* الاعتماد على Frontend Security فقط.
* تجاوز قواعد المحاسبة.
* تعديل البيانات الحساسة بدون Audit Trail.
* تنفيذ تغييرات Database مدمرة بدون خطة Migration.
* اعتبار UI وحده ميزة مكتملة.

---

# 35. Development Philosophy

المبدأ الأساسي للمشروع:

> **Preserve what works. Improve what exists. Build what is missing. Integrate everything.**

وقبل إنشاء أي شيء جديد:

> **Inspect → Reuse → Extend → Integrate → Create**

---

# 36. Product Success Criteria

يعتبر Deshal ERP ناجحاً عندما يكون:

### Easy to Learn

يمكن للمستخدم الجديد فهم النظام بسرعة.

### Easy to Navigate

يمكن الوصول إلى الوظائف بسهولة.

### Easy to Use

تكون العمليات واضحة وتحتاج إلى أقل عدد منطقي من الخطوات.

### Reliable

البيانات صحيحة ويمكن الاعتماد عليها.

### Secure

البيانات محمية والصلاحيات مطبقة.

### Integrated

الوحدات تتبادل البيانات دون تكرار.

### Auditable

يمكن تتبع العمليات المهمة.

### Scalable

يمكن إضافة وحدات ومستخدمين ووظائف جديدة دون إعادة بناء النظام.

---

# 37. Long-Term Product Direction

Deshal ERP يجب أن يتطور إلى منصة موحدة وقابلة للتوسع تدعم:

```text
Operations
+
CRM
+
Sales
+
Services
+
Spaces
+
HR
+
Payroll
+
Finance
+
Accounting
+
Inventory
+
Purchasing
+
Documents
+
Analytics
+
Automation
+
AI
```

ضمن تجربة استخدام موحدة وآمنة.

---

<div align="center">

**Deshal Business Management ERP**

Integrated • Secure • Scalable • Intelligent

</div>
