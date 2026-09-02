import React from "react";
import {
  Home,
  ShoppingCart,
  PlusCircle,
  Boxes,
  Layers,
  Sparkles
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

interface MobileBottomNavProps {
  activeTab: "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "schedules" | "settings";
  setActiveTab: (tab: "home" | "pos" | "accounting" | "spaces" | "contracts" | "services" | "portal" | "doc-wizard" | "editor" | "preview" | "history" | "crm" | "inventory" | "purchases" | "branches" | "employees" | "schedules" | "settings") => void;
  onNewVoucher: () => void;
  onOpenAiAssistant: () => void;
  onOpenDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onNewVoucher,
  onOpenAiAssistant,
  onOpenDrawer
}) => {
  const { language, t, dir } = useLanguage();

  // Check if current active tab is in secondary drawer menus
  const isDrawerTabActive = ![
    "home",
    "pos",
    "inventory"
  ].includes(activeTab);

  return (
    <nav
      data-pwa-nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pwa-safe-bottom shadow-lg print:hidden"
      dir={dir}
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-between px-2 py-1.5 max-w-md mx-auto">
        
        {/* 1. Home Tab */}
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "home"
              ? "text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "home" ? "bg-indigo-50 text-indigo-600" : ""}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">{t("tabHome")}</span>
        </button>

        {/* 2. POS Quick Register */}
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "pos"
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "pos" ? "bg-emerald-50 text-emerald-600" : ""}`}>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">{t("tabPos")}</span>
        </button>

        {/* 3. Center FAB Button: New Voucher */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            onClick={onNewVoucher}
            title={t("newVoucher")}
            className="w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/25 flex items-center justify-center active:scale-95 hover:bg-slate-800 transition-all border-3 border-white cursor-pointer group"
          >
            <PlusCircle className="w-6 h-6 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <span className="text-[9px] font-bold text-slate-800 mt-1 leading-none">
            {language === "ar" ? "سند جديد" : "New"}
          </span>
        </div>

        {/* 4. Inventory Tab */}
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "inventory" ? "bg-indigo-50 text-indigo-600" : ""}`}>
            <Boxes className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">{t("tabInventory")}</span>
        </button>

        {/* 5. Full Navigation Drawer Button */}
        <button
          onClick={onOpenDrawer}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
            isDrawerTabActive
              ? "text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className={`p-1.5 rounded-xl relative transition-colors ${isDrawerTabActive ? "bg-indigo-50 text-indigo-600" : ""}`}>
            <Layers className="w-5 h-5" />
            {isDrawerTabActive && (
              <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">
            {language === "ar" ? "الأقسام" : "Modules"}
          </span>
        </button>

      </div>
    </nav>
  );
};
