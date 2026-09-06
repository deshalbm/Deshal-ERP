import React, { useState, useEffect } from 'react';
import { 
  Globe, FileText, BookOpen, Image as ImageIcon, Search, 
  Eye, CheckCircle, Clock, Edit3, Plus, Trash2, 
  ExternalLink, Settings, Shield, LayoutDashboard, RefreshCw, AlertCircle,
  Share2, Sparkles, ArrowLeftRight, Activity, Network, BarChart3
} from 'lucide-react';
import { CmsManagerTab, TenantWebsite, CmsSeoFields } from '../../types/cms';
import { RedirectsManager } from './RedirectsManager';
import { SeoHealthDashboard } from './SeoHealthDashboard';
import { EntityManagerView } from './EntityManagerView';
import { SeoStudioPanel } from './SeoStudioPanel';
import MediaLibrary from './MediaLibrary';
import PageEditor from './PageEditor';
import BlogPostEditor from './BlogPostEditor';

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

  // Global Site SEO State for SEO tab
  const [globalSeo, setGlobalSeo] = useState<CmsSeoFields>({
    seoTitle: 'الدليل الشامل لاستشارات إدارة المشاريع — صحار، سلطنة عُمان',
    seoDescription: 'شركة استشارية متخصصة ومصرحة في سلطنة عُمان. خدمات التأسيس، دراسات الجدوى، مركز الأعمال، الاستوديو، والتدريب في صحار.',
    canonicalUrl: 'https://alshamil.om',
    ogImage: '/assets/images/deshal_logo.png',
    focusKeyword: 'استشارات إدارة المشاريع صحار',
    geoPrimaryQuestion: 'ما هي خدمات شركة الدليل الشامل في صحار؟',
    geoDirectAnswer: 'تقدم شركة الدليل الشامل خدمات استشارية متكاملة لتأسيس الشركات، ودراسات الجدوى، وحاضنات الأعمال، واستوديو البودكاست، وقاعات التدريب في ولاية صحار.',
    robots: 'index, follow',
  });

  // Define full tabs matching requirement 31 (دشال الويب)
  const tabs: { id: CmsManagerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'sites', label: 'المواقع (Websites)', icon: <Globe size={18} /> },
    { id: 'pages', label: 'الصفحات (Pages)', icon: <FileText size={18} /> },
    { id: 'blog', label: 'المدونة (Blog)', icon: <BookOpen size={18} /> },
    { id: 'media', label: 'الوسائط (Media)', icon: <ImageIcon size={18} /> },
    { id: 'seo', label: 'SEO والخرائط', icon: <Search size={18} /> },
    { id: 'social', label: 'التواصل الاجتماعي (SMO)', icon: <Share2 size={18} /> },
    { id: 'geo', label: 'الذكاء الاصطناعي GEO', icon: <Sparkles size={18} /> },
    { id: 'redirects', label: 'التحويلات 301', icon: <ArrowLeftRight size={18} /> },
    { id: 'entities', label: 'الكيانات Entities', icon: <Network size={18} /> },
    { id: 'health', label: 'صحة البحث Health', icon: <Activity size={18} /> },
    { id: 'analytics', label: 'التحليلات Analytics', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'الإعدادات Settings', icon: <Settings size={18} /> },
  ];

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockOfficialSite: TenantWebsite = {
        id: 'site-official-1',
        companyId,
        siteType: 'official',
        name: 'شركة الدليل الشامل لاستشارات إدارة المشاريع',
        slug: 'official',
        domain: 'alshamil.om',
        template: 'corporate',
        status: 'active',
        primaryColor: '#002e69',
        secondaryColor: '#006d33',
        primaryLanguage: 'ar',
        settings: {
          address: 'ولاية صحار، محافظة شمال الباطنة، الشارع التجاري',
          phone: '+96826840000',
          email: 'info@alshamil.om',
        },
        robotsPolicy: 'index, follow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const mockTenantSites: TenantWebsite[] = [
        {
          id: 'site-tenant-1',
          companyId,
          siteType: 'tenant',
          name: 'مركز الأعمال الفرعي',
          slug: 'business-sub',
          subdomain: 'biz',
          template: 'professional_services',
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
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const renderSitesTab = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-20">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600 text-xs">جاري تحميل منصة المواقع...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {officialSite && (
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1.5 bg-[#006d33] h-full"></div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[#002e69]">{officialSite.name}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-medium flex items-center border border-emerald-200">
                      <Shield size={12} className="ml-1" />
                      الموقع الرسمي الرئيسي
                    </span>
                    {renderStatusBadge(officialSite.status)}
                  </div>
                  <div className="text-slate-500 flex items-center gap-2 mb-4 text-xs font-mono" dir="ltr">
                    <Globe size={14} />
                    <span>https://{officialSite.domain}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('settings')} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="إعدادات الموقع">
                    <Settings size={18} />
                  </button>
                  <a href={`https://${officialSite.domain}`} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="زيارة الموقع">
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 border-t border-slate-100 pt-4 text-xs">
                <button onClick={() => setActiveTab('pages')} className="flex items-center gap-2 px-4 py-2 bg-[#002e69] text-white hover:bg-blue-900 rounded-lg font-bold transition-colors">
                  <FileText size={16} />
                  إدارة الصفحات
                </button>
                <button onClick={() => setActiveTab('seo')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold border border-emerald-200 transition-colors">
                  <Search size={16} />
                  إعدادات SEO & GEO
                </button>
                <button onClick={() => setActiveTab('blog')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold transition-colors">
                  <BookOpen size={16} />
                  إدارة المدونة
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">مواقع المستأجرين الفرعية ({sites.length})</h3>
            <button className="flex items-center gap-2 bg-[#002e69] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm">
              <Plus size={16} />
              إضافة موقع مستأجر جديد
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <div key={site.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm">{site.name}</h4>
                  {renderStatusBadge(site.status)}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 dir-ltr text-left font-mono">
                  <Globe size={14} />
                  <span>{site.subdomain}.alshamil.om</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <button onClick={() => setActiveTab('pages')} className="text-xs text-[#002e69] font-bold hover:underline">
                    إدارة محتوى الموقع
                  </button>
                  <a href={`https://${site.subdomain}.alshamil.om`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const currentSiteId = officialSite?.id || 'site-official-1';

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-[#002e69] text-white py-6 px-6 sm:px-8 shadow-md relative">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Globe size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">دشال الويب — منصة المواقع والمحتوى وSEO/GEO</h1>
            <p className="text-blue-200 text-xs mt-1" dir="ltr">Enterprise CMS, SEO, GEO, AEO & SMO Engine</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-reverse space-x-1 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#006d33] text-[#002e69] bg-slate-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'sites' && renderSitesTab()}

        {activeTab === 'pages' && (
          <PageEditor
            siteId={currentSiteId}
            companyId={companyId}
            userId={userId}
            userRole={userRole}
            onClose={() => setActiveTab('sites')}
          />
        )}

        {activeTab === 'blog' && (
          <BlogPostEditor
            siteId={currentSiteId}
            companyId={companyId}
            userId={userId}
            userRole={userRole}
            authorName={userName}
            onClose={() => setActiveTab('sites')}
          />
        )}

        {activeTab === 'media' && (
          <MediaLibrary
            siteId={currentSiteId}
            companyId={companyId}
            userId={userId}
            userName={userName}
          />
        )}

        {(activeTab === 'seo' || activeTab === 'social' || activeTab === 'geo') && (
          <SeoStudioPanel
            seo={globalSeo}
            title="الموقع الرسمي"
            slug="home"
            siteName="شركة الدليل الشامل لاستشارات إدارة المشاريع"
            domain="alshamil.om"
            onChange={updated => setGlobalSeo(updated)}
          />
        )}

        {activeTab === 'redirects' && (
          <RedirectsManager siteId={currentSiteId} companyId={companyId} />
        )}

        {activeTab === 'entities' && (
          <EntityManagerView siteId={currentSiteId} companyId={companyId} />
        )}

        {activeTab === 'health' && (
          <SeoHealthDashboard siteId={currentSiteId} />
        )}

        {(activeTab === 'analytics' || activeTab === 'settings') && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
            <Settings className="w-12 h-12 text-[#002e69] mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">إعدادات التحليلات والويب ماستر</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ربط معرفات Google Search Console, Google Analytics 4, GTM, Microsoft Clarity, Bing Webmaster Server-side فقط لضمان الأمان الأقصى.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsManagerView;
