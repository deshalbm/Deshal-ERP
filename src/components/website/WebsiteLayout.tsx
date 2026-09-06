import React, { useState, useEffect } from 'react';
import { WebsiteHeader } from './WebsiteHeader';
import { WebsiteFooter } from './WebsiteFooter';
import { MobileNavigation } from './MobileNavigation';
import { SeoManager } from '../../utils/seoManager';

import { WebHome } from './WebHome';
import { WebAbout } from './WebAbout';
import { WebServices } from './WebServices';
import { WebBusinessCenter } from './WebBusinessCenter';
import { WebStudio } from './WebStudio';
import { WebTraining } from './WebTraining';
import { WebKnowledgeHub } from './WebKnowledgeHub';
import { WebContact } from './WebContact';

interface WebsiteLayoutProps {
  initialPath?: string;
  onNavigateToERP?: () => void;
}

export const WebsiteLayout: React.FC<WebsiteLayoutProps> = ({ initialPath = '/', onNavigateToERP }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (initialPath && initialPath !== '/') return initialPath;
    const path = window.location.pathname;
    return path === '/app' ? '/' : path;
  });

  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('alshamil_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState<string | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('alshamil_lang', currentLang);
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  useEffect(() => {
    let key = 'home';
    if (currentPath === '/about') key = 'about';
    else if (currentPath === '/services') key = 'services';
    else if (currentPath === '/business-center') key = 'business-center';
    else if (currentPath === '/studio') key = 'studio';
    else if (currentPath === '/training') key = 'training';
    else if (currentPath === '/knowledge' || currentPath === '/blog' || currentPath === '/blogs') key = 'knowledge';
    else if (currentPath === '/contact') key = 'contact';

    SeoManager.applySeo(key);
  }, [currentPath]);

  const handleNavigate = (path: string, prefill?: string) => {
    if (prefill) {
      setPrefilledService(prefill);
    }
    setCurrentPath(path);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLang = (lang: 'ar' | 'en') => {
    setCurrentLang(lang);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans transition-colors duration-200" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* TOP ERP APPS BAR FOR TESTING / ADMIN REDIRECT */}
      <div className="bg-[#002e69] text-white text-[11px] px-4 py-1.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8df9a5] animate-pulse"></span>
          <span className="font-bold">الموقع الإلكتروني الرسمي — شركة الدليل الشامل (صحار، سلطنة عُمان)</span>
        </div>
        {onNavigateToERP && (
          <button
            onClick={onNavigateToERP}
            className="bg-[#006d33] hover:bg-emerald-600 text-white font-bold px-3 py-0.5 rounded text-[10px] transition-colors"
          >
            الانتقال لنظام Deshal ERP ←
          </button>
        )}
      </div>

      {/* HEADER */}
      <WebsiteHeader
        currentPath={currentPath}
        onNavigate={handleNavigate}
        currentLang={currentLang}
        onToggleLang={handleToggleLang}
        onNavigateToERP={onNavigateToERP}
        onOpenMobileMenu={() => setMobileNavOpen(true)}
      />

      {/* MOBILE NAV DRAWER */}
      <MobileNavigation
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentLang={currentLang}
        onNavigateToERP={onNavigateToERP}
      />

      {/* PAGE BODY CONTENT */}
      <main className="pt-24 min-h-screen max-w-[1320px] mx-auto px-4 sm:px-8">
        {(currentPath === '/' || currentPath === '') && (
          <WebHome
            onNavigate={(tab) => {
              if (tab === 'contact') handleNavigate('/contact');
              else if (tab === 'business-center') handleNavigate('/business-center');
              else if (tab === 'services') handleNavigate('/services');
              else if (tab === 'studio') handleNavigate('/studio');
              else if (tab === 'training') handleNavigate('/training');
              else if (tab === 'knowledge-hub') handleNavigate('/knowledge');
            }}
            onBookSpace={(space) => handleNavigate('/contact', space)}
            onBookService={(service) => handleNavigate('/contact', service)}
          />
        )}

        {currentPath === '/about' && (
          <WebAbout onNavigate={(tab) => handleNavigate('/contact')} />
        )}

        {currentPath === '/services' && (
          <WebServices
            onNavigate={(tab) => handleNavigate('/contact')}
            onBookService={(service) => handleNavigate('/contact', service)}
          />
        )}

        {currentPath === '/business-center' && (
          <WebBusinessCenter
            onNavigate={(tab) => handleNavigate('/contact')}
            onBookSpace={(space) => handleNavigate('/contact', space)}
          />
        )}

        {currentPath === '/studio' && (
          <WebStudio
            onNavigate={(tab) => handleNavigate('/contact')}
            onBookService={(service) => handleNavigate('/contact', service)}
          />
        )}

        {currentPath === '/training' && (
          <WebTraining
            onNavigate={(tab) => handleNavigate('/contact')}
            onBookService={(service) => handleNavigate('/contact', service)}
          />
        )}

        {(currentPath === '/knowledge' || currentPath === '/blog' || currentPath === '/blogs') && (
          <WebKnowledgeHub onNavigate={(tab) => handleNavigate('/contact')} />
        )}

        {currentPath === '/contact' && (
          <WebContact
            onNavigate={(tab) => handleNavigate('/')}
            prefilledInterest={prefilledService}
          />
        )}
      </main>

      {/* FOOTER */}
      <WebsiteFooter onNavigate={handleNavigate} currentLang={currentLang} />
    </div>
  );
};
