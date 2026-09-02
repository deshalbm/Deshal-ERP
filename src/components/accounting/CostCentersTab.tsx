import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  TrendingUp,
  DollarSign,
  Building2,
  PieChart,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { CostCenter, Account, JournalEntry } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import {
  loadCostCenters,
  saveCostCenters
} from '../../utils/accountingStorage';

interface CostCentersTabProps {
  costCenters: CostCenter[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  currency?: string;
  onRefreshData: () => void;
  onNotification: (msg: string) => void;
}

export const CostCentersTab: React.FC<CostCentersTabProps> = ({
  costCenters,
  accounts,
  journalEntries,
  currency = 'OMR',
  onRefreshData,
  onNotification
}) => {
  const { isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCc, setEditingCc] = useState<CostCenter | null>(null);

  // Form State
  const [code, setCode] = useState<string>('');
  const [nameAr, setNameAr] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Cost Center Analytics Breakdown from posted journal entries
  const analytics = useMemo(() => {
    const postedEntries = journalEntries.filter((e) => e.status === 'POSTED' || e.status === 'LOCKED');
    
    const map: Record<string, { totalExpenses: number; totalRevenue: number; count: number }> = {};
    
    costCenters.forEach((cc) => {
      map[cc.id] = { totalExpenses: 0, totalRevenue: 0, count: 0 };
    });

    postedEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!line.costCenterId || !map[line.costCenterId]) return;

        map[line.costCenterId].count++;
        const acc = accounts.find((a) => a.id === line.accountId);
        if (acc?.type === 'EXPENSE' || acc?.type === 'COGS' || acc?.type === 'OTHER_EXPENSE') {
          map[line.costCenterId].totalExpenses += Number(line.debit || 0) - Number(line.credit || 0);
        } else if (acc?.type === 'REVENUE' || acc?.type === 'OTHER_REVENUE') {
          map[line.costCenterId].totalRevenue += Number(line.credit || 0) - Number(line.debit || 0);
        }
      });
    });

    return map;
  }, [costCenters, journalEntries, accounts]);

  const filteredCostCenters = useMemo(() => {
    return costCenters.filter((cc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          cc.code.toLowerCase().includes(q) ||
          cc.nameAr.toLowerCase().includes(q) ||
          (cc.nameEn && cc.nameEn.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [costCenters, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCc(null);
    const nextNum = costCenters.length + 1;
    setCode(`CC-${nextNum * 100}`);
    setNameAr('');
    setNameEn('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setEditingCc(cc);
    setCode(cc.code);
    setNameAr(cc.nameAr);
    setNameEn(cc.nameEn || '');
    setDescription(cc.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nameAr.trim()) return;

    let updated: CostCenter[];
    if (editingCc) {
      updated = costCenters.map((cc) =>
        cc.id === editingCc.id
          ? {
              ...cc,
              code: code.trim(),
              nameAr: nameAr.trim(),
              nameEn: nameEn.trim() || undefined,
              description: description.trim() || undefined,
              updatedAt: new Date().toISOString()
            }
          : cc
      );
      onNotification(`تم تعديل مركز التكلفة (${nameAr}) بنجاح.`);
    } else {
      const newCc: CostCenter = {
        id: `cc-${Date.now()}`,
        code: code.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || undefined,
        description: description.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [...costCenters, newCc];
      onNotification(`تم إنشاء مركز التكلفة الجديد (${nameAr}) بنجاح.`);
    }

    saveCostCenters(updated);
    setIsModalOpen(false);
    onRefreshData();
  };

  const handleToggleActive = (ccId: string) => {
    const updated = costCenters.map((cc) =>
      cc.id === ccId ? { ...cc, isActive: !cc.isActive, updatedAt: new Date().toISOString() } : cc
    );
    saveCostCenters(updated);
    onNotification('تم تحديث حالة تفعيل مركز التكلفة.');
    onRefreshData();
  };

  return (
    <div id="cost-centers-tab" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              مراكز التكلفة والأبعاد التحليلية (Cost Centers)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع المصروفات والإيرادات على الفروع والأقسام لتحليل ربحية كل وحدة تشغيلية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في مراكز التكلفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pr-9 pl-4 py-2 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>

          <button
            id="add-cost-center-btn"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ مركز تكلفة جديد</span>
          </button>
        </div>
      </div>

      {/* Cost Centers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCostCenters.map((cc) => {
          const stats = analytics[cc.id] || { totalExpenses: 0, totalRevenue: 0, count: 0 };
          const net = stats.totalRevenue - stats.totalExpenses;

          return (
            <div
              key={cc.id}
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                cc.isActive ? 'border-slate-200/80' : 'border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {cc.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cc)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(cc.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        cc.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                      }`}
                    >
                      {cc.isActive ? 'نشط' : 'معطل'}
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{cc.nameAr}</h3>
                {cc.nameEn && <p className="text-xs text-slate-400 mt-0.5">{cc.nameEn}</p>}
                {cc.description && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl">
                    {cc.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>إجمالي المصروفات:</span>
                  <strong className="text-rose-600 font-mono">{stats.totalExpenses.toFixed(3)} {currency}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>إجمالي الإيرادات:</span>
                  <strong className="text-emerald-600 font-mono">{stats.totalRevenue.toFixed(3)} {currency}</strong>
                </div>
                <div className="flex justify-between text-slate-700 font-bold pt-1 border-t border-dashed border-slate-200">
                  <span>صافي الهامش:</span>
                  <span className={`font-mono ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {net.toFixed(3)} {currency}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Cost Center Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {editingCc ? 'تعديل مركز التكلفة' : '+ إضافة مركز تكلفة جديد'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز المركز (Code):</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية:</label>
                <input
                  type="text"
                  placeholder="مثال: فرع صلالة التجاري"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم بالإنجليزية:</label>
                <input
                  type="text"
                  placeholder="e.g. Salalah Branch"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف / الغرض:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  حفظ مركز التكلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
