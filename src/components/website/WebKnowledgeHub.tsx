import React, { useState } from 'react';
import { BookOpen, Search, Tag, Calendar, User, ArrowLeft, X } from 'lucide-react';

interface WebKnowledgeHubProps {
  onNavigate: (tab: string) => void;
}

export const WebKnowledgeHub: React.FC<WebKnowledgeHubProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  const articles = [
    {
      id: 1,
      title: 'دليل خطوات تأسيس شركة تجارية في سلطنة عُمان عبر منصة استثمر بسهولة',
      category: 'تأسيس وتراخيص',
      author: 'سالم الغافري - مستشار تأسيس',
      date: '2025-10-22',
      summary: 'شرح مفصل ومحدث لكل خطوات إصدار السجل التجاري، تحديد الأنشطة الاقتصادية، وتراخيص صحار والمنطقة الحرة.',
      content: `تعد بوابة "استثمر بسهولة" التابعة لوزارة التجارة والصناعة وترويج الاستثمار بالسلطنة المنفذ الرقمي الرئيسي لتأسيس الشركات...
1. اختيار الكيان القانوني (شركة ذات مسؤولية محدودة، شخص واحد، فرع شركة أجنبية).
2. استخراج التراخيص الفرعية والبلدية وموافقة هيئة بيئة.
3. التجهيز المكتبي واعتماد العنوان التجاري من خلال مراكز الأعمال المعتمدة بصحار.`
    },
    {
      id: 2,
      title: 'كيف تعد دراسة جدوى اقتصادية مقبولة لدى بنك التنمية العماني؟',
      category: 'دراسات جدوى',
      author: 'فريق الاستشارات المالية',
      date: '2025-10-18',
      summary: 'أهم 5 عناصر ركيزة يركز عليها المحللون الماليون لتقييم التدفقات النقدية ونسب الاسترداد للمشاريع في شمال الباطنة.',
      content: `عند تقديم طلب التمويل لبنك التنمية العماني أو هيئة ريادة، يتطلب الملف استيفاء عدة معايير دقيقة...
1. التحليل المالي التفصيلي (Cash Flow & NPV).
2. دراسة الطلب المحلي والعرض المنافس في محافظة شمال الباطنة.
3. خطة إدارة المخاطر وتوقع نقطة التعادل التعادل (Break-even).`
    },
    {
      id: 3,
      title: 'لماذا تعد صحار الوجهة الاستثمارية الأبرز للمشاريع الصناعية واللوجستية؟',
      category: 'فرص الاستثمار',
      author: 'د. أحمد الزدجالي',
      date: '2025-10-10',
      summary: 'استكشف المزايا الاستراتيجية للقرب من ميناء صحار والمنطقة الحرة وشبكة الطرق الدولية والتسهيلات المقدمة للمستثمرين.',
      content: `تتمتع صحار بموقع جغرافي فريد على بحر عُمان خارج مضيق هرمز، مما يجعلها مركزاً لوجستياً إقليمياً يربط أسواق الخليج بآسيا وإفريقيا...`
    }
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || art.category === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="w-full flex flex-col space-y-12 pb-12 font-sans text-right" dir="rtl">
      {/* HERO */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#002e69] px-4 py-1.5 rounded-full text-xs font-bold w-fit">
          <BookOpen className="w-4 h-4 text-[#006d33]" />
          <span>مركز المعرفة والمدونة الاستثمارية • صحار</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#002e69] leading-tight">
          مركز المعرفة والاستثمار — <br />
          <span className="text-[#006d33]">أدلتك الاستشارية والإجرائية لبدء ونمو مشروعك.</span>
        </h1>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن المقالات، أدلة التأسيس، دراسات الجدوى..."
              className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#002e69]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {['تأسيس وتراخيص', 'دراسات جدوى', 'فرص الاستثمار'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                  selectedTag === tag ? 'bg-[#002e69] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARTICLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full">{article.category}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#002e69] leading-snug">{article.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{article.summary}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {article.author}
              </span>
              <button
                onClick={() => setActiveArticle(article)}
                className="text-xs font-bold text-[#002e69] hover:underline flex items-center gap-1"
              >
                <span>قراءة الدليل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ARTICLE MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-6 left-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-[#006d33] bg-emerald-50 px-3 py-1 rounded-full inline-block">{activeArticle.category}</span>
            <h2 className="text-2xl font-bold text-[#002e69]">{activeArticle.title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{activeArticle.author}</span>
              <span>•</span>
              <span>{activeArticle.date}</span>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-4 border-t border-slate-100">
              {activeArticle.content}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setActiveArticle(null);
                  onNavigate('contact');
                }}
                className="bg-[#002e69] text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-[#14448c]"
              >
                تواصل مع الكاتب للاستشارة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
