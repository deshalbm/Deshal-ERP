import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, X, Plus, ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Check, AlertCircle 
} from 'lucide-react';
import { TenantPage, CmsPageType, CmsPageSection, CmsSectionType, CmsSectionData } from '../../types/cms';

interface PageEditorProps {
  siteId: string;
  companyId: string;
  userId: string;
  userRole: string; 
  pageId?: string;
  onSaved?: (page: TenantPage) => void;
  onClose?: () => void;
}

export default function PageEditor({
  siteId,
  companyId,
  userId,
  userRole,
  pageId,
  onSaved,
  onClose
}: PageEditorProps) {
  const [page, setPage] = useState<Partial<TenantPage>>({
    title: '',
    slug: '',
    pageType: 'custom',
    sections: [],
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pageId) {
      setLoading(true);
      // Mock fetch
      setTimeout(() => {
        setPage({
          id: pageId,
          title: 'الصفحة الرئيسية',
          slug: 'home',
          pageType: 'home',
          status: 'draft',
          sections: []
        });
        setLoading(false);
      }, 500);
    }
  }, [pageId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saving]);

  const validateSlug = (slug: string) => {
    const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!regex.test(slug)) {
      setErrors(prev => ({ ...prev, slug: 'الرابط غير صالح (استخدم أحرف إنجليزية صغيرة، أرقام، وشرطات فقط)' }));
      return false;
    }
    setErrors(prev => { const { slug, ...rest } = prev; return rest; });
    return true;
  };

  const validateForPublish = () => {
    const newErrors: Record<string, string> = {};
    if (!page.title) newErrors.title = 'العنوان مطلوب';
    if (!page.slug) newErrors.slug = 'الرابط مطلوب';
    else if (!validateSlug(page.slug)) newErrors.slug = 'الرابط غير صالح';
    if (!page.sections || page.sections.length === 0) newErrors.sections = 'يجب إضافة قسم واحد على الأقل';
    
    page.sections?.forEach((section, index) => {
      const data = section.data as any;
      if (data.imageUrl && !data.imageAlt) {
        newErrors[`section_${index}_alt`] = 'النص البديل للصورة مطلوب';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: string) => {
    if (status === 'published' && !validateForPublish()) return;
    
    setSaving(true);
    // Mock save
    setTimeout(() => {
      setLastSaved(new Date());
      setSaving(false);
      if (onSaved) onSaved(page as TenantPage);
    }, 1000);
  };

  const addSection = (type: CmsSectionType) => {
    const newSection: CmsPageSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      visible: true,
      order: (page.sections?.length || 0) + 1,
      data: { title: '' } as CmsSectionData
    };
    setPage(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
    setExpandedSections(prev => ({ ...prev, [newSection.id]: true }));
  };

  const updateSection = (id: string, data: any) => {
    setPage(prev => ({
      ...prev,
      sections: prev.sections?.map(s => s.id === id ? { ...s, data: { ...s.data, ...data } } : s)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...(page.sections || [])];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    setPage(prev => ({ ...prev, sections: newSections }));
  };

  const deleteSection = (id: string) => {
    setPage(prev => ({
      ...prev,
      sections: prev.sections?.filter(s => s.id !== id)
    }));
  };

  if (loading) return <div className="p-8 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50" dir="rtl">
      <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-[#002e69]">
          {pageId ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}
        </h1>
        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-[#002e69]">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الصفحة</label>
              <input
                type="text"
                value={page.title || ''}
                onChange={e => {
                  setPage(prev => ({ ...prev, title: e.target.value }));
                  if (!pageId) {
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setPage(prev => ({ ...prev, title: e.target.value, slug }));
                  }
                }}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-[#006d33] ${errors.title ? 'border-red-500' : 'border-slate-300'}`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الرابط (Slug)</label>
              <input
                type="text"
                value={page.slug || ''}
                onChange={e => {
                  setPage(prev => ({ ...prev, slug: e.target.value }));
                  validateSlug(e.target.value);
                }}
                className={`w-full p-2 border rounded text-left focus:ring-2 focus:ring-[#006d33] ${errors.slug ? 'border-red-500' : 'border-slate-300'}`}
                dir="ltr"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#002e69]">أقسام الصفحة</h2>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#002e69] text-white rounded hover:bg-[#002e69]/90">
                <Plus className="w-4 h-4" /> إضافة قسم
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded shadow-lg hidden group-hover:block z-10">
                {['hero', 'about', 'services', 'statistics', 'contact'].map(type => (
                  <button
                    key={type}
                    onClick={() => addSection(type as CmsSectionType)}
                    className="block w-full text-right px-4 py-2 hover:bg-slate-50 text-sm"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {page.sections?.map((section, index) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-t-lg border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-[#002e69] text-xs rounded font-medium">
                    {section.type}
                  </span>
                  <button onClick={() => setPage(prev => ({
                    ...prev,
                    sections: prev.sections?.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s)
                  }))}>
                    {section.visible ? <Eye className="w-4 h-4 text-slate-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 disabled:opacity-50">
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  </button>
                  <button onClick={() => moveSection(index, 'down')} disabled={index === (page.sections?.length || 0) - 1} className="p-1 disabled:opacity-50">
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  </button>
                  <button onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))} className="p-1">
                    {expandedSections[section.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteSection(section.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expandedSections[section.id] && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                    <input
                      type="text"
                      value={(section.data as any).title || ''}
                      onChange={e => updateSection(section.id, { title: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#006d33]"
                    />
                  </div>
                  {/* Additional fields based on section type would go here */}
                  {section.type === 'hero' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">العنوان الفرعي</label>
                        <input
                          type="text"
                          value={(section.data as any).subtitle || ''}
                          onChange={e => updateSection(section.id, { subtitle: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رابط الصورة</label>
                        <input
                          type="text"
                          value={(section.data as any).imageUrl || ''}
                          onChange={e => updateSection(section.id, { imageUrl: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded text-left" dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">النص البديل للصورة (Alt)</label>
                        <input
                          type="text"
                          value={(section.data as any).imageAlt || ''}
                          onChange={e => updateSection(section.id, { imageAlt: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {page.sections?.length === 0 && (
            <div className="text-center p-8 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
              لا توجد أقسام بعد. أضف قسماً للبدء.
            </div>
          )}
          {errors.sections && <p className="text-red-500 text-sm">{errors.sections}</p>}
        </div>

        {/* SEO Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <button 
            className="w-full flex justify-between items-center p-4 font-semibold text-[#002e69]"
            onClick={() => setSeoExpanded(!seoExpanded)}
          >
            إعدادات SEO (تحسين محركات البحث)
            {seoExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {seoExpanded && (
            <div className="p-4 border-t border-slate-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان SEO</label>
                <input
                  type="text"
                  value={page.seoTitle || ''}
                  onChange={e => setPage(prev => ({ ...prev, seoTitle: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وصف SEO</label>
                <textarea
                  value={page.seoDescription || ''}
                  onChange={e => setPage(prev => ({ ...prev, seoDescription: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded h-24"
                  maxLength={160}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {page.seoDescription?.length || 0} / 160
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${page.status === 'published' ? 'bg-[#006d33]' : 'bg-amber-500'}`}></span>
            <span className="text-sm font-medium text-slate-700">
              {page.status === 'published' ? 'منشور' : page.status === 'under_review' ? 'قيد المراجعة' : 'مسودة'}
            </span>
          </div>
          {lastSaved && (
            <span className="text-xs text-slate-500">آخر حفظ: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 text-[#002e69] bg-slate-100 hover:bg-slate-200 rounded font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> حفظ كمسودة
          </button>
          
          {(userRole === 'EDITOR' || userRole === 'ADMIN') && page.status === 'draft' && (
            <button 
              onClick={() => handleSave('under_review')}
              disabled={saving}
              className="px-4 py-2 text-white bg-amber-500 hover:bg-amber-600 rounded font-medium"
            >
              إرسال للمراجعة
            </button>
          )}

          {(userRole === 'REVIEWER' || userRole === 'ADMIN') && page.status === 'under_review' && (
            <button 
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-4 py-2 text-white bg-[#002e69] hover:bg-[#002e69]/90 rounded font-medium"
            >
              اعتماد
            </button>
          )}

          {(userRole === 'PUBLISHER' || userRole === 'ADMIN') && (
            <button 
              onClick={() => {
                if(window.confirm('هل أنت متأكد من نشر هذه الصفحة؟')) {
                  handleSave('published');
                }
              }}
              disabled={saving}
              className="px-4 py-2 text-white bg-[#006d33] hover:bg-[#006d33]/90 rounded font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> نشر
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
