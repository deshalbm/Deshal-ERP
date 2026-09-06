import React from 'react';
import { Monitor, Tablet, Smartphone, AlertCircle } from 'lucide-react';
import { PreviewDevice } from '../../types/cms';

interface PreviewFrameProps {
  siteId: string;
  pageSlug?: string;
  postSlug?: string;
  previewType: 'page' | 'post' | 'site';
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  isDraft?: boolean;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({
  siteId,
  pageSlug,
  postSlug,
  previewType,
  device,
  onDeviceChange,
  isDraft
}) => {
  const getDeviceWidth = () => {
    switch (device) {
      case 'desktop': return '1280px';
      case 'tablet': return '768px';
      case 'mobile': return '375px';
      default: return '100%';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-300">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className="text-slate-600 font-medium text-sm px-2">معاينة:</span>
          {isDraft && (
            <span className="flex items-center text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              <AlertCircle size={14} className="ml-1" />
              معاينة مسودة
            </span>
          )}
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-md">
          <button
            onClick={() => onDeviceChange('desktop')}
            className={`p-1.5 rounded-sm transition-colors ${device === 'desktop' ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-700'}`}
            title="Desktop"
          >
            <Monitor size={18} />
          </button>
          <button
            onClick={() => onDeviceChange('tablet')}
            className={`p-1.5 rounded-sm transition-colors ${device === 'tablet' ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-700'}`}
            title="Tablet"
          >
            <Tablet size={18} />
          </button>
          <button
            onClick={() => onDeviceChange('mobile')}
            className={`p-1.5 rounded-sm transition-colors ${device === 'mobile' ? 'bg-white shadow-sm text-blue-800' : 'text-slate-500 hover:text-slate-700'}`}
            title="Mobile"
          >
            <Smartphone size={18} />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-200 flex justify-center overflow-auto p-4 md:p-8">
        <div
          className="bg-white shadow-lg transition-all duration-300 ease-in-out relative flex flex-col"
          style={{ 
            width: getDeviceWidth(),
            minHeight: '100%',
            height: 'fit-content'
          }}
        >
          {isDraft ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-slate-300 m-4 rounded-lg">
              <AlertCircle size={48} className="mb-4 text-amber-500 opacity-50" />
              <h3 className="text-xl font-medium text-slate-700 mb-2">محتوى غير منشور</h3>
              <p>اضغط نشر لمعاينة المحتوى العام</p>
            </div>
          ) : (
            <div className="w-full h-full min-h-[500px] bg-slate-50 flex items-center justify-center text-slate-400">
              <p>محتوى الموقع الفعلي سيعرض هنا...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewFrame;
