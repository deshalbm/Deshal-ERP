import React, { useState } from 'react';
import { Network, Plus, Trash2, Edit3, Globe, Building2, User, MapPin, Briefcase } from 'lucide-react';
import { CmsEntity, EntityType } from '../../types/cms';

interface EntityManagerViewProps {
  siteId: string;
  companyId: string;
}

export const EntityManagerView: React.FC<EntityManagerViewProps> = ({ siteId, companyId }) => {
  const [entities, setEntities] = useState<CmsEntity[]>([
    {
      id: 'ent-1',
      tenantWebsiteId: siteId,
      companyId,
      entityType: 'Organization',
      slug: 'al-shamil-consulting',
      officialName: 'شركة الدليل الشامل لاستشارات إدارة المشاريع',
      alternateName: 'الدليل الشامل صحار',
      description: 'شركة استشارية متخصصة ومصرحة في سلطنة عُمان تخدم رواد الأعمال والمستثمرين من التأسيس إلى التوسع القيادي.',
      logoUrl: '/assets/images/deshal_logo.png',
      url: 'https://alshamil.om',
      sameAs: ['https://instagram.com/alshamil', 'https://linkedin.com/company/alshamil'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ent-2',
      tenantWebsiteId: siteId,
      companyId,
      entityType: 'Location',
      slug: 'sohar-headquarters',
      officialName: 'مقر شركة الدليل الشامل — صحار',
      description: 'ولاية صحار، محافظة شمال الباطنة، الشارع التجاري.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Partial<CmsEntity> | null>(null);

  const handleSave = () => {
    if (!editingEntity?.officialName || !editingEntity?.slug) return;

    const newEnt: CmsEntity = {
      id: editingEntity.id || `ent-${Date.now()}`,
      tenantWebsiteId: siteId,
      companyId,
      entityType: editingEntity.entityType || 'Organization',
      slug: editingEntity.slug,
      officialName: editingEntity.officialName,
      alternateName: editingEntity.alternateName,
      description: editingEntity.description,
      logoUrl: editingEntity.logoUrl,
      sameAs: editingEntity.sameAs || [],
      createdAt: editingEntity.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingEntity.id) {
      setEntities(prev => prev.map(e => e.id === editingEntity.id ? newEnt : e));
    } else {
      setEntities(prev => [newEnt, ...prev]);
    }
    setShowModal(false);
    setEditingEntity(null);
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'Organization': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'Person': return <User className="w-4 h-4 text-purple-600" />;
      case 'Location': return <MapPin className="w-4 h-4 text-emerald-600" />;
      default: return <Briefcase className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 text-right font-sans" dir="rtl">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <span>سجل الكيانات الرقمية المعرفة (Entity SEO Engine)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">تعريف العلاقات الرسمية بين المؤسسة والفرع والخدمات والخبرات لتسهيل استيعاب محركات البحث والذكاء الاصطناعي</p>
        </div>

        <button
          onClick={() => {
            setEditingEntity({ entityType: 'Organization', officialName: '', slug: '' });
            setShowModal(true);
          }}
          className="bg-[#002e69] hover:bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>تعريف كيان جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map(ent => (
          <div key={ent.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getEntityIcon(ent.entityType)}
                <span className="font-bold text-slate-900 text-xs">{ent.officialName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {ent.entityType}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingEntity(ent); setShowModal(true); }} className="p-1 text-slate-500 hover:text-blue-600">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEntities(prev => prev.filter(e => e.id !== ent.id))} className="p-1 text-slate-500 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {ent.description && <p className="text-slate-600 text-xs leading-relaxed">{ent.description}</p>}

            {ent.sameAs && ent.sameAs.length > 0 && (
              <div className="text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold block text-[10px]">روابط التوثيق الرسمية (SameAs):</span>
                <div className="flex flex-wrap gap-2 dir-ltr text-left font-mono">
                  {ent.sameAs.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && editingEntity && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-base text-slate-800">تعريف كيان جديد (Entity Schema)</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الكيان (Entity Type)</label>
                <select
                  value={editingEntity.entityType || 'Organization'}
                  onChange={e => setEditingEntity({ ...editingEntity, entityType: e.target.value as any })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                >
                  <option value="Organization">Organization (شركة / مؤسسة)</option>
                  <option value="Brand">Brand (علامة تجارية)</option>
                  <option value="Person">Person (مستشار / شخص)</option>
                  <option value="Location">Location (مقر / فرع)</option>
                  <option value="Service">Service (خدمة استشارية)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الرسمي الكامل</label>
                <input
                  type="text"
                  value={editingEntity.officialName || ''}
                  onChange={e => setEditingEntity({ ...editingEntity, officialName: e.target.value })}
                  placeholder="شركة الدليل الشامل لاستشارات إدارة المشاريع"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المعرف (Slug)</label>
                <input
                  type="text"
                  value={editingEntity.slug || ''}
                  onChange={e => setEditingEntity({ ...editingEntity, slug: e.target.value })}
                  placeholder="alshamil-sohar"
                  dir="ltr"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-left font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوصف المعتمد للكيان</label>
                <textarea
                  value={editingEntity.description || ''}
                  onChange={e => setEditingEntity({ ...editingEntity, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">
                إلغاء
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-xs font-bold text-white bg-[#006d33] hover:bg-emerald-700 rounded-lg shadow-sm">
                حفظ الكيان
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
