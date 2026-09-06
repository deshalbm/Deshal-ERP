import React, { useState, useEffect } from 'react';
import { 
  Globe, FileText, BookOpen, Image as ImageIcon, Search, 
  Eye, CheckCircle, Clock, Edit3, Plus, Trash2, 
  ExternalLink, Settings, Shield, LayoutDashboard, RefreshCw, AlertCircle 
} from 'lucide-react';
import { CmsManagerTab, TenantWebsite } from '../../types/cms';

interface CmsManagerViewProps {
  companyId: string;
  userId: string;
  userRole: string;
  userName: string;
}

const CmsManagerView: React.FC<CmsManagerViewProps> = ({
  companyId,
  userId,
  userRole,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<CmsManagerTab>('sites');
  const [sites, setSites] = useState<TenantWebsite[]>([]);
  const [officialSite, setOfficialSite] = useState<TenantWebsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define tabs
  const tabs: { id: CmsManagerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sites', label: 'المواقع', icon: <Globe size={18} /> },
    { id: 'pages', label: 'الصفحات', icon: <FileText size={18} /> },
    { id: 'blog', label: 'المدونة', icon: <BookOpen size={18} /> },
    { id: 'media', label: 'الوسائط', icon: <ImageIcon size={18} /> },
    { id: 'seo', label: 'SEO والخرائط', icon: <Search size={18} /> },
    { id: 'review', label: 'المراجعة', icon: <CheckCircle size={18} /> },
    { id: 'audit', label: 'سجل التدقيق', icon: <Shield size={18} /> },
    { id: 'revisions', label: 'النسخ', icon: <Clock size={18} /> },
  ];

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data fetching, normally use cmsService.listTenantWebsites() and getOfficialSite()
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOfficialSite: TenantWebsite = {
        id: 'site-official-1',
        companyId,
        siteType: 'official',
        name: 'الموقع الرسمي للشركة',
        slug: 'official',
        domain: 'www.deshalbm.com',
        template: 'corporate',
        status: 'active',
        primaryColor: '#002e69',
        secondaryColor: '#006d33',
        primaryLanguage: 'ar',
        settings: {},
        robotsPolicy: 'index, follow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const mockTenantSites: TenantWebsite[] = [
        {
          id: 'site-tenant-1',
          companyId,
          siteType: 'tenant',
          name: 'متجر فرع الرياض',
          slug: 'riyadh-branch',
          subdomain: 'riyadh.deshalbm.com',
          template: 'trading',
          status: 'active',
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          primaryLanguage: 'ar',
          settings: {},
          robotsPolicy: 'index, follow',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      setOfficialSite(mockOfficialSite);
      setSites(mockTenantSites);
      setLoading(false);
    } catch (err) {
      setError('حدث خطأ أثناء تحميل بيانات المواقع');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [companyId]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">نشط</span>;
      case 'inactive':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-800 border border-slate-200">غير نشط</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-red-100 text-red-800 border border-red-200">موقوف</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const renderSitesTab = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-20">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600">جاري تحميل المواقع...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-20 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button 
            onClick={fetchSites}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Official Site Section */}
        {officialSite && (
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1 bg-emerald-500 h-full"></div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{officialSite.name}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-medium flex items-center border border-emerald-200">
                      <Shield size={12} className="ml-1" />
                      موقع رسمي
                    </span>
                    {renderStatusBadge(officialSite.status)}
                  </div>
                  <div className="text-slate-500 flex items-center gap-2 mb-4 text-sm">
                    <Globe size={14} />
                    <span dir="ltr">{officialSite.domain || officialSite.subdomain}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="إعدادات الموقع">
                    <Settings size={18} />
                  </button>
                  <a href={`https://${officialSite.domain || officialSite.subdomain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="زيارة الموقع">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 border-t border-slate-100 pt-4">
                <button onClick={() => setActiveTab('pages')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                  <FileText size={16} />
                  إدارة الصفحات
                </button>
                <button onClick={() => setActiveTab('blog')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors">
                  <BookOpen size={16} />
                  إدارة المدونة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Sites Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">المواقع الفرعية ({sites.length})</h3>
            <button className="flex items-center gap-2 bg-[#002e69] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus size={16} />
              إضافة موقع جديد
            </button>
          </div>
          
          {sites.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center">
              <LayoutDashboard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-700 mb-2">لا توجد مواقع فرعية</h4>
              <p className="text-slate-500 mb-6">قم بإنشاء أول موقع فرعي لعميل أو مشروع جديد.</p>
              <button className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm mx-auto">
                <Plus size={16} />
                بدء إنشاء موقع
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map(site => (
                <div key={site.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-800 truncate pr-2">{site.name}</h4>
                      {renderStatusBadge(site.status)}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mb-4">
                      <Globe size={14} className="flex-shrink-0" />
                      <span dir="ltr" className="truncate">{site.domain || site.subdomain}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-md mb-4">
                      <LayoutDashboard size={14} />
                      قالب: {site.template}
                    </div>
                    
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => setActiveTab('pages')} className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-slate-50 hover:bg-[#002e69] hover:text-white text-slate-700 rounded-lg text-sm transition-colors">
                        <Edit3 size={16} />
                        تعديل المحتوى
                      </button>
                      <div className="flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm transition-colors" title="إعدادات">
                          <Settings size={16} />
                        </button>
                        <a href={`https://${site.domain || site.subdomain}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm transition-colors" title="معاينة">
                          <Eye size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlaceholderTab = (label: string, icon: React.ReactNode) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{label}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        هذا القسم قيد التطوير. يمكنك العودة لاحقاً لإدارة {label}.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
        <Clock size={16} />
        جاري تحميل...
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-[#002e69] text-white py-6 px-6 sm:px-8 shadow-md z-10 relative">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Globe size={24} className="text-blue-100" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة المواقع والمحتوى</h1>
            <p className="text-blue-200 text-sm mt-1" dir="ltr">CMS Manager View</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-5 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#006d33] text-[#002e69] bg-slate-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'sites' ? renderSitesTab() : renderPlaceholderTab(tabs.find(t => t.id === activeTab)?.label || '', tabs.find(t => t.id === activeTab)?.icon)}
      </div>
    </div>
  );
};

export default CmsManagerView;
