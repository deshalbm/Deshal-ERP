import React, { useState } from 'react';
import { 
  Globe, 
  Building2, 
  Phone, 
  BookOpen, 
  Mic, 
  School, 
  FileText, 
  Compass, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { WebHome } from './WebHome';
import { WebAbout } from './WebAbout';
import { WebServices } from './WebServices';
import { WebBusinessCenter } from './WebBusinessCenter';
import { WebStudio } from './WebStudio';
import { WebTraining } from './WebTraining';
import { WebKnowledgeHub } from './WebKnowledgeHub';
import { WebContact } from './WebContact';

import { DynamicMetadataEngine } from './DynamicMetadataEngine';
import { WebsiteBreadcrumbs } from './WebsiteBreadcrumbs';

interface WebsiteViewProps {
  onOpenERPModule?: (moduleTab: string) => void;
  onOpenSpaceBookingModal?: (spaceType?: string) => void;
  onOpenServiceBookingModal?: (serviceName?: string) => void;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({ 
  onOpenERPModule, 
  onOpenSpaceBookingModal, 
  onOpenServiceBookingModal 
}) => {
  const [activeWebTab, setActiveWebTab] = useState<string>('home');
  const [prefilledService, setPrefilledService] = useState<string | undefined>(undefined);

  const getTabMetadata = (tab: string) => {
    switch (tab) {
      case 'about-us':
      case 'about':
        return {
          title: 'عن الشركة — الدليل الشامل صحار',
          description: 'شركة استشارية متخصصة ومصرحة في سلطنة عُمان لتأسيس ودعم نمو المشاريع من صحار.',
          path: '/about',
          breadcrumbs: [{ label: 'عن الشركة' }]
        };
      case 'services':
        return {
          title: 'الخدمات الاستشارية — الدليل الشامل صحار',
          description: 'تأسيس الشركات، دراسات الجدوى، استشارات الهيكلة، والتسويق في سلطنة عُمان.',
          path: '/services',
          breadcrumbs: [{ label: 'الخدمات الاستشارية' }]
        };
      case 'business-center':
      case 'business-ecosystem':
        return {
          title: 'مركز الأعمال بصحار — حاضنة مكاتب ومساحات عمل',
          description: 'مكاتب مجهزة، قاعات اجتماعات، وعناوين تجارية معتمدة في صحار.',
          path: '/business-center',
          breadcrumbs: [{ label: 'مركز الأعمال بصحار' }]
        };
      case 'creative-studio':
      case 'studio':
        return {
          title: 'استوديو البودكاست والمحتوى المرئي — صحار',
          description: 'استوديو محتويات صوتية ومرئية مجهز بأحدث تقنيات التسجيل في صحار.',
          path: '/creative-studio',
          breadcrumbs: [{ label: 'استوديو البودكاست' }]
        };
      case 'training':
      case 'training-academy':
        return {
          title: 'أكاديمية التدريب والورش — صحار',
          description: 'برامج تطويرية وورش عمل تخصصية لرواد الأعمال والمستثمرين.',
          path: '/training',
          breadcrumbs: [{ label: 'التدريب والورش' }]
        };
      case 'knowledge-hub':
      case 'insights-and-articles':
        return {
          title: 'مركز المعرفة والمدونة — الدليل الشامل',
          description: 'مقالات وأدلة استرشادية حول تأسيس وإدارة الشركات في سلطنة عُمان.',
          path: '/knowledge-hub',
          breadcrumbs: [{ label: 'مركز المعرفة' }]
        };
      case 'contact':
        return {
          title: 'حجز موعد وتواصل — الدليل الشامل صحار',
          description: 'تواصل مع مستشارينا في صحار أو احجز موعد استشارة وتأسيس.',
          path: '/contact',
          breadcrumbs: [{ label: 'حجز موعد وتواصل' }]
        };
      default:
        return {
          title: 'الدليل الشامل لاستشارات إدارة المشاريع — صحار',
          description: 'شركة استشارية متخصصة ومصرحة في سلطنة عُمان. خدمات التأسيس، دراسات الجدوى، ومركز الأعمال بصحار.',
          path: '/',
          breadcrumbs: []
        };
    }
  };

  const activeMeta = getTabMetadata(activeWebTab);

  const handleNavigate = (tab: string, prefill?: string) => {
    if (prefill) {
      setPrefilledService(prefill);
    }
    setActiveWebTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookSpace = (spaceType?: string) => {
    if (onOpenSpaceBookingModal) {
      onOpenSpaceBookingModal(spaceType);
    } else {
      handleNavigate('contact', spaceType);
    }
  };

  const handleBookService = (serviceName?: string) => {
    if (onOpenServiceBookingModal) {
      onOpenServiceBookingModal(serviceName);
    } else {
      handleNavigate('contact', serviceName);
    }
  };

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Compass },
    { id: 'about-us', label: 'عن الشركة', icon: Compass },
    { id: 'services', label: 'الخدمات الاستشارية', icon: FileText },
    { id: 'business-center', label: 'مركز الأعمال بصحار', icon: Building2 },
    { id: 'creative-studio', label: 'استوديو البودكاست', icon: Mic },
    { id: 'training', label: 'التدريب والورش', icon: School },
    { id: 'knowledge-hub', label: 'مركز المعرفة', icon: BookOpen },
    { id: 'contact', label: 'حجز موعد وتواصل', icon: Phone }
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans text-right pb-16" dir="rtl">
      {/* Dynamic Metadata & Head Manager */}
      <DynamicMetadataEngine
        seo={{
          seoTitle: activeMeta.title,
          seoDescription: activeMeta.description,
          canonicalUrl: `https://deshalbm.com${activeMeta.path}`,
          ogImage: '/assets/images/deshal_logo.png',
          robots: 'index, follow',
        }}
        siteName="شركة الدليل الشامل لاستشارات إدارة المشاريع"
        domain="deshalbm.com"
        pageTitle={activeMeta.title}
        path={activeMeta.path}
        logoUrl="/assets/images/deshal_logo.png"
        breadcrumbs={activeMeta.breadcrumbs.map(b => ({ name: b.label, url: `https://deshalbm.com${activeMeta.path}` }))}
      />

      {/* ERP INTEGRATION CONTROL BAR */}
      <div className="bg-[#002e69] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner border-b border-blue-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8df9a5] animate-pulse"></span>
          <span className="font-bold">الموقع الإلكتروني الرسمي — منظومة الدليل الشامل (صحار، سلطنة عُمان)</span>
          <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-[10px]">مربوط بالنظام ERP</span>
        </div>

        <div className="flex items-center gap-3">
          {onOpenERPModule && (
            <>
              <button 
                onClick={() => onOpenERPModule('crm')}
                className="hover:underline flex items-center gap-1 text-blue-200 text-[11px]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>عرض عملاء CRM المكتسبين</span>
              </button>
              <span>•</span>
              <button 
                onClick={() => onOpenERPModule('spaces')}
                className="hover:underline flex items-center gap-1 text-blue-200 text-[11px]"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>إدارة حجز المساحات</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* WEBSITE HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Title */}
          <div 
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src="/assets/images/deshal_logo.png" 
              alt="الدليل الشامل" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-black text-xl text-[#002e69] leading-tight group-hover:text-[#14448c] transition-colors">
                الدليل الشامل
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                لاستشارات إدارة المشاريع | صحار
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-reverse space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeWebTab === item.id || (activeWebTab === 'about' && item.id === 'about-us')
                    ? 'bg-blue-50 text-[#002e69]'
                    : 'text-slate-600 hover:text-[#002e69] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#006d33]" />
              <span>صحار، سلطنة عُمان</span>
            </div>
            <button
              onClick={() => handleNavigate('contact')}
              className="bg-[#006d33] hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
            >
              حجز موعد
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50 gap-2 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeWebTab === item.id
                  ? 'bg-[#002e69] text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* PAGE CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {activeWebTab !== 'home' && (
          <WebsiteBreadcrumbs items={activeMeta.breadcrumbs} onNavigate={handleNavigate} />
        )}

        {(activeWebTab === 'home') && (
          <WebHome 
            onNavigate={handleNavigate} 
            onBookSpace={handleBookSpace} 
            onBookService={handleBookService} 
          />
        )}
        {(activeWebTab === 'about-us' || activeWebTab === 'about') && (
          <WebAbout onNavigate={handleNavigate} />
        )}
        {(activeWebTab === 'services') && (
          <WebServices onNavigate={handleNavigate} onBookService={handleBookService} />
        )}
        {(activeWebTab === 'business-center' || activeWebTab === 'business-ecosystem') && (
          <WebBusinessCenter onNavigate={handleNavigate} onBookSpace={handleBookSpace} />
        )}
        {(activeWebTab === 'creative-studio' || activeWebTab === 'studio') && (
          <WebStudio onNavigate={handleNavigate} onBookService={handleBookService} />
        )}
        {(activeWebTab === 'training' || activeWebTab === 'training-academy') && (
          <WebTraining onNavigate={handleNavigate} onBookService={handleBookService} />
        )}
        {(activeWebTab === 'knowledge-hub' || activeWebTab === 'insights-and-articles') && (
          <WebKnowledgeHub onNavigate={handleNavigate} />
        )}
        {(activeWebTab === 'contact') && (
          <WebContact onNavigate={handleNavigate} prefilledInterest={prefilledService} />
        )}
      </main>

      {/* EXECUTIVE FOOTER */}
      <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#006d33] flex items-center justify-center text-white font-bold">
                  د
                </div>
                <span className="font-extrabold text-lg text-white">الدليل الشامل لاستشارات إدارة المشاريع</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-sm">
                شركة استشارية متخصصة ومصرحة في سلطنة عُمان، تخدم المستثمرين ورواد الأعمال من التأسيس إلى التوسع القيادي بمركز أعمال متكامل ومستودع استشاري في صحار.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>سجل تجاري وترخيص استشاري رسمي معتمد • صحار</span>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <span className="font-bold text-white text-sm block">روابط المنظومة</span>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => handleNavigate('home')} className="hover:text-white">الرئيسية</button></li>
                <li><button onClick={() => handleNavigate('services')} className="hover:text-white">الخدمات الاستشارية</button></li>
                <li><button onClick={() => handleNavigate('business-center')} className="hover:text-white">مركز الأعمال بصحار</button></li>
                <li><button onClick={() => handleNavigate('studio')} className="hover:text-white">استوديو البودكاست</button></li>
                <li><button onClick={() => handleNavigate('training')} className="hover:text-white">أكاديمية التدريب</button></li>
                <li><button onClick={() => handleNavigate('knowledge-hub')} className="hover:text-white">مركز المعرفة والمدونة</button></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <span className="font-bold text-white text-sm block">بيانات المقر والتواصل</span>
              <div className="space-y-2 text-slate-400">
                <p>📍 الطابق الثاني ٢٠٠٩-٢٠١٢ | مبنى عمانا بلازا | فلج القبائل | صحار | سلطنة عمان (ص.ب: 311)</p>
                <p dir="ltr">📞 الأرضي: +968 22730630 | المتحرك: +968 77627500</p>
                <p>✉️ بريد: info@deshalbm.com</p>
                <p>🌐 الموقع: www.deshalbm.com</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs gap-4">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} شركة الدليل الشامل لاستشارات إدارة المشاريع — صحار، سلطنة عُمان.</span>
            <span>مربوط ومنفذ عبر منظومة Deshal ERP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
