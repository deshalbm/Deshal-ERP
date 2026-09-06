import React, { useState } from 'react';
import {
  Search, Globe, Share2, Sparkles, AlertTriangle, CheckCircle, Info,
  BookOpen, HelpCircle, Shield, UserCheck, ExternalLink, RefreshCw
} from 'lucide-react';
import { CmsSeoFields } from '../../types/cms';
import { calculateSeoScore } from '../../lib/cms/seoEngine';

interface SeoStudioPanelProps {
  seo: CmsSeoFields;
  title: string;
  slug: string;
  siteName: string;
  domain: string;
  onChange: (updatedSeo: CmsSeoFields) => void;
}

export const SeoStudioPanel: React.FC<SeoStudioPanelProps> = ({
  seo,
  title,
  slug,
  siteName,
  domain,
  onChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'meta' | 'previews' | 'geo' | 'eeat'>('meta');
  const [previewPlatform, setPreviewPlatform] = useState<'google' | 'facebook' | 'twitter' | 'whatsapp' | 'ai'>('google');

  const seoTitle = seo.seoTitle || title || '';
  const seoDesc = seo.seoDescription || '';
  const canonical = seo.canonicalUrl || `https://${domain}/${slug === 'home' ? '' : slug}`;
  const ogImg = seo.ogImage || '';

  const { score, issues } = calculateSeoScore({
    title,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    canonicalUrl: seo.canonicalUrl,
    ogImage: seo.ogImage,
    focusKeyword: seo.focusKeyword,
    geoPrimaryQuestion: seo.geoPrimaryQuestion,
    geoDirectAnswer: seo.geoDirectAnswer,
  });

  const handleFieldChange = (key: keyof CmsSeoFields, value: unknown) => {
    onChange({ ...seo, [key]: value });
  };

  const getScoreBadgeColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s >= 50) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans text-right" dir="rtl">
      {/* Header with Live Score */}
      <div className="bg-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/30 rounded-xl flex items-center justify-center text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">استوديو تحسين محركات البحث وSEO / GEO / SMO</h3>
            <p className="text-xs text-slate-400">تحسين محركات البحث التقليدية وتطبيقات الذكاء الاصطناعي والمشاركات الاجتماعية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border font-bold text-xs flex items-center gap-2 ${getScoreBadgeColor(score)}`}>
            <span>SEO Score:</span>
            <span className="text-sm">{score} / 100</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('meta')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors ${
            activeSubTab === 'meta' ? 'border-[#006d33] text-[#002e69] bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>إعدادات Meta & Keywords</span>
        </button>
        <button
          onClick={() => setActiveSubTab('previews')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors ${
            activeSubTab === 'previews' ? 'border-[#006d33] text-[#002e69] bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>المعاينة التفاعلية (Google & Social & AI)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('geo')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors ${
            activeSubTab === 'geo' ? 'border-[#006d33] text-[#002e69] bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>الذكاء الاصطناعي GEO / AEO</span>
        </button>
        <button
          onClick={() => setActiveSubTab('eeat')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-colors ${
            activeSubTab === 'eeat' ? 'border-[#006d33] text-[#002e69] bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الموثوقية والخبرة E-E-A-T</span>
        </button>
      </div>

      {/* Content Panels */}
      <div className="p-6 space-y-6">
        {/* Panel 1: Meta & Keywords */}
        {activeSubTab === 'meta' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكلمة المفتاحية المستهدفة (Focus Keyword)</label>
                <input
                  type="text"
                  value={seo.focusKeyword || ''}
                  onChange={e => handleFieldChange('focusKeyword', e.target.value)}
                  placeholder="مثال: استشارات تأسيس الشركات في صحار"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قصد البحث (Search Intent)</label>
                <select
                  value={seo.searchIntent || 'informational'}
                  onChange={e => handleFieldChange('searchIntent', e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
                >
                  <option value="informational">معلوماتي (Informational)</option>
                  <option value="transactional">شرائي / حجز (Transactional)</option>
                  <option value="commercial">تجاري / مقارنة (Commercial)</option>
                  <option value="navigational">توجيهي / اسم الشركة (Navigational)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">عنوان SEO (SEO Title Tag)</label>
                <span className={`text-[11px] font-semibold ${seoTitle.length > 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {seoTitle.length} / 60 حرفاً (المستهدف: 50-60)
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={e => handleFieldChange('seoTitle', e.target.value)}
                placeholder={title || 'أدخل عنوان الصفحة المستهدف لمحركات البحث...'}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">وصف الصفحة (Meta Description)</label>
                <span className={`text-[11px] font-semibold ${seoDesc.length > 160 ? 'text-[#002e69]' : 'text-slate-500'}`}>
                  {seoDesc.length} / 160 حرفاً (المستهدف: 120-160)
                </span>
              </div>
              <textarea
                value={seoDesc}
                onChange={e => handleFieldChange('seoDescription', e.target.value)}
                placeholder="أدخل وصفاً مركزاً يعبر عن محتوى الصفحة ويحتوي على الكلمة المفتاحية..."
                rows={3}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرابط الرسمي المعتمد (Canonical URL)</label>
                <input
                  type="text"
                  value={seo.canonicalUrl || ''}
                  onChange={e => handleFieldChange('canonicalUrl', e.target.value)}
                  placeholder={canonical}
                  dir="ltr"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg text-left focus:ring-2 focus:ring-[#006d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توجيهات الفهرسة (Robots Directive)</label>
                <select
                  value={seo.robots || 'index, follow'}
                  onChange={e => handleFieldChange('robots', e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
                >
                  <option value="index, follow">index, follow (سماح بالفهرسة والتتبع)</option>
                  <option value="noindex, follow">noindex, follow (منع الفهرسة مع التتبع)</option>
                  <option value="noindex, nofollow">noindex, nofollow (حظر كامل للمحركات)</option>
                </select>
              </div>
            </div>

            {/* SEO Health Issues Audit Box */}
            {issues.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>توصيات تحسين الصحة البرمجية للـ SEO ({issues.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {issues.map((iss, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {iss.type === 'error' && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      {iss.type === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                      {iss.type === 'info' && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      <span className="text-slate-700">{iss.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Previews */}
        {activeSubTab === 'previews' && (
          <div className="space-y-5">
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setPreviewPlatform('google')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewPlatform === 'google' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Google Search
              </button>
              <button
                onClick={() => setPreviewPlatform('facebook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewPlatform === 'facebook' ? 'bg-[#1877F2] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Facebook / LinkedIn
              </button>
              <button
                onClick={() => setPreviewPlatform('twitter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewPlatform === 'twitter' ? 'bg-black text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                X (Twitter) Card
              </button>
              <button
                onClick={() => setPreviewPlatform('whatsapp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewPlatform === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                WhatsApp Share
              </button>
              <button
                onClick={() => setPreviewPlatform('ai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewPlatform === 'ai' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                AI Answer Engine
              </button>
            </div>

            {/* Google Preview */}
            {previewPlatform === 'google' && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-2xl space-y-1 text-right" dir="rtl">
                <div className="text-[11px] text-slate-500 truncate" dir="ltr">
                  {canonical}
                </div>
                <div className="text-blue-800 font-medium text-base hover:underline cursor-pointer">
                  {seoTitle}
                </div>
                <div className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                  {seoDesc || 'يرجى كتابة وصف للصفحة ليظهر هنا في محرك البحث Google...'}
                </div>
              </div>
            )}

            {/* Facebook / LinkedIn Preview */}
            {previewPlatform === 'facebook' && (
              <div className="bg-slate-100 p-4 rounded-xl max-w-md border border-slate-300 overflow-hidden space-y-3">
                <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {ogImg ? (
                    <img src={ogImg} alt="OG Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-xs">لا توجد صورة OpenGraph مخصصة</div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{domain}</div>
                  <div className="font-bold text-xs text-slate-900 truncate">{seo.ogTitle || seoTitle}</div>
                  <div className="text-slate-600 text-[11px] line-clamp-2">{seo.ogDescription || seoDesc}</div>
                </div>
              </div>
            )}

            {/* Twitter Preview */}
            {previewPlatform === 'twitter' && (
              <div className="bg-black text-white p-4 rounded-2xl max-w-md border border-slate-800 space-y-3">
                <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  {seo.twitterImage || ogImg ? (
                    <img src={seo.twitterImage || ogImg} alt="Twitter Card" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-600 text-xs">صورة Twitter Card</div>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 text-[10px]">{domain}</div>
                  <div className="font-bold text-white truncate">{seo.twitterTitle || seoTitle}</div>
                  <div className="text-slate-400 text-[11px] line-clamp-2">{seo.twitterDescription || seoDesc}</div>
                </div>
              </div>
            )}

            {/* WhatsApp Preview */}
            {previewPlatform === 'whatsapp' && (
              <div className="bg-[#E5DDD5] p-4 rounded-xl max-w-sm border border-slate-300 space-y-2">
                <div className="bg-[#DCF8C6] p-3 rounded-lg text-xs space-y-2 shadow-sm">
                  <div className="bg-white/80 p-2 rounded border border-emerald-100 flex gap-3 items-center">
                    {ogImg && <img src={ogImg} alt="Thumbnail" className="w-12 h-12 object-cover rounded" />}
                    <div className="overflow-hidden">
                      <div className="font-bold text-slate-900 text-[11px] truncate">{seoTitle}</div>
                      <div className="text-slate-500 text-[10px] truncate">{seoDesc}</div>
                      <div className="text-emerald-700 text-[9px] truncate">{domain}</div>
                    </div>
                  </div>
                  <div className="text-slate-800 font-medium text-xs dir-ltr">{canonical}</div>
                </div>
              </div>
            )}

            {/* AI Answer Engine Preview */}
            {previewPlatform === 'ai' && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                  <span>معاينة اقتباس محركات الإجابة (Gemini / ChatGPT Search / Perplexity)</span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    السؤال المفتاح: {seo.geoPrimaryQuestion || `ما هي خدمات ${title}؟`}
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed bg-purple-50/50 p-3 rounded border border-purple-100">
                    {seo.geoDirectAnswer || seoDesc || 'توفير إجابة مباشرة قصيرة يسمح للذكاء الاصطناعي باقتباسها في أعلى الإجابة.'}
                  </div>
                  <div className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                    <span>المصدر المقتبس:</span>
                    <span className="underline">{siteName} ({domain})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 3: GEO / AEO */}
        {activeSubTab === 'geo' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السؤال الرئيسي المستهدف (Primary Question)</label>
              <input
                type="text"
                value={seo.geoPrimaryQuestion || ''}
                onChange={e => handleFieldChange('geoPrimaryQuestion', e.target.value)}
                placeholder="مثال: كيف يمكن تأسيس شركة تجارية في صحار؟"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الإجابة المباشرة الموثقة (Direct Short Answer)</label>
              <textarea
                value={seo.geoDirectAnswer || ''}
                onChange={e => handleFieldChange('geoDirectAnswer', e.target.value)}
                placeholder="إجابة مباشرة دقيقة ومختصرة (في حدود 40-60 كلمة) بدون حشو لكي يتم اقتباسها كـ Featured Snippet ومصدر للـ AI..."
                rows={3}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Panel 4: E-E-A-T */}
        {activeSubTab === 'eeat' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المؤلف (Author Name)</label>
                <input
                  type="text"
                  value={seo.eeatAuthorName || ''}
                  onChange={e => handleFieldChange('eeatAuthorName', e.target.value)}
                  placeholder="مثال: م. علي الزدجالي"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مؤهلات وخبرات المؤلف (Credentials)</label>
                <input
                  type="text"
                  value={seo.eeatAuthorCredentials || ''}
                  onChange={e => handleFieldChange('eeatAuthorCredentials', e.target.value)}
                  placeholder="مثال: مستشار إدارة مشاريع معتمد PMP"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المراجع المعتمد (Reviewer Name)</label>
              <input
                type="text"
                value={seo.eeatReviewerName || ''}
                onChange={e => handleFieldChange('eeatReviewerName', e.target.value)}
                placeholder="مثال: د. حمد البلوشي — رئيس القسم الاستشاري"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006d33]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
