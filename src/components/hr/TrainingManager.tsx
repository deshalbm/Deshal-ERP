import React, { useState } from 'react';
import { TrainingCourse, EmployeeTrainingRecord, EmployeeCertificate } from '../../types/hr';
import { Employee } from '../../types';
import {
  GraduationCap,
  Award,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface TrainingManagerProps {
  courses?: TrainingCourse[];
  records?: EmployeeTrainingRecord[];
  trainingRecords?: EmployeeTrainingRecord[];
  certificates?: EmployeeCertificate[];
  employees?: Employee[];
  companySettings?: any;
  onSaveCourse?: (course: TrainingCourse) => void;
  onSaveRecord?: (record: EmployeeTrainingRecord) => void;
  onSaveTrainingRecord?: (record: EmployeeTrainingRecord) => void;
  onSaveCertificate?: (certificate: EmployeeCertificate) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const TrainingManager: React.FC<TrainingManagerProps> = ({
  courses = [],
  records = [],
  trainingRecords = [],
  certificates = [],
  employees = [],
  onSaveCourse,
  onSaveRecord,
  onSaveTrainingRecord,
  onSaveCertificate,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'certificates' | 'courses' | 'records'>('certificates');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const effectiveRecords = (records && records.length > 0) ? records : (trainingRecords || []);
  const effectiveCourses = courses || [];
  const effectiveCerts = certificates || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Certificate Form
  const [certForm, setCertForm] = useState<Partial<EmployeeCertificate>>({
    certificateName: '',
    issuingOrganization: '',
    issueDate: new Date().toISOString().substring(0, 10),
    expiryDate: '',
    credentialId: '',
    status: 'VALID',
    verificationStatus: 'VERIFIED'
  });

  const handleOpenNewCert = () => {
    const emp = (employees && employees.length > 0) ? employees[0] : null;
    setCertForm({
      id: `cert-${Date.now()}`,
      employeeId: emp ? emp.id : '',
      employeeName: emp ? emp.fullName : '',
      certificateName: '',
      issuingOrganization: '',
      issueDate: new Date().toISOString().substring(0, 10),
      expiryDate: '',
      credentialId: '',
      isExpiringSoon: false,
      status: 'VALID',
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString()
    });
    setIsCertModalOpen(true);
  };

  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.employeeId || !certForm.certificateName) return;

    const cert: EmployeeCertificate = {
      id: certForm.id || `cert-${Date.now()}`,
      employeeId: certForm.employeeId!,
      employeeName: certForm.employeeName || '',
      certificateName: certForm.certificateName!,
      issuingOrganization: certForm.issuingOrganization || '',
      issueDate: certForm.issueDate || new Date().toISOString().substring(0, 10),
      expiryDate: certForm.expiryDate,
      credentialId: certForm.credentialId,
      isExpiringSoon: false,
      status: (certForm.status as any) || 'VALID',
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString()
    };

    if (onSaveCertificate) {
      onSaveCertificate(cert);
    }
    setIsCertModalOpen(false);
  };

  const expiringCertsCount = effectiveCerts.filter((c) => c?.status === 'EXPIRING_SOON' || c?.isExpiringSoon).length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">الشهادات المهنية المعتمدة</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{effectiveCerts.length}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">البرامج التدريبية المنفذة</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">{effectiveCourses.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">شهادات تقترب من التجديد</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{expiringCertsCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-200 font-medium block">إضافة رخصة وشهادة</span>
            <button
              onClick={handleOpenNewCert}
              className="mt-2 px-3.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              تسجيل شهادة جديدة
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <GraduationCap className="w-6 h-6 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'certificates'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          الشهادات والرخص المهنية ({effectiveCerts.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'courses'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          كتالوج الدورات وورش العمل ({effectiveCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            activeTab === 'records'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          سجل تدريب الموظفين ({effectiveRecords.length})
        </button>
      </div>

      {/* 1. CERTIFICATES VIEW */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {effectiveCerts.map((cert) => (
            <div key={cert.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cert.certificateName}</h4>
                    <p className="text-xs text-slate-500">الموظف: {cert.employeeName}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    cert.status === 'VALID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}
                >
                  {cert.status === 'VALID' ? 'سارية ومعتمدة' : 'تقترب من الانتهاء'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">الجهة المانحة:</span>
                  <span className="font-semibold text-slate-800">{cert.issuingOrganization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم الاعتماد:</span>
                  <span className="font-mono text-slate-800">{cert.credentialId || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">تاريخ الإصدار:</span>
                  <span className="font-semibold text-slate-800">{cert.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء:</span>
                  <span className="font-semibold text-slate-800">{cert.expiryDate || 'مستمرة / بدون انتهاء'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  موثقة ومعتمدة من HR
                </span>
                {handleOpen360Action && (
                  <button
                    onClick={() => handleOpen360Action(cert.employeeId)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    عرض الملف الشامل
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. COURSES VIEW */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {effectiveCourses.map((course) => (
            <div key={course.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  {course.trainingType}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {course.durationHours} ساعة تدريبية
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{course.courseTitle}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>المزود: {course.provider}</span>
                <span className="font-bold text-indigo-700">{course.cost} {course.currency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. RECORDS VIEW */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">الموظف</th>
                <th className="p-4">الدورة التدريبية</th>
                <th className="p-4">الجهة والمزود</th>
                <th className="p-4">الساعات المنجزة</th>
                <th className="p-4">النتيجة / التقدير</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{r.employeeName}</td>
                  <td className="p-4">{r.courseTitle}</td>
                  <td className="p-4 text-slate-600">{r.provider}</td>
                  <td className="p-4 font-mono">{r.hoursCompleted} ساعة</td>
                  <td className="p-4 font-semibold text-indigo-700">{r.scoreOrGrade || '---'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {r.status === 'COMPLETED' ? 'مكتملة' : (r.status || 'مكتملة')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Certificate Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                تسجيل شهادة أو رخصة مهنية
              </h3>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">الموظف الحاصل على الشهادة</label>
                <select
                  value={certForm.employeeId}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp) {
                      setCertForm({
                        ...certForm,
                        employeeId: emp.id,
                        employeeName: emp.fullName
                      });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">عنوان الشهادة أو الرخصة</label>
                <input
                  type="text"
                  value={certForm.certificateName}
                  onChange={(e) => setCertForm({ ...certForm, certificateName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="مثال: شهادة زمالة المحاسبين القانونيين (SOCPA)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الجهة المانحة</label>
                  <input
                    type="text"
                    value={certForm.issuingOrganization}
                    onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    placeholder="الهيئة العامة..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الاعتماد أو الرخصة</label>
                  <input
                    type="text"
                    value={certForm.credentialId}
                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الإصدار</label>
                  <input
                    type="date"
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    value={certForm.expiryDate || ''}
                    onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-200"
                >
                  حفظ الشهادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
