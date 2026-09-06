import React, { useState } from 'react';
import { Clock, CheckCircle, RotateCcw, X, FileText, AlertCircle } from 'lucide-react';
import { CmsEntityType, CmsContentRevision } from '../../types/cms';

interface RevisionViewerProps {
  entityType: CmsEntityType;
  entityId: string;
  entityTitle: string;
  siteId: string;
  companyId: string;
  userId: string;
  userName: string;
  onClose: () => void;
  onRestored?: () => void;
}

const RevisionViewer: React.FC<RevisionViewerProps> = ({
  entityType,
  entityId,
  entityTitle,
  siteId,
  companyId,
  userId,
  userName,
  onClose,
  onRestored
}) => {
  const [revisions, setRevisions] = useState<CmsContentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<CmsContentRevision | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Mock loading for now, normally calls cmsService.getRevisions()
  React.useEffect(() => {
    const fetchRevisions = async () => {
      setLoading(true);
      try {
        // Mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        setRevisions([
          {
            id: 'rev-1',
            tenantWebsiteId: siteId,
            companyId,
            entityType,
            entityId,
            version: 3,
            contentSnapshot: { title: 'Updated Title' },
            action: 'publish',
            changedBy: userId,
            changedByName: userName,
            createdAt: new Date().toISOString()
          },
          {
            id: 'rev-2',
            tenantWebsiteId: siteId,
            companyId,
            entityType,
            entityId,
            version: 2,
            contentSnapshot: { title: 'Old Title' },
            action: 'save',
            changedBy: 'user-2',
            changedByName: 'أحمد محمود',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
        setLoading(false);
      } catch (err) {
        setError('حدث خطأ أثناء تحميل النسخ السابقة');
        setLoading(false);
      }
    };
    fetchRevisions();
  }, [entityId, siteId, companyId]);

  const handleRestore = async () => {
    if (!selectedRevision) return;
    setRestoring(true);
    try {
      // Mock restore call: await cmsService.restoreRevision(...)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRestoring(false);
      setShowRestoreConfirm(false);
      if (onRestored) onRestored();
      onClose();
    } catch (err) {
      setRestoring(false);
      alert('حدث خطأ أثناء الاستعادة');
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center text-slate-800">
            <Clock className="w-5 h-5 ml-3 text-blue-700" />
            <div>
              <h2 className="text-lg font-bold">سجل النسخ السابقة</h2>
              <p className="text-sm text-slate-500">{entityTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Revisions List */}
          <div className="w-1/3 border-l border-slate-200 bg-slate-50 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                {error}
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">لا توجد نسخ سابقة.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {revisions.map((rev) => (
                  <button
                    key={rev.id}
                    onClick={() => {
                      setSelectedRevision(rev);
                      setShowRestoreConfirm(false);
                    }}
                    className={`w-full text-right p-4 transition-colors hover:bg-blue-50 ${
                      selectedRevision?.id === rev.id ? 'bg-blue-50 border-r-4 border-blue-600' : 'border-r-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">نسخة #{rev.version}</span>
                      <span className="text-xs text-slate-500">{formatDate(rev.createdAt)}</span>
                    </div>
                    <div className="text-sm text-slate-600 mb-1">
                      بواسطة: {rev.changedByName || 'مجهول'}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-700">
                      {rev.action === 'publish' ? 'نشر' : rev.action === 'save' ? 'حفظ' : rev.action}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main - Revision Details */}
          <div className="w-2/3 bg-white flex flex-col relative">
            {selectedRevision ? (
              <>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
                  <div>
                    <h3 className="font-bold text-slate-800">تفاصيل النسخة #{selectedRevision.version}</h3>
                    <p className="text-sm text-slate-500">{formatDate(selectedRevision.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 ml-2" />
                    استعادة هذه النسخة
                  </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 font-mono text-sm text-left whitespace-pre-wrap overflow-x-auto shadow-sm" dir="ltr">
                    {JSON.stringify(selectedRevision.contentSnapshot, null, 2)}
                  </div>
                </div>

                {/* Restore Confirmation Overlay */}
                {showRestoreConfirm && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 border-t border-slate-200">
                    <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد استعادة النسخة</h3>
                    <p className="text-slate-600 mb-6 text-center max-w-md">
                      أنت على وشك استعادة النسخة #{selectedRevision.version}. سيتم إنشاء نسخة جديدة من هذا المحتوى.
                    </p>
                    <div className="w-full max-w-md mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-1">سبب الاستعادة (اختياري)</label>
                      <input 
                        type="text" 
                        value={restoreReason}
                        onChange={(e) => setRestoreReason(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="مثال: التراجع عن تغييرات خاطئة..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowRestoreConfirm(false)}
                        className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        disabled={restoring}
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={handleRestore}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        disabled={restoring}
                      >
                        {restoring ? 'جاري الاستعادة...' : 'نعم، استعادة'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p>اختر نسخة من القائمة لعرض تفاصيلها</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionViewer;
