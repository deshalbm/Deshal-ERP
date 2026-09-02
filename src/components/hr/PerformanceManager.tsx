import React, { useState } from 'react';
import { PerformanceGoal, EmployeeKPI, PerformanceReview, ReviewRating } from '../../types/hr';
import { Employee } from '../../types';
import {
  TrendingUp,
  Target,
  Award,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Star,
  Edit,
  Eye,
  Trash2,
  Sparkles,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';

export interface PerformanceManagerProps {
  goals?: PerformanceGoal[];
  kpis?: EmployeeKPI[];
  reviews?: PerformanceReview[];
  employees?: Employee[];
  companySettings?: any;
  onSaveGoal?: (goal: PerformanceGoal) => void;
  onSaveKPI?: (kpi: EmployeeKPI) => void;
  onSaveReview?: (review: PerformanceReview) => void;
  onOpen360?: (employeeId: string) => void;
  onOpen360Modal?: (employeeId: string) => void;
  onAuditLog?: (action: string, details: string) => void;
}

export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  goals = [],
  kpis = [],
  reviews = [],
  employees = [],
  companySettings,
  onSaveGoal,
  onSaveKPI,
  onSaveReview,
  onOpen360,
  onOpen360Modal
}) => {
  const { t, isRTL } = useLanguage();
  const [subTab, setSubTab] = useState<'reviews' | 'kpis' | 'goals'>('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const safeReviews = reviews || [];
  const safeKPIs = kpis || [];
  const safeGoals = goals || [];
  const safeEmployees = employees || [];
  const handleOpen360Action = onOpen360Modal || onOpen360;

  // Review Form
  const [reviewForm, setReviewForm] = useState<Partial<PerformanceReview>>({
    reviewCycle: 'SEMI_ANNUAL',
    reviewPeriod: 'النصف الثاني 2026',
    reviewDate: new Date().toISOString().substring(0, 10),
    goalsScore: 90,
    kpisScore: 90,
    competenciesScore: 90,
    overallScore: 90,
    rating: 'EXCEPTIONAL',
    strengths: '',
    areasForImprovement: '',
    recommendations: '',
    employeeAcknowledged: true,
    status: 'COMPLETED'
  });

  const handleOpenNewReview = () => {
    const emp = safeEmployees[0];
    setReviewForm({
      id: `rev-${Date.now()}`,
      reviewNumber: `REV-${new Date().getFullYear()}-${String(safeReviews.length + 1).padStart(3, '0')}`,
      employeeId: emp ? emp.id : '',
      employeeCode: emp ? emp.employeeCode : '',
      employeeName: emp ? emp.fullName : '',
      jobTitle: emp ? emp.jobTitle : '',
      department: emp ? emp.department : '',
      reviewerId: 'emp-1',
      reviewerName: 'سعيد بن راشد الشحي',
      reviewerRole: 'المدير التنفيذي العام',
      reviewCycle: 'SEMI_ANNUAL',
      reviewPeriod: 'النصف الثاني 2026',
      reviewDate: new Date().toISOString().substring(0, 10),
      goalsScore: 90,
      kpisScore: 90,
      competenciesScore: 90,
      overallScore: 90,
      rating: 'EXCEPTIONAL',
      strengths: 'التزام عالي بتحقيق المستهدفات والتعاون الإيجابي مع الفريق.',
      areasForImprovement: 'تطوير المهارات التقنية في إعداد التقارير التحليلية.',
      recommendations: 'صرف مكافأة تميز وإدراج الموظف في خطة التدريب المتقدم.',
      employeeAcknowledged: true,
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    });
    setSelectedReview(null);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.employeeId) return;

    const gScore = Number(reviewForm.goalsScore || 0);
    const kScore = Number(reviewForm.kpisScore || 0);
    const cScore = Number(reviewForm.competenciesScore || 0);
    const overall = Math.round(((gScore + kScore + cScore) / 3) * 10) / 10;

    let calculatedRating: ReviewRating = 'MEETS_EXPECTATIONS';
    if (overall >= 90) calculatedRating = 'EXCEPTIONAL';
    else if (overall >= 80) calculatedRating = 'EXCEEDS_EXPECTATIONS';
    else if (overall >= 70) calculatedRating = 'MEETS_EXPECTATIONS';
    else if (overall >= 60) calculatedRating = 'NEEDS_IMPROVEMENT';
    else calculatedRating = 'UNSATISFACTORY';

    const rev: PerformanceReview = {
      id: selectedReview ? selectedReview.id : (reviewForm.id || `rev-${Date.now()}`),
      reviewNumber: reviewForm.reviewNumber || `REV-${Date.now()}`,
      employeeId: reviewForm.employeeId!,
      employeeCode: reviewForm.employeeCode || '',
      employeeName: reviewForm.employeeName || '',
      jobTitle: reviewForm.jobTitle || '',
      department: reviewForm.department || '',
      reviewerId: reviewForm.reviewerId || 'emp-1',
      reviewerName: reviewForm.reviewerName || 'المدير التنفيذي',
      reviewerRole: reviewForm.reviewerRole || 'الإدارة العليا',
      reviewCycle: reviewForm.reviewCycle || 'SEMI_ANNUAL',
      reviewPeriod: reviewForm.reviewPeriod || '2026',
      reviewDate: reviewForm.reviewDate || new Date().toISOString().substring(0, 10),
      goalsScore: gScore,
      kpisScore: kScore,
      competenciesScore: cScore,
      overallScore: overall,
      rating: calculatedRating,
      strengths: reviewForm.strengths || '',
      areasForImprovement: reviewForm.areasForImprovement || '',
      recommendations: reviewForm.recommendations || '',
      employeeAcknowledged: true,
      status: 'COMPLETED',
      createdAt: selectedReview ? selectedReview.createdAt : new Date().toISOString()
    };

    onSaveReview(rev);
    setIsReviewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">دورات التقييم المنجزة</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{safeReviews.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">مؤشرات الأداء (KPIs)</span>
            <span className="text-2xl font-bold text-indigo-600 mt-1 block">{safeKPIs.length}</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">الأهداف الاستراتيجية</span>
            <span className="text-2xl font-bold text-purple-600 mt-1 block">{safeGoals.length}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-200 font-medium block">تقييم شامل ومؤشرات</span>
            <button
              onClick={handleOpenNewReview}
              className="mt-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إجراء تقييم جديد
            </button>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            subTab === 'reviews'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          سجل التقييمات الرسمية ({safeReviews.length})
        </button>
        <button
          onClick={() => setSubTab('kpis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            subTab === 'kpis'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          مؤشرات الأداء KPIs ({safeKPIs.length})
        </button>
        <button
          onClick={() => setSubTab('goals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
            subTab === 'goals'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          الأهداف الفردية والقسمية ({safeGoals.length})
        </button>
      </div>

      {/* 1. REVIEWS VIEW */}
      {subTab === 'reviews' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeReviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
                      {rev.overallScore}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rev.employeeName}</h4>
                      <p className="text-xs text-slate-500">{rev.jobTitle} • {rev.department}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {rev.rating}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الأهداف</span>
                    <span className="font-bold text-slate-800">{rev.goalsScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المؤشرات</span>
                    <span className="font-bold text-slate-800">{rev.kpisScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الكفاءات</span>
                    <span className="font-bold text-slate-800">{rev.competenciesScore}%</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">نقاط القوة:</span>
                    <p className="text-slate-600 text-[11px] bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                      {rev.strengths}
                    </p>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">التوصيات الإدارية:</span>
                    <p className="text-slate-600 text-[11px] bg-blue-50/40 p-2 rounded-lg border border-blue-100">
                      {rev.recommendations}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>المقيّم: {rev.reviewerName}</span>
                  {handleOpen360Action && (
                    <button
                      onClick={() => handleOpen360Action(rev.employeeId)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      عرض الملف الشامل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. KPIS VIEW */}
      {subTab === 'kpis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeKPIs.map((kpi) => (
            <div key={kpi.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                  {kpi.periodLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {kpi.scorePercentage}%
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{kpi.kpiName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">الموظف: {kpi.employeeName}</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">المستهدف: {kpi.targetValue} {kpi.unit}</span>
                <span className="font-bold text-slate-800">المحقق: {kpi.actualValue} {kpi.unit}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, kpi.scorePercentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. GOALS VIEW */}
      {subTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeGoals.map((goal) => (
            <div key={goal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                  {goal.category === 'DEPARTMENT' ? 'هدف قسمي' : 'هدف فردي'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  goal.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {goal.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{goal.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">المستهدف: {goal.targetValue} {goal.unit}</span>
                <span className="font-bold text-indigo-700">المحقق: {goal.achievedValue} {goal.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                إجراء تقييم أداء رسمي وموثق
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الموظف المعني</label>
                  <select
                    value={reviewForm.employeeId}
                    onChange={(e) => {
                      const emp = employees.find((x) => x.id === e.target.value);
                      if (emp) {
                        setReviewForm({
                          ...reviewForm,
                          employeeId: emp.id,
                          employeeCode: emp.employeeCode,
                          employeeName: emp.fullName,
                          jobTitle: emp.jobTitle,
                          department: emp.department
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
                  <label className="block text-slate-700 font-bold mb-1">دورة التقييم</label>
                  <input
                    type="text"
                    value={reviewForm.reviewPeriod}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    placeholder="مثال: النصف الثاني 2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">درجة الأهداف (0-100)</label>
                  <input
                    type="number"
                    value={reviewForm.goalsScore}
                    onChange={(e) => setReviewForm({ ...reviewForm, goalsScore: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">درجة مؤشرات الأداء KPIs (0-100)</label>
                  <input
                    type="number"
                    value={reviewForm.kpisScore}
                    onChange={(e) => setReviewForm({ ...reviewForm, kpisScore: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">نقاط القوة والإنجازات</label>
                <textarea
                  rows={2}
                  value={reviewForm.strengths}
                  onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="أبرز الإنجازات والتميز..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">مجالات التحسين والتوصيات الإدارية</label>
                <textarea
                  rows={2}
                  value={reviewForm.recommendations}
                  onChange={(e) => setReviewForm({ ...reviewForm, recommendations: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  placeholder="التوصيات بالمكافآت أو الترقيات أو التدريب..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200"
                >
                  حفظ واعتماد التقييم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
