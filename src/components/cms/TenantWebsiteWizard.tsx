import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Palette,
  LayoutTemplate,
  Files,
  Blocks,
  FileText,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Rocket
} from 'lucide-react';
import {
  TenantWebsiteWizardState,
  CmsTemplate,
  CmsPageType,
  CmsSectionType,
  CmsPageSection,
  TenantWebsite
} from '../../types/cms';

// Assuming cmsService exists at this path
// import { cmsService } from '../../lib/supabase/cmsService';

interface TenantWebsiteWizardProps {
  companyId: string;
  userId: string;
  userName: string;
  onComplete: (site: TenantWebsite) => void;
  onClose: () => void;
}

const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'erp', 'mail', 'smtp', 'ftp',
  'dev', 'staging', 'test', 'portal', 'cms', 'static', 'media',
  'assets', 'cdn'
];

const TEMPLATES: { id: CmsTemplate; nameAr: string; nameEn: string; desc: string }[] = [
  { id: 'corporate', nameAr: 'شركات وقطاع الأعمال', nameEn: 'Corporate', desc: 'قالب رسمي مناسب للشركات الكبرى والمؤسسات' },
  { id: 'professional_services', nameAr: 'الخدمات المهنية والاستشارات', nameEn: 'Professional Services', desc: 'مثالي لمكاتب المحاماة، المحاسبة، والاستشارات' },
  { id: 'trading', nameAr: 'التجارة والتوزيع', nameEn: 'Trading & Distribution', desc: 'تصميم يبرز المنتجات وخدمات التوزيع' },
  { id: 'training', nameAr: 'التدريب والأكاديميات', nameEn: 'Training', desc: 'مخصص للمراكز التدريبية وعرض الدورات' },
  { id: 'construction', nameAr: 'الإنشاءات والمقاولات', nameEn: 'Construction', desc: 'يبرز المشاريع السابقة والقدرات الهندسية' },
];

const PAGE_TYPES: { id: CmsPageType; nameAr: string; desc: string }[] = [
  { id: 'home', nameAr: 'الرئيسية', desc: 'الصفحة الأساسية للموقع (إلزامية)' },
  { id: 'about', nameAr: 'عن الشركة', desc: 'معلومات عن الشركة وتاريخها وفريق العمل' },
  { id: 'services', nameAr: 'الخدمات', desc: 'تفاصيل الخدمات المقدمة' },
  { id: 'business_center', nameAr: 'مركز الأعمال', desc: 'مرافق وخدمات مركز الأعمال' },
  { id: 'studio', nameAr: 'الاستوديو', desc: 'معرض الصور والفيديوهات' },
  { id: 'training', nameAr: 'التدريب', desc: 'البرامج والدورات التدريبية' },
  { id: 'knowledge_hub', nameAr: 'مركز المعرفة', desc: 'المقالات والأبحاث والدراسات' },
  { id: 'contact', nameAr: 'تواصل', desc: 'معلومات الاتصال ونموذج المراسلة' },
  { id: 'blog_index', nameAr: 'المدونة', desc: 'أحدث الأخبار والمقالات' },
];

const DEFAULT_SECTIONS_PER_TEMPLATE: Record<CmsTemplate, Record<CmsPageType, CmsSectionType[]>> = {
  corporate: {
    home: ['hero', 'about', 'services', 'statistics', 'cta', 'footer'],
    about: ['about', 'team', 'statistics', 'footer'],
    services: ['services', 'cta', 'footer'],
    contact: ['contact', 'footer'],
    business_center: [],
    studio: [],
    training: [],
    knowledge_hub: [],
    blog_index: [],
    custom: []
  },
  professional_services: {
    home: ['hero', 'services', 'about', 'testimonials', 'cta', 'footer'],
    about: ['about', 'team', 'footer'],
    services: ['services', 'cta', 'footer'],
    contact: ['contact', 'footer'],
    business_center: [],
    studio: [],
    training: [],
    knowledge_hub: [],
    blog_index: [],
    custom: []
  },
  trading: {
    home: ['hero', 'products', 'about', 'partners', 'cta', 'footer'],
    about: ['about', 'statistics', 'footer'],
    services: ['services', 'products', 'footer'],
    contact: ['contact', 'footer'],
    business_center: [],
    studio: [],
    training: [],
    knowledge_hub: [],
    blog_index: [],
    custom: []
  },
  training: {
    home: ['hero', 'courses', 'about', 'trainers', 'testimonials', 'footer'],
    about: ['about', 'trainers', 'footer'],
    services: ['courses', 'footer'],
    contact: ['contact', 'footer'],
    business_center: [],
    studio: [],
    training: ['courses', 'trainers', 'footer'],
    knowledge_hub: [],
    blog_index: [],
    custom: []
  },
  construction: {
    home: ['hero', 'projects', 'about', 'services', 'statistics', 'footer'],
    about: ['about', 'team', 'statistics', 'footer'],
    services: ['services', 'projects', 'footer'],
    contact: ['contact', 'footer'],
    business_center: [],
    studio: [],
    training: [],
    knowledge_hub: [],
    blog_index: [],
    custom: []
  },
};

const INITIAL_STATE: TenantWebsiteWizardState = {
  step: 1,
  companyId: '',
  companyName: 'شركة تجريبية', // Ideally passed or fetched
  domainMode: 'subdomain',
  subdomain: '',
  customDomain: '',
  domainValidation: 'idle',
  template: 'corporate',
  name: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#002e69',
  secondaryColor: '#006d33',
  selectedPages: ['home'],
  pageSections: {
    home: ['hero', 'about', 'services', 'footer'],
    about: [],
    services: [],
    business_center: [],
    studio: [],
    training: [],
    knowledge_hub: [],
    contact: [],
    blog_index: [],
    custom: []
  },
  pageContent: {
    home: [
      {
        id: 'home-hero',
        type: 'hero',
        visible: true,
        order: 1,
        data: { title: 'مرحباً بك في موقعنا', subtitle: '', ctaText: 'تواصل معنا', ctaLink: '/contact' }
      }
    ]
  },
  siteSeqTitle: '',
  siteSeoDescription: '',
  pageSeo: {},
  previewDevice: 'desktop',
  publishValidation: [],
  isPublishing: false,
};

export default function TenantWebsiteWizard({
  companyId,
  userId,
  userName,
  onComplete,
  onClose,
}: TenantWebsiteWizardProps) {
  const [state, setState] = useState<TenantWebsiteWizardState>({
    ...INITIAL_STATE,
    companyId,
  });
  
  const [showWarning, setShowWarning] = useState(false);

  const updateState = (updates: Partial<TenantWebsiteWizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (state.step < 10) {
      updateState({ step: (state.step + 1) as any });
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      updateState({ step: (state.step - 1) as any });
    }
  };

  const handleClose = () => {
    if (state.step > 1 && !showWarning) {
      setShowWarning(true);
    } else {
      onClose();
    }
  };

  // Step 2: Domain Validation
  useEffect(() => {
    if (state.domainMode === 'subdomain' && state.subdomain) {
      const isValidFormat = /^[a-z0-9-]+$/.test(state.subdomain) && state.subdomain.length >= 2;
      const isReserved = RESERVED_SUBDOMAINS.includes(state.subdomain);
      
      if (!isValidFormat) {
        updateState({ domainValidation: 'invalid' });
      } else if (isReserved) {
        updateState({ domainValidation: 'reserved' });
      } else {
        updateState({ domainValidation: 'checking' });
        // Simulate API call
        const timer = setTimeout(() => {
          // Assume checking cmsService.checkDomainAvailability
          const isTaken = state.subdomain === 'taken'; // Mock check
          updateState({ domainValidation: isTaken ? 'taken' : 'valid' });
        }, 800);
        return () => clearTimeout(timer);
      }
    } else if (state.domainMode === 'custom' && state.customDomain) {
      const isValidFormat = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(state.customDomain);
      updateState({ domainValidation: isValidFormat ? 'valid' : 'invalid' });
    } else {
      updateState({ domainValidation: 'idle' });
    }
  }, [state.subdomain, state.customDomain, state.domainMode]);


  const validateStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return state.domainValidation === 'valid';
      case 3:
        return !!state.template;
      case 4:
        return !!state.name && !!state.primaryColor && !!state.secondaryColor;
      case 5:
        return state.selectedPages.includes('home');
      case 7:
        // Basic check for home hero
        return state.pageContent['home']?.some(s => s.type === 'hero' && (s.data as any).title);
      default:
        return true;
    }
  };

  const canProceed = validateStep(state.step);

  const handlePublish = async () => {
    updateState({ isPublishing: true });
    
    try {
      // Simulate API call
      // await cmsService.upsertTenantWebsite(...)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newSite: TenantWebsite = {
        id: 'new-site-id',
        companyId,
        siteType: 'tenant',
        name: state.name,
        slug: state.subdomain || 'custom',
        domain: state.domainMode === 'custom' ? state.customDomain : undefined,
        subdomain: state.domainMode === 'subdomain' ? state.subdomain : undefined,
        template: state.template,
        status: 'active',
        logoUrl: state.logoUrl,
        faviconUrl: state.faviconUrl,
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        primaryLanguage: 'ar',
        settings: {},
        seoTitle: state.siteSeqTitle,
        seoDescription: state.siteSeoDescription,
        robotsPolicy: 'index, follow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      onComplete(newSite);
    } catch (error) {
      console.error(error);
      updateState({ isPublishing: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" dir="rtl">
      {showWarning ? (
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الإغلاق</h3>
          <p className="text-slate-600 mb-6">لديك تغييرات غير محفوظة. هل أنت متأكد أنك تريد إغلاق المعالج؟</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowWarning(false)}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              تأكيد الإغلاق
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] max-h-[800px] overflow-hidden relative">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">إنشاء موقع جديد</h2>
              <p className="text-sm text-slate-500 mt-1">الخطوة {state.step} من 10</p>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 shrink-0">
            <div 
              className="h-full bg-[#002e69] transition-all duration-300 ease-out"
              style={{ width: `${(state.step / 10) * 100}%` }}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
              
              {/* Step 1: Company */}
              {state.step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Building2 className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">الشركة</h3>
                  </div>
                  <p className="text-slate-600">سيتم إنشاء الموقع للشركة التالية:</p>
                  
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#002e69]/10 text-[#002e69] rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{state.companyName}</h4>
                      <p className="text-sm text-slate-500">المعرف: {state.companyId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Domain */}
              {state.step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Globe className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">النطاق (Domain)</h3>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1 rounded-lg w-max mb-6">
                    <button
                      onClick={() => updateState({ domainMode: 'subdomain' })}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${state.domainMode === 'subdomain' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      نطاق فرعي
                    </button>
                    <button
                      onClick={() => updateState({ domainMode: 'custom' })}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${state.domainMode === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      نطاق خاص
                    </button>
                  </div>

                  {state.domainMode === 'subdomain' ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">النطاق الفرعي المطلوب</label>
                      <div className="flex items-stretch" dir="ltr">
                        <input
                          type="text"
                          value={state.subdomain}
                          onChange={(e) => updateState({ subdomain: e.target.value.toLowerCase() })}
                          className="flex-1 px-4 py-3 border border-r-0 border-slate-300 rounded-l-lg focus:ring-2 focus:ring-[#002e69] focus:border-[#002e69] outline-none text-right"
                          placeholder="company-name"
                        />
                        <div className="px-4 py-3 bg-slate-100 border border-slate-300 rounded-r-lg text-slate-500 font-mono text-sm flex items-center">
                          .alshamil.om
                        </div>
                      </div>
                      
                      {/* Validation messages */}
                      <div className="h-6">
                        {state.domainValidation === 'checking' && (
                          <p className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق من التوفر...</p>
                        )}
                        {state.domainValidation === 'invalid' && state.subdomain.length > 0 && (
                          <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات (-) فقط، وألا يقل عن حرفين.</p>
                        )}
                        {state.domainValidation === 'reserved' && (
                          <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> هذا النطاق محجوز للنظام.</p>
                        )}
                        {state.domainValidation === 'taken' && (
                          <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> هذا النطاق غير متاح، مستخدم من قبل شركة أخرى.</p>
                        )}
                        {state.domainValidation === 'valid' && (
                          <p className="text-green-600 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> النطاق متاح!</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700">النطاق الخاص</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={state.customDomain}
                        onChange={(e) => updateState({ customDomain: e.target.value.toLowerCase() })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002e69] focus:border-[#002e69] outline-none text-right"
                        placeholder="www.yourcompany.com"
                      />
                      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex gap-3 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>ستحتاج إلى إضافة سجل DNS (CNAME أو A Record) يدوياً في لوحة تحكم النطاق الخاص بك ليوجه إلى خوادم المنصة بعد إتمام الإنشاء.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Template */}
              {state.step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <LayoutTemplate className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">القالب الأساسي</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEMPLATES.map(tpl => (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          updateState({ 
                            template: tpl.id,
                            // Pre-fill default sections for this template
                            pageSections: {
                              ...state.pageSections,
                              home: DEFAULT_SECTIONS_PER_TEMPLATE[tpl.id].home || ['hero', 'footer']
                            }
                          });
                        }}
                        className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col gap-3 ${state.template === tpl.id ? 'border-[#002e69] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                          {/* Simulated Template UI */}
                          <div className="absolute top-0 inset-x-0 h-4 bg-slate-200/50" />
                          <div className="absolute top-8 inset-x-4 h-12 bg-slate-200 rounded" />
                          <div className="absolute bottom-4 inset-x-4 h-8 bg-slate-200 rounded" />
                          {state.template === tpl.id && (
                            <div className="absolute top-2 left-2 bg-[#002e69] text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{tpl.nameAr}</h4>
                          <p className="text-xs text-slate-500 mb-2">{tpl.nameEn}</p>
                          <p className="text-sm text-slate-600">{tpl.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Branding */}
              {state.step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Palette className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">الهوية البصرية</h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">اسم الموقع (العلامة التجارية) *</label>
                      <input
                        type="text"
                        value={state.name}
                        onChange={(e) => updateState({ name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002e69] focus:border-[#002e69] outline-none"
                        placeholder="مثال: الشامل للتقنية"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رابط الشعار (Logo URL)</label>
                        <input
                          type="url"
                          dir="ltr"
                          value={state.logoUrl}
                          onChange={(e) => updateState({ logoUrl: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-left"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رابط الأيقونة (Favicon URL)</label>
                        <input
                          type="url"
                          dir="ltr"
                          value={state.faviconUrl}
                          onChange={(e) => updateState({ faviconUrl: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg text-left"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">اللون الأساسي</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={state.primaryColor}
                            onChange={(e) => updateState({ primaryColor: e.target.value })}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={state.primaryColor}
                            onChange={(e) => updateState({ primaryColor: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left uppercase font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">اللون الثانوي</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={state.secondaryColor}
                            onChange={(e) => updateState({ secondaryColor: e.target.value })}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={state.secondaryColor}
                            onChange={(e) => updateState({ secondaryColor: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-left uppercase font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-sm font-medium text-slate-700 mb-3">معاينة الألوان:</p>
                      <div className="flex items-center gap-4">
                        <button style={{ backgroundColor: state.primaryColor }} className="px-6 py-2 rounded-lg text-white font-medium shadow-sm">
                          زر أساسي
                        </button>
                        <button style={{ color: state.secondaryColor, borderColor: state.secondaryColor }} className="px-6 py-2 rounded-lg bg-transparent border-2 font-medium">
                          زر ثانوي
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Pages */}
              {state.step === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Files className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">الصفحات</h3>
                  </div>
                  <p className="text-slate-600 mb-4">اختر الصفحات الأساسية التي ترغب في إضافتها للموقع:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PAGE_TYPES.map(page => {
                      const isRequired = page.id === 'home';
                      const isSelected = state.selectedPages.includes(page.id);
                      
                      return (
                        <label
                          key={page.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border ${isSelected ? 'border-[#002e69] bg-blue-50/30' : 'border-slate-200 bg-white'} ${isRequired ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer hover:border-[#002e69]/50'}`}
                        >
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isRequired}
                              onChange={(e) => {
                                if (isRequired) return;
                                const newPages = e.target.checked 
                                  ? [...state.selectedPages, page.id]
                                  : state.selectedPages.filter(p => p !== page.id);
                                updateState({ selectedPages: newPages });
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-[#002e69] focus:ring-[#002e69]"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{page.nameAr} {isRequired && <span className="text-xs text-[#002e69] bg-blue-100 px-2 py-0.5 rounded ml-2">أساسية</span>}</div>
                            <div className="text-sm text-slate-500">{page.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 6: Sections */}
              {state.step === 6 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Blocks className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">الأقسام (Sections)</h3>
                  </div>
                  <p className="text-slate-600 mb-4">تم تحديد الأقسام المقترحة بناءً على القالب المختار ({TEMPLATES.find(t=>t.id === state.template)?.nameAr}). يمكنك تعديلها:</p>

                  <div className="space-y-6">
                    {state.selectedPages.map(pageId => {
                      const pageInfo = PAGE_TYPES.find(p => p.id === pageId);
                      const currentSections = state.pageSections[pageId] || [];
                      
                      // Mock available sections per page for simplicity
                      const availableSections: {id: CmsSectionType, name: string}[] = [
                        {id: 'hero', name: 'الترويسة (Hero)'},
                        {id: 'about', name: 'نبذة عنا'},
                        {id: 'services', name: 'الخدمات'},
                        {id: 'statistics', name: 'إحصائيات'},
                        {id: 'projects', name: 'المشاريع'},
                        {id: 'products', name: 'المنتجات'},
                        {id: 'testimonials', name: 'آراء العملاء'},
                        {id: 'team', name: 'فريق العمل'},
                        {id: 'cta', name: 'دعوة لاتخاذ إجراء (CTA)'},
                        {id: 'contact', name: 'تواصل معنا'},
                        {id: 'footer', name: 'التذييل (Footer)'}
                      ];

                      return (
                        <div key={pageId} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-800">
                            صفحة: {pageInfo?.nameAr}
                          </div>
                          <div className="p-4 flex flex-wrap gap-2">
                            {availableSections.map(sec => {
                              const isSelected = currentSections.includes(sec.id);
                              return (
                                <button
                                  key={sec.id}
                                  onClick={() => {
                                    const newSecs = isSelected 
                                      ? currentSections.filter(s => s !== sec.id)
                                      : [...currentSections, sec.id];
                                    updateState({
                                      pageSections: {
                                        ...state.pageSections,
                                        [pageId]: newSecs
                                      }
                                    });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${isSelected ? 'bg-[#002e69] text-white border-[#002e69]' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                >
                                  {sec.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 7: Content */}
              {state.step === 7 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <FileText className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">المحتوى الأساسي</h3>
                  </div>
                  <p className="text-slate-600 mb-4">أدخل المحتوى المبدئي للصفحة الرئيسية. يمكنك إضافة باقي المحتوى لاحقاً من لوحة التحكم.</p>

                  <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-lg border-b pb-2 mb-4">الترويسة (Home Hero) *</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">العنوان الرئيسي *</label>
                      <input
                        type="text"
                        value={(state.pageContent['home']?.find(s => s.type === 'hero')?.data as any)?.title || ''}
                        onChange={(e) => {
                          const currentHome = state.pageContent['home'] || [];
                          const heroIndex = currentHome.findIndex(s => s.type === 'hero');
                          const newHome = [...currentHome];
                          if (heroIndex >= 0) {
                            newHome[heroIndex] = { ...newHome[heroIndex], data: { ...newHome[heroIndex].data, title: e.target.value } };
                          } else {
                            newHome.push({ id: 'home-hero', type: 'hero', visible: true, order: 1, data: { title: e.target.value } });
                          }
                          updateState({ pageContent: { ...state.pageContent, home: newHome } });
                        }}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="أهلاً بكم في موقعنا"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">النص الفرعي</label>
                      <textarea
                        value={(state.pageContent['home']?.find(s => s.type === 'hero')?.data as any)?.subtitle || ''}
                        onChange={(e) => {
                          const currentHome = state.pageContent['home'] || [];
                          const heroIndex = currentHome.findIndex(s => s.type === 'hero');
                          const newHome = [...currentHome];
                          if (heroIndex >= 0) {
                            newHome[heroIndex] = { ...newHome[heroIndex], data: { ...newHome[heroIndex].data, subtitle: e.target.value } };
                          }
                          updateState({ pageContent: { ...state.pageContent, home: newHome } });
                        }}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg h-24 resize-none"
                        placeholder="نحن نقدم أفضل الخدمات..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">نص الزر</label>
                        <input
                          type="text"
                          value={(state.pageContent['home']?.find(s => s.type === 'hero')?.data as any)?.ctaText || ''}
                          onChange={(e) => {
                             const currentHome = state.pageContent['home'] || [];
                             const heroIndex = currentHome.findIndex(s => s.type === 'hero');
                             const newHome = [...currentHome];
                             if (heroIndex >= 0) {
                               newHome[heroIndex] = { ...newHome[heroIndex], data: { ...newHome[heroIndex].data, ctaText: e.target.value } };
                             }
                             updateState({ pageContent: { ...state.pageContent, home: newHome } });
                          }}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                          placeholder="تواصل معنا"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">رابط الزر</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={(state.pageContent['home']?.find(s => s.type === 'hero')?.data as any)?.ctaLink || ''}
                          onChange={(e) => {
                             const currentHome = state.pageContent['home'] || [];
                             const heroIndex = currentHome.findIndex(s => s.type === 'hero');
                             const newHome = [...currentHome];
                             if (heroIndex >= 0) {
                               newHome[heroIndex] = { ...newHome[heroIndex], data: { ...newHome[heroIndex].data, ctaLink: e.target.value } };
                             }
                             updateState({ pageContent: { ...state.pageContent, home: newHome } });
                          }}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-left"
                          placeholder="/contact"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: SEO */}
              {state.step === 8 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Search className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">SEO والبحث</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">عنوان الموقع في محركات البحث (Title)</label>
                        <span className={`text-xs ${state.siteSeqTitle.length > 60 ? 'text-red-500' : 'text-slate-500'}`}>
                          {state.siteSeqTitle.length}/60
                        </span>
                      </div>
                      <input
                        type="text"
                        value={state.siteSeqTitle}
                        onChange={(e) => updateState({ siteSeqTitle: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002e69]"
                        placeholder={state.name || 'اسم الموقع'}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">وصف الموقع (Meta Description)</label>
                        <span className={`text-xs ${state.siteSeoDescription.length > 160 ? 'text-red-500' : 'text-slate-500'}`}>
                          {state.siteSeoDescription.length}/160
                        </span>
                      </div>
                      <textarea
                        value={state.siteSeoDescription}
                        onChange={(e) => updateState({ siteSeoDescription: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-[#002e69] resize-none"
                        placeholder="وصف مختصر للشركة وخدماتها يظهر في نتائج البحث..."
                      />
                    </div>

                    <div className="mt-8">
                      <h4 className="text-sm font-bold text-slate-700 mb-3">معاينة نتيجة البحث (Google):</h4>
                      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm max-w-xl">
                        <div className="text-sm text-[#202124] mb-1 flex items-center gap-2">
                          <div className="w-4 h-4 bg-slate-200 rounded-full overflow-hidden">
                            {state.faviconUrl && <img src={state.faviconUrl} alt="icon" className="w-full h-full object-cover" />}
                          </div>
                          <span>
                            {state.domainMode === 'subdomain' ? `https://${state.subdomain || 'domain'}.alshamil.om` : `https://${state.customDomain || 'www.domain.com'}`}
                          </span>
                        </div>
                        <h3 className="text-xl text-[#1a0dab] font-medium hover:underline cursor-pointer truncate">
                          {state.siteSeqTitle || state.name || 'عنوان الموقع'}
                        </h3>
                        <p className="text-sm text-[#4d5156] mt-1 line-clamp-2">
                          {state.siteSeoDescription || 'وصف الموقع يظهر هنا. اكتب وصفاً جذاباً يشجع المستخدمين على النقر وزيارة موقعك.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 9: Preview */}
              {state.step === 9 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Monitor className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">المعاينة والملخص</h3>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h4 className="font-bold text-lg mb-4">ملخص الموقع</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">اسم الموقع</div>
                        <div className="font-medium text-slate-900">{state.name || 'غير محدد'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">النطاق</div>
                        <div className="font-medium text-slate-900 dir-ltr text-right">
                          {state.domainMode === 'subdomain' ? `${state.subdomain}.alshamil.om` : state.customDomain}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">القالب</div>
                        <div className="font-medium text-slate-900">{TEMPLATES.find(t=>t.id === state.template)?.nameAr}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 mb-1">الصفحات</div>
                        <div className="font-medium text-slate-900">{state.selectedPages.length} صفحات</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-sm text-slate-500">الألوان:</div>
                      <div className="w-6 h-6 rounded border border-slate-300" style={{backgroundColor: state.primaryColor}} />
                      <div className="w-6 h-6 rounded border border-slate-300" style={{backgroundColor: state.secondaryColor}} />
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">ملاحظة هامة</p>
                        <p className="text-sm">سيتم نشر الموقع فور النقر على زر "تفعيل الموقع" في الخطوة التالية. يمكنك إيقاف نشره أو تعديله لاحقاً من لوحة التحكم.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 10: Publish */}
              {state.step === 10 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-[#002e69] mb-4">
                    <Rocket className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">التفعيل</h3>
                  </div>

                  <div className="space-y-3 mb-8">
                    <h4 className="font-bold text-lg mb-2">التحقق النهائي</h4>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="font-medium">اسم الموقع</span>
                      {state.name ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="font-medium">صلاحية النطاق</span>
                      {state.domainValidation === 'valid' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="font-medium">اختيار القالب</span>
                      {state.template ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <span className="font-medium">محتوى الصفحة الرئيسية</span>
                      {(state.pageContent['home']?.find(s => s.type === 'hero')?.data as any)?.title ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>

                  {canProceed ? (
                    <div className="text-center">
                      <button
                        onClick={handlePublish}
                        disabled={state.isPublishing}
                        className="inline-flex items-center justify-center gap-2 bg-[#006d33] hover:bg-[#006d33]/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl w-full md:w-auto min-w-[200px]"
                      >
                        {state.isPublishing ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            جاري التفعيل...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-6 h-6" />
                            تفعيل الموقع
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold mb-1">لا يمكن التفعيل حالياً</p>
                        <p className="text-sm">يرجى العودة للخطوات السابقة وإكمال المتطلبات الناقصة (المشار إليها بعلامة ❌).</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <button
              onClick={handleBack}
              disabled={state.step === 1 || state.isPublishing}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
              السابق
            </button>

            {state.step < 10 && (
              <button
                onClick={handleNext}
                disabled={!canProceed || state.isPublishing}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#002e69] text-white hover:bg-[#002e69]/90 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
