import React, { useState } from 'react';
import { EmployeeDocumentRecord, EmployeeDocumentType } from '../../types/hr';
import { Employee } from '../../types';
import {
  FolderLock,
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  UploadCloud
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface EmployeeDocumentsManagerProps {
  documents?: EmployeeDocumentRecord[];
  employees?: Employee[];
  companySettings?: any;
  onSaveDocument?: (doc: EmployeeDocumentRecord) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const EmployeeDocumentsManager: React.FC<EmployeeDocumentsManagerProps> = ({
  documents = [],
  employees = [],
  companySettings,
  onSaveDocument,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeDocuments = documents || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeDocumentRecord>>({
    documentType: 'CIVIL_ID',
    title: '',
    documentNumber: '',
    issueDate: new Date().toISOString().substring(0, 10),
    expiryDate: '',
    issuingAuthority: '',
    accessLevel: 'CONFIDENTIAL',
    status: 'ACTIVE',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    fileSize: '1.8 MB'
  });

  const handleOpenNew = () => {
    const emp = safeEmployees[0];
    setFormData({
      id: `doc-${Date.now()}`,
      employeeId: emp ? emp.id : '',
      employeeName: emp ? emp.fullName : '',
      documentType: 'CIVIL_ID',
      title: 'البطاقة المدنية الوطنية',
      documentNumber: emp?.civilId || '',
      issueDate: '2023-01-01',
      expiryDate: '2028-01-01',
      issuingAuthority: 'شرطة عمان السلطانية',
      accessLevel: 'CONFIDENTIAL',
      status: 'ACTIVE',
      fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      fileSize: '1.5 MB',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.title) return;

    const doc: EmployeeDocumentRecord = {
      id: formData.id || `doc-${Date.now()}`,
      employeeId: formData.employeeId!,
      employeeName: formData.employeeName || '',
      documentType: (formData.documentType as EmployeeDocumentType) || 'CIVIL_ID',
      title: formData.title!,
      documentNumber: formData.documentNumber,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      issuingAuthority: formData.issuingAuthority,
      fileUrl: formData.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      fileSize: formData.fileSize || '1.2 MB',
      accessLevel: formData.accessLevel || 'CONFIDENTIAL',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    if (onSaveDocument) {
      onSaveDocument(doc);
    }
    setIsModalOpen(false);
  };

  const filtered = safeDocuments.filter((d) => {
    const matchSearch =
      (d?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d?.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d?.documentNumber && d.documentNumber.includes(searchTerm));
    const matchType = typeFilter === 'ALL' || d?.documentType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">إجمالي الوثائق المؤرشفة</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{documents.length}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">حماية وسرية المستندات</span>
            <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              تشفير وصلاحيات وصول صارمة
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-200 font-medium block">أرشفة مستند جديد</span>
            <button
              onClick={handleOpenNew}
              className="mt-2 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة وثيقة
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <UploadCloud className="w-6 h-6 text-blue-300" />
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
            placeholder="بحث باسم الوثيقة، اسم الموظف، الرقم المدني..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'CIVIL_ID', 'PASSPORT', 'EMPLOYMENT_CONTRACT', 'ACADEMIC_DEGREE', 'MEDICAL_FITNESS'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL'
                ? 'الكل'
                : t === 'CIVIL_ID'
                ? 'البطاقة المدنية'
                : t === 'PASSPORT'
                ? 'جواز السفر'
                : t === 'EMPLOYMENT_CONTRACT'
                ? 'عقد العمل'
                : t === 'ACADEMIC_DEGREE'
                ? 'المؤهل العلمي'
                : 'اللياقة الطبية'}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                {doc.documentType}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {doc.accessLevel}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">الموظف: {doc.employeeName}</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] space-y-1 text-slate-600">
              {doc.documentNumber && <div>الرقم: <span className="font-mono text-slate-800">{doc.documentNumber}</span></div>}
              {doc.issuingAuthority && <div>الجهة: {doc.issuingAuthority}</div>}
              {doc.expiryDate && <div>الانتهاء: <span className="font-mono text-slate-800">{doc.expiryDate}</span></div>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              {handleOpen360Action && (
                <button
                  onClick={() => handleOpen360Action(doc.employeeId)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  الملف 360°
                </button>
              )}
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  معاينة الملف
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-blue-600" />
                أرشفة وثيقة رسمية للموظف
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الموظف المعني</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const emp = safeEmployees.find((x) => x.id === e.target.value);
                    if (emp) {
                      setFormData({
                        ...formData,
                        employeeId: emp.id,
                        employeeName: emp.fullName
                      });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  {safeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نوع الوثيقة</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  <option value="CIVIL_ID">البطاقة المدنية (Civil ID)</option>
                  <option value="PASSPORT">جواز السفر (Passport)</option>
                  <option value="EMPLOYMENT_CONTRACT">عقد العمل (Contract)</option>
                  <option value="ACADEMIC_DEGREE">المؤهل الأكاديمي (Degree)</option>
                  <option value="MEDICAL_FITNESS">فحص اللياقة الطبية (Medical)</option>
                  <option value="WORK_PERMIT">تصريح العمل (Work Permit)</option>
                  <option value="OTHER">وثيقة أخرى (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان الوثيقة</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="مثال: البطاقة المدنية الأصلية"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الوثيقة</label>
                  <input
                    type="text"
                    value={formData.documentNumber || ''}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الجهة المصدرة</label>
                  <input
                    type="text"
                    value={formData.issuingAuthority || ''}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الإصدار</label>
                  <input
                    type="date"
                    value={formData.issueDate || ''}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
                >
                  حفظ وأرشفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
