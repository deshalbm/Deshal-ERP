import React, { useState } from 'react';
import { EmploymentContract, EmploymentContractStatus, EmploymentContractType } from '../../types/hr';
import { Employee } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Printer,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Download
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface EmploymentContractsManagerProps {
  contracts?: EmploymentContract[];
  employees?: Employee[];
  companySettings?: any;
  onSaveContract?: (contract: EmploymentContract) => void;
  onDeleteContract?: (contractId: string) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const EmploymentContractsManager: React.FC<EmploymentContractsManagerProps> = ({
  contracts = [],
  employees = [],
  companySettings,
  onSaveContract,
  onDeleteContract,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);

  const safeContracts = contracts || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Form State
  const [formData, setFormData] = useState<Partial<EmploymentContract>>({
    contractNumber: `CNT-${new Date().getFullYear()}-${String(safeContracts.length + 1).padStart(3, '0')}`,
    contractType: 'FULL_TIME',
    status: 'ACTIVE',
    currency: 'OMR',
    workingDaysPerWeek: 5,
    dailyWorkingHours: 8,
    annualLeaveDays: 30,
    probationPeriodMonths: 3,
    renewalNoticeDays: 30,
    clauses: [
      'يلتزم الطرف الثاني بالقيام بالمهام الوظيفية الموكلة إليه وفق معايير الجودة والأداء المعتمدة.',
      'يحق للموظف إجازة سنوية مدفوعة الراتب مدتها 30 يوماً.',
      'يلتزم الطرف الثاني بالمحافظة التامة على سرية بيانات ومعاملات الشركة.',
      'تخضع كافة أحكام هذا العقد لقانون العمل العماني الصادر بالمرسوم السلطاني.'
    ]
  });

  // Filtered list
  const filteredContracts = safeContracts.filter((cnt) => {
    const matchSearch =
      (cnt?.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cnt?.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cnt?.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || cnt?.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Expiring count (contracts expiring soon or within 60 days)
  const expiringCount = safeContracts.filter((c) => c?.status === 'EXPIRING_SOON').length;
  const activeCount = safeContracts.filter((c) => c?.status === 'ACTIVE').length;

  const handleOpenNew = () => {
    const defaultEmp = safeEmployees[0];
    setFormData({
      id: `cnt-${Date.now()}`,
      contractNumber: `CNT-${new Date().getFullYear()}-${String(safeContracts.length + 1).padStart(3, '0')}`,
      employeeId: defaultEmp ? defaultEmp.id : '',
      employeeCode: defaultEmp ? defaultEmp.employeeCode : '',
      employeeName: defaultEmp ? defaultEmp.fullName : '',
      employeeCivilId: defaultEmp?.civilId || '',
      jobTitle: defaultEmp?.jobTitle || '',
      department: defaultEmp?.department || '',
      branchName: defaultEmp?.branchName || 'الفرع الرئيسي',
      contractType: 'FULL_TIME',
      startDate: new Date().toISOString().substring(0, 10),
      endDate: '',
      probationPeriodMonths: 3,
      basicSalary: defaultEmp?.basicSalary || 800,
      housingAllowance: 150,
      transportAllowance: 50,
      otherAllowances: 0,
      totalSalary: (defaultEmp?.basicSalary || 800) + 200,
      currency: 'OMR',
      workingDaysPerWeek: 5,
      dailyWorkingHours: 8,
      annualLeaveDays: 30,
      status: 'ACTIVE',
      renewalNoticeDays: 30,
      clauses: [
        'يلتزم الطرف الثاني بالقيام بالمهام الوظيفية الموكلة إليه وفق معايير الجودة والأداء المعتمدة.',
        'يحق للموظف إجازة سنوية مدفوعة الراتب مدتها 30 يوماً.',
        'يلتزم الطرف الثاني بالمحافظة التامة على سرية بيانات ومعاملات الشركة.',
        'تخضع كافة أحكام هذا العقد لقانون العمل العماني الصادر بالمرسوم السلطاني.'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setSelectedContract(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (cnt: EmploymentContract) => {
    setSelectedContract(cnt);
    setFormData({ ...cnt });
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.startDate) return;

    const totalSal =
      Number(formData.basicSalary || 0) +
      Number(formData.housingAllowance || 0) +
      Number(formData.transportAllowance || 0) +
      Number(formData.otherAllowances || 0);

    const contractToSave: EmploymentContract = {
      id: selectedContract ? selectedContract.id : (formData.id || `cnt-${Date.now()}`),
      contractNumber: formData.contractNumber || `CNT-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeCode: formData.employeeCode || '',
      employeeName: formData.employeeName || '',
      employeeCivilId: formData.employeeCivilId,
      jobTitle: formData.jobTitle || '',
      department: formData.department || '',
      branchName: formData.branchName,
      contractType: (formData.contractType as EmploymentContractType) || 'FULL_TIME',
      startDate: formData.startDate!,
      endDate: formData.endDate,
      probationPeriodMonths: Number(formData.probationPeriodMonths || 3),
      basicSalary: Number(formData.basicSalary || 0),
      housingAllowance: Number(formData.housingAllowance || 0),
      transportAllowance: Number(formData.transportAllowance || 0),
      otherAllowances: Number(formData.otherAllowances || 0),
      totalSalary: totalSal,
      currency: formData.currency || 'OMR',
      workingDaysPerWeek: Number(formData.workingDaysPerWeek || 5),
      dailyWorkingHours: Number(formData.dailyWorkingHours || 8),
      annualLeaveDays: Number(formData.annualLeaveDays || 30),
      clauses: formData.clauses || [],
      termsAndConditions: formData.termsAndConditions,
      status: (formData.status as EmploymentContractStatus) || 'ACTIVE',
      renewalNoticeDays: Number(formData.renewalNoticeDays || 30),
      notes: formData.notes,
      createdAt: selectedContract ? selectedContract.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onSaveContract) {
      onSaveContract(contractToSave);
    }
    setIsEditorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي العقود المسجلة</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{contracts.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">عقود سارية ونشطة</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">عقود تقترب من الانتهاء</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{expiringCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-200 font-medium block">صياغة عقد معتمد</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة عقد جديد
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم العقد، اسم الموظف، المسمى الوظيفي..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'الكل'
                : st === 'ACTIVE'
                ? 'ساري'
                : st === 'EXPIRING_SOON'
                ? 'يقترب من الانتهاء'
                : st === 'EXPIRED'
                ? 'منتهي'
                : 'مفسوخ'}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">رقم العقد</th>
              <th className="p-4">الموظف والوظيفة</th>
              <th className="p-4">نوع العقد</th>
              <th className="p-4">المدة والتواريخ</th>
              <th className="p-4">الراتب والبدلات</th>
              <th className="p-4">الحالة</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredContracts.map((cnt) => (
              <tr key={cnt.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                    {cnt.contractNumber}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900">{cnt.employeeName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {cnt.jobTitle} • {cnt.department}
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    {cnt.contractType}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-slate-700 font-medium">من {cnt.startDate}</div>
                  <div className="text-slate-500 text-[11px]">
                    إلى {cnt.endDate || 'غير محدد المدة'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900">
                    {cnt.totalSalary} {cnt.currency}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    أساسي: {cnt.basicSalary} | بدلات: {cnt.housingAllowance + cnt.transportAllowance + cnt.otherAllowances}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      cnt.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cnt.status === 'EXPIRING_SOON'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cnt.status === 'ACTIVE'
                      ? 'ساري ونشط'
                      : cnt.status === 'EXPIRING_SOON'
                      ? 'يقترب من الانتهاء'
                      : cnt.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {handleOpen360Action && (
                      <button
                        onClick={() => handleOpen360Action(cnt.employeeId)}
                        title="عرض الملف الشامل 360°"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(cnt)}
                      title="تعديل العقد"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {onDeleteContract && (
                      <button
                        onClick={() => onDeleteContract(cnt.id)}
                        title="حذف العقد"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {selectedContract ? 'تعديل عقد العمل' : 'صياغة عقد عمل جديد'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الموظف المعني</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => {
                      const emp = employees.find((emp) => emp.id === e.target.value);
                      if (emp) {
                        setFormData({
                          ...formData,
                          employeeId: emp.id,
                          employeeCode: emp.employeeCode,
                          employeeName: emp.fullName,
                          employeeCivilId: emp.civilId,
                          jobTitle: emp.jobTitle,
                          department: emp.department,
                          branchName: emp.branchName,
                          basicSalary: emp.basicSalary
                        });
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم العقد المعتمد</label>
                  <input
                    type="text"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع العقد</label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="FULL_TIME">دوام كامل (Full Time)</option>
                    <option value="PART_TIME">دوام جزئي (Part Time)</option>
                    <option value="FIXED_TERM">محدد المدة (Fixed Term)</option>
                    <option value="INDEFINITE">غير محدد المدة (Indefinite)</option>
                    <option value="PROBATIONARY">فترة تجربة (Probationary)</option>
                    <option value="REMOTE">عمل عن بعد (Remote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">حالة العقد</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="ACTIVE">نشط وساري</option>
                    <option value="EXPIRING_SOON">يقترب من الانتهاء</option>
                    <option value="EXPIRED">منتهي الصلاحية</option>
                    <option value="TERMINATED">مفسوخ / منتهي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ بدء العقد</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء (إن وجد)</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">تفصيل الراتب والبدلات (OMR)</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">الراتب الأساسي</label>
                    <input
                      type="number"
                      value={formData.basicSalary || 0}
                      onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">بدل السكن</label>
                    <input
                      type="number"
                      value={formData.housingAllowance || 0}
                      onChange={(e) => setFormData({ ...formData, housingAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">بدل النقل</label>
                    <input
                      type="number"
                      value={formData.transportAllowance || 0}
                      onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">بدلات أخرى</label>
                    <input
                      type="number"
                      value={formData.otherAllowances || 0}
                      onChange={(e) => setFormData({ ...formData, otherAllowances: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                >
                  حفظ واعتماد العقد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
