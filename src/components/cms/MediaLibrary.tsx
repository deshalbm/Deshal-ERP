import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileIcon, ImageIcon, Trash2, Search, Filter, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { CmsMedia, CmsMediaType } from '../../types/cms';

interface MediaLibraryProps {
  siteId: string;
  companyId: string;
  userId: string;
  userName: string;
  onSelect?: (media: CmsMedia) => void;
  selectionMode?: boolean;
}

export default function MediaLibrary({
  siteId,
  companyId,
  userId,
  userName,
  onSelect,
  selectionMode = false
}: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'document'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    // Mock fetch ensuring tenant isolation (siteId)
    setTimeout(() => {
      setMediaFiles([
        {
          id: '1',
          tenantWebsiteId: siteId,
          companyId,
          bucketName: 'cms-media',
          storagePath: 'images/sample.jpg',
          publicUrl: 'https://placehold.co/600x400',
          filename: 'sample.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
          mediaType: 'image',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف يتجاوز الحد الأقصى (10 ميجابايت)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Mock upload with progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          const newMedia: CmsMedia = {
            id: Math.random().toString(36).substr(2, 9),
            tenantWebsiteId: siteId,
            companyId,
            bucketName: 'cms-media',
            storagePath: `uploads/${file.name}`,
            publicUrl: 'https://placehold.co/600x400',
            filename: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
            mediaType: file.type.startsWith('image/') ? 'image' : 'document',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setMediaFiles(prevFiles => [newMedia, ...prevFiles]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذه الخطوة.')) {
      setMediaFiles(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleUpdateAltText = (id: string, altText: string) => {
    setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, altText } : m));
    // Here you would also call cmsService to update the record in DB
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredMedia = mediaFiles.filter(m => {
    const matchesFilter = filter === 'all' || m.mediaType === filter;
    const matchesSearch = m.filename.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-[#002e69] flex items-center gap-2">
          <ImageIcon className="w-6 h-6" /> مكتبة الوسائط
        </h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن ملف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#006d33]"
            />
          </div>
          <div className="flex bg-slate-100 rounded p-1 border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-white shadow text-[#002e69]' : 'text-slate-600'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-3 py-1 rounded text-sm ${filter === 'image' ? 'bg-white shadow text-[#002e69]' : 'text-slate-600'}`}
            >
              صور
            </button>
            <button
              onClick={() => setFilter('document')}
              className={`px-3 py-1 rounded text-sm ${filter === 'document' ? 'bg-white shadow text-[#002e69]' : 'text-slate-600'}`}
            >
              مستندات
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded text-blue-800 flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>تأكد من إضافة <strong>نص بديل (Alt Text)</strong> لجميع الصور لضمان توافقية الوصول (Accessibility) وتحسين محركات البحث.</p>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg bg-white p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={e => handleFileUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5">
                <div className="bg-[#006d33] h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-slate-600 text-sm">جاري الرفع... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-blue-50 text-[#002e69] rounded-full">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-slate-700">اسحب وأفلت الملفات هنا، أو انقر للاختيار</p>
                <p className="text-xs text-slate-500 mt-1">الحد الأقصى: 10 ميجابايت (صور أو PDF)</p>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white">
            لا توجد ملفات وسائط مطابقة.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map(media => (
              <div key={media.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col group">
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {media.mediaType === 'image' ? (
                    <img src={media.publicUrl} alt={media.altText || media.filename} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon className="w-12 h-12 text-slate-400" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(media.id); }}
                      className="p-1.5 bg-white/90 text-red-500 rounded hover:bg-red-50"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-sm font-medium text-slate-800 truncate" title={media.filename} dir="ltr">
                    {media.filename}
                  </p>
                  <p className="text-xs text-slate-500 flex justify-between">
                    <span>{formatSize(media.fileSizeBytes)}</span>
                    <span>{new Date(media.createdAt).toLocaleDateString()}</span>
                  </p>
                  
                  {media.mediaType === 'image' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="النص البديل (Alt)..."
                        defaultValue={media.altText || ''}
                        onBlur={e => handleUpdateAltText(media.id, e.target.value)}
                        className={`w-full text-xs p-1.5 border rounded focus:ring-[#006d33] ${!media.altText ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`}
                        title={!media.altText ? 'النص البديل مطلوب' : ''}
                      />
                    </div>
                  )}

                  {selectionMode && onSelect && (
                    <button
                      onClick={() => onSelect(media)}
                      className="mt-auto w-full py-1.5 bg-[#002e69] text-white text-sm rounded hover:bg-[#002e69]/90 transition-colors"
                    >
                      اختيار
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
