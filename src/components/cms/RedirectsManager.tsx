import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ArrowLeftRight, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { SeoRedirect } from '../../types/cms';

interface RedirectsManagerProps {
  siteId: string;
  companyId: string;
}

export const RedirectsManager: React.FC<RedirectsManagerProps> = ({ siteId, companyId }) => {
  const [redirects, setRedirects] = useState<SeoRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Partial<SeoRedirect> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRedirects = async () => {
    setLoading(true);
    // Mock data initial load - in real scenario fetches from Supabase
    setTimeout(() => {
      setRedirects([
        {
          id: 'red-1',
          tenantWebsiteId: siteId,
          companyId,
          sourcePath: '/old-about',
          destinationUrl: '/about',
          statusCode: 301,
          isActive: true,
          hitsCount: 142,
          lastHitAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'red-2',
          tenantWebsiteId: siteId,
          companyId,
          sourcePath: '/contact-us',
          destinationUrl: '/contact',
          statusCode: 301,
          isActive: true,
          hitsCount: 89,
          lastHitAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchRedirects();
  }, [siteId]);

  const handleSave = () => {
    if (!editingRedirect?.sourcePath || !editingRedirect?.destinationUrl) {
      setError('يرجى ملء المسار الأصلي ووجهة التحويل');
      return;
    }

    if (!editingRedirect.sourcePath.startsWith('/')) {
      setError('المسار الأصلي يجب أن يبدأ بـ /');
      return;
    }

    if (editingRedirect.sourcePath === editingRedirect.destinationUrl) {
      setError('لا يمكن توجيه الرابط إلى نفسه (Loop)');
      return;
    }

    const newRed: SeoRedirect = {
      id: editingRedirect.id || `red-${Date.now()}`,
      tenantWebsiteId: siteId,
      companyId,
      sourcePath: editingRedirect.sourcePath,
      destinationUrl: editingRedirect.destinationUrl,
      statusCode: editingRedirect.statusCode || 301,
      isActive: editingRedirect.isActive !== undefined ? editingRedirect.isActive : true,
      hitsCount: editingRedirect.hitsCount || 0,
      createdAt: editingRedirect.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingRedirect.id) {
      setRedirects(prev => prev.map(r => r.id === editingRedirect.id ? newRed : r));
    } else {
      setRedirects(prev => [newRed, ...prev]);
    }

    setShowModal(false);
    setEditingRedirect(null);
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف أمر التحويل هذا؟')) {
      setRedirects(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#006d33]" />
            <span>إدارة التحويلات المباشرة (301 / 302 Redirect Manager)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">توجيه الزوار ومحركات البحث من الروابط القديمة والمكسورة إلى الصفحات الجديدة للحفاظ على قوة الـ SEO</p>
        </div>

        <button
          onClick={() => {
            setEditingRedirect({ sourcePath: '/', destinationUrl: '/', statusCode: 301, isActive: true });
            setShowModal(true);
          }}
          className="bg-[#002e69] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تحويل جديد</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">جاري تحميل قواعد التحويل...</div>
      ) : redirects.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs space-y-2">
          <p>لا توجد قواعد تحويل مضافة بعد.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold">المسار الأصلي (Source)</th>
                <th className="p-3 font-bold">وجهة التحويل (Destination)</th>
                <th className="p-3 font-bold">رمز الحالة</th>
                <th className="p-3 font-bold">عدد الزيارات</th>
                <th className="p-3 font-bold">الحالة</th>
                <th className="p-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {redirects.map(red => (
                <tr key={red.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono dir-ltr text-left text-blue-700 font-semibold">{red.sourcePath}</td>
                  <td className="p-3 font-mono dir-ltr text-left text-slate-800">{red.destinationUrl}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                      HTTP {red.statusCode}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-700">{red.hitsCount} زيارة</td>
                  <td className="p-3">
                    {red.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">نشط</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">معطل</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setEditingRedirect(red); setShowModal(true); }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(red.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && editingRedirect && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-base text-slate-800">
              {editingRedirect.id ? 'تعديل تحويل URL' : 'إضافة تحويل 301/302 جديد'}
            </h4>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المسار القديم (Source Path)</label>
                <input
                  type="text"
                  value={editingRedirect.sourcePath || ''}
                  onChange={e => setEditingRedirect({ ...editingRedirect, sourcePath: e.target.value })}
                  placeholder="/old-services-page"
                  dir="ltr"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-left font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الرابط الجديد المستهدف (Destination URL)</label>
                <input
                  type="text"
                  value={editingRedirect.destinationUrl || ''}
                  onChange={e => setEditingRedirect({ ...editingRedirect, destinationUrl: e.target.value })}
                  placeholder="/services"
                  dir="ltr"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-left font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع التحويل (Status Code)</label>
                  <select
                    value={editingRedirect.statusCode || 301}
                    onChange={e => setEditingRedirect({ ...editingRedirect, statusCode: Number(e.target.value) as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value={301}>301 — دائم (Permanent)</option>
                    <option value={302}>302 — مؤقت (Temporary)</option>
                    <option value={307}>307 — مؤقت دقيق</option>
                    <option value={308}>308 — دائم دقيق</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحالة</label>
                  <select
                    value={editingRedirect.isActive ? 'true' : 'false'}
                    onChange={e => setEditingRedirect({ ...editingRedirect, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="true">مفعل (Active)</option>
                    <option value="false">معطل (Disabled)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setShowModal(false); setEditingRedirect(null); setError(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white bg-[#006d33] hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
