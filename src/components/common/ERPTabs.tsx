import React from 'react';

export interface TabItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export interface ERPTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  isRTL?: boolean;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const ERPTabs: React.FC<ERPTabsProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  isRTL = true,
  variant = 'pills',
  className = ''
}) => {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-slate-200 overflow-x-auto custom-scrollbar ${className}`}>
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`py-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />}
                <span>{isRTL ? tab.labelAr : tab.labelEn}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      tab.badgeColor || (isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-1 bg-slate-100/90 rounded-2xl flex items-center gap-1 overflow-x-auto custom-scrollbar border border-slate-200/60 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap select-none ${
              isActive
                ? 'bg-white text-indigo-600 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />}
            <span>{isRTL ? tab.labelAr : tab.labelEn}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  tab.badgeColor || (isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
