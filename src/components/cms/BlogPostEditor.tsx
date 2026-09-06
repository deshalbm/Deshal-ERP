import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, X, ChevronUp, ChevronDown, Check, AlertCircle, Image as ImageIcon 
} from 'lucide-react';
import { CmsBlogPost } from '../../types/cms';
import { SeoStudioPanel } from './SeoStudioPanel';

interface BlogPostEditorProps {
  siteId: string;
  companyId: string;
  userId: string;
  userRole: string;
  authorName: string;
  postId?: string;
  onSaved?: (post: CmsBlogPost) => void;
  onClose?: () => void;
}

export default function BlogPostEditor({
  siteId,
  companyId,
  userId,
  userRole,
  authorName,
  postId,
  onSaved,
  onClose
}: BlogPostEditorProps) {
  const [post, setPost] = useState<Partial<CmsBlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverImageAlt: '',
    category: '',
    tags: [],
    authorName: authorName,
    status: 'draft',
    wordCount: 0,
    readingTimeMinutes: 0
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [schemaExpanded, setSchemaExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (postId) {
      setLoading(true);
      // Mock fetch
      setTimeout(() => {
        setPost(prev => ({ ...prev, id: postId, title: 'مقال تجريبي', slug: 'test-post' }));
        setLoading(false);
      }, 500);
    }
  }, [postId]);

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

  const calculateReadingTime = (text: string) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    setPost(prev => ({
      ...prev,
      wordCount,
      readingTimeMinutes: Math.ceil(wordCount / 200)
    }));
  };

  const validateForPublish = () => {
    const newErrors: Record<string, string> = {};
    if (!post.title) newErrors.title = 'العنوان مطلوب';
    if (!post.slug) newErrors.slug = 'الرابط مطلوب';
    else if (!validateSlug(post.slug)) newErrors.slug = 'الرابط غير صالح';
    if (!post.excerpt) newErrors.excerpt = 'المقتطف مطلوب';
    if (post.coverImage && !post.coverImageAlt) newErrors.coverImageAlt = 'النص البديل للصورة مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: string) => {
    if (status === 'published' && !validateForPublish()) {
      alert('يرجى تصحيح الأخطاء قبل النشر.');
      return;
    }
    
    setSaving(true);
    setPost(prev => ({ ...prev, status: status as any }));
    
    // Mock save
    setTimeout(() => {
      setLastSaved(new Date());
      setSaving(false);
      if (onSaved) onSaved(post as CmsBlogPost);
    }, 1000);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && !post.tags?.includes(newTag)) {
        setPost(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) }));
  };

  const generateSchema = () => {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "image": post.coverImage,
      "author": {
        "@type": "Person",
        "name": post.authorName
      },
      "datePublished": post.publishedAt || new Date().toISOString(),
      "wordCount": post.wordCount
    };
  };

  if (loading) return <div className="p-8 text-center" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50" dir="rtl">
      <div className="flex justify-between items-center p-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-[#002e69]">
          {postId ? 'تعديل المقال' : 'إنشاء مقال جديد'}
        </h1>
        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>العنوان</span>
                <span className="text-xs text-slate-400">{post.title?.length || 0} حرف</span>
              </label>
              <input
                type="text"
                value={post.title || ''}
                onChange={e => {
                  setPost(prev => ({ ...prev, title: e.target.value }));
                  if (!postId) {
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setPost(prev => ({ ...prev, title: e.target.value, slug }));
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
                value={post.slug || ''}
                onChange={e => {
                  setPost(prev => ({ ...prev, slug: e.target.value }));
                  validateSlug(e.target.value);
                }}
                className={`w-full p-2 border rounded text-left focus:ring-2 focus:ring-[#006d33] ${errors.slug ? 'border-red-500' : 'border-slate-300'}`}
                dir="ltr"
              />
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>المقتطف</span>
                <span className={`text-xs ${(post.excerpt?.length || 0) > 300 ? 'text-red-500' : 'text-slate-400'}`}>
                  {post.excerpt?.length || 0} / 300
                </span>
              </label>
              <textarea
                value={post.excerpt || ''}
                onChange={e => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                className={`w-full p-2 border rounded h-20 focus:ring-2 focus:ring-[#006d33] ${errors.excerpt ? 'border-red-500' : 'border-slate-300'}`}
                maxLength={300}
              />
              {errors.excerpt && <p className="text-red-500 text-xs mt-1">{errors.excerpt}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>المحتوى</span>
                <span className="text-xs text-slate-500">وقت القراءة: {post.readingTimeMinutes} دقيقة</span>
              </label>
              <textarea
                value={post.content || ''}
                onChange={e => {
                  setPost(prev => ({ ...prev, content: e.target.value }));
                  calculateReadingTime(e.target.value);
                }}
                className="w-full p-4 border border-slate-300 rounded h-96 focus:ring-2 focus:ring-[#006d33] font-mono text-sm"
                placeholder="اكتب محتوى المقال هنا... (لا يدعم إدخال HTML مباشر لأسباب أمنية)"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          {/* Metadata */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-[#002e69] border-b pb-2">التصنيف والعلامات</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">الكاتب</label>
              <input
                type="text"
                value={post.authorName || ''}
                onChange={e => setPost(prev => ({ ...prev, authorName: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
              <input
                type="text"
                value={post.category || ''}
                onChange={e => setPost(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-slate-300 rounded"
                placeholder="مثال: أخبار، مقالات..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">العلامات (Tags)</label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full p-2 border border-slate-300 rounded mb-2"
                placeholder="اكتب واضغط Enter"
              />
              <div className="flex flex-wrap gap-2">
                {post.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-[#002e69] border-b pb-2">صورة الغلاف</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">رابط الصورة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={post.coverImage || ''}
                  onChange={e => setPost(prev => ({ ...prev, coverImage: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded text-left"
                  dir="ltr"
                />
              </div>
            </div>
            {post.coverImage && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">النص البديل (مطلوب)</label>
                <input
                  type="text"
                  value={post.coverImageAlt || ''}
                  onChange={e => setPost(prev => ({ ...prev, coverImageAlt: e.target.value }))}
                  className={`w-full p-2 border rounded ${errors.coverImageAlt ? 'border-red-500' : 'border-slate-300'}`}
                />
                {errors.coverImageAlt && <p className="text-red-500 text-xs mt-1">{errors.coverImageAlt}</p>}
              </div>
            )}
            {post.coverImage && (
              <div className="mt-2 rounded overflow-hidden border border-slate-200">
                <img src={post.coverImage} alt={post.coverImageAlt || 'Cover preview'} className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          {/* SEO / GEO / SMO Studio Panel */}
          <SeoStudioPanel
            seo={{
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
              canonicalUrl: post.canonicalUrl,
              ogImage: post.ogImage || post.coverImage,
              ogTitle: post.ogTitle,
              ogDescription: post.ogDescription,
              robots: post.robots,
              focusKeyword: post.focusKeyword,
              secondaryKeywords: post.secondaryKeywords,
              searchIntent: post.searchIntent,
              twitterTitle: post.twitterTitle,
              twitterDescription: post.twitterDescription,
              twitterImage: post.twitterImage || post.coverImage,
              twitterCard: post.twitterCard,
              geoPrimaryQuestion: post.geoPrimaryQuestion,
              geoDirectAnswer: post.geoDirectAnswer,
              geoKeyFacts: post.geoKeyFacts,
              geoFaqs: post.geoFaqs,
              eeatAuthorName: post.authorName,
              eeatReviewerName: post.eeatReviewerName,
            }}
            title={post.title || ''}
            slug={post.slug || ''}
            siteName="مدونة الدليل الشامل"
            domain="alshamil.om"
            onChange={updated => setPost(prev => ({ ...prev, ...updated }))}
          />

          {/* Schema Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <button 
              className="w-full flex justify-between items-center p-4 font-semibold text-[#002e69]"
              onClick={() => setSchemaExpanded(!schemaExpanded)}
            >
              معاينة Structured Data
              {schemaExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {schemaExpanded && (
              <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-200 rounded-b-lg overflow-x-auto" dir="ltr">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(generateSchema(), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-[#006d33]' : 'bg-amber-500'}`}></span>
            <span className="text-sm font-medium text-slate-700">
              {post.status === 'published' ? 'منشور' : post.status === 'under_review' ? 'قيد المراجعة' : 'مسودة'}
            </span>
          </div>
          {lastSaved && (
            <span className="text-xs text-slate-500">آخر حفظ تلقائي: {lastSaved.toLocaleTimeString()}</span>
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
          
          {(userRole === 'EDITOR' || userRole === 'ADMIN') && post.status === 'draft' && (
            <button 
              onClick={() => handleSave('under_review')}
              disabled={saving}
              className="px-4 py-2 text-white bg-amber-500 hover:bg-amber-600 rounded font-medium"
            >
              إرسال للمراجعة
            </button>
          )}

          {(userRole === 'REVIEWER' || userRole === 'ADMIN') && post.status === 'under_review' && (
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
                if(window.confirm('هل أنت متأكد من نشر هذا المقال؟')) {
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
