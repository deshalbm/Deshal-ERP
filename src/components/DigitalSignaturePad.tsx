import React, { useRef, useState, useEffect } from "react";
import { useLanguage } from "../utils/LanguageContext";
import {
  PenTool,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Download,
  Image as ImageIcon
} from "lucide-react";

interface DigitalSignaturePadProps {
  initialSignatureUrl?: string;
  initialSignature?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  onSaveSignature: (signatureDataUrl: string) => void;
  onClearSignature?: () => void;
  onClose?: () => void;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  initialSignatureUrl = "",
  initialSignature = "",
  signatoryName = "",
  signatoryTitle = "",
  onSaveSignature,
  onClearSignature,
  onClose
}) => {
  const effectiveInitialUrl = initialSignatureUrl || initialSignature || "";
  const { language, t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<"draw" | "upload" | "presets">("draw");
  const [strokeColor, setStrokeColor] = useState<string>("#0f172a");
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [uploadedPreview, setUploadedPreview] = useState<string>(effectiveInitialUrl);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isInteractingRef = useRef<boolean>(false);

  // Initialize canvas
  useEffect(() => {
    if (activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas internal resolution
        canvas.width = 600;
        canvas.height = 240;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        // If existing signature and user hasn't cleared, load it or clear canvas
        if (initialSignatureUrl && !hasDrawn && initialSignatureUrl.startsWith("data:image")) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, (canvas.width - img.width) / 2, (canvas.height - img.height) / 2);
            saveHistory();
          };
          img.src = initialSignatureUrl;
        } else {
          // Clear with transparent bg
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          saveHistory();
        }
      }
    }
  }, [activeTab]);

  // Update stroke styles
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
      }
    }
  }, [strokeColor, strokeWidth]);

  const saveHistory = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    isInteractingRef.current = true;
    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isInteractingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isInteractingRef.current) return;
    if (e) e.preventDefault();
    isInteractingRef.current = false;
    setIsDrawing(false);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.closePath();
      }
    }
    saveHistory();
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
    setHistory([]);
    saveHistory();
  };

  const handleUndo = () => {
    if (!canvasRef.current || history.length <= 1) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistory(newHistory);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCalligraphicPreset = (styleIndex: number) => {
    const name = signatoryName || (language === "ar" ? "المدير المالي العام" : "Authorized Officer");
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (styleIndex === 1) {
      // Elegant Script
      ctx.font = "italic 44px 'Great Vibes', 'Brush Script MT', 'Tajawal', cursive, serif";
      ctx.fillStyle = strokeColor;
      ctx.fillText(name, canvas.width / 2, 100);

      // Underline flourish
      ctx.beginPath();
      ctx.moveTo(120, 140);
      ctx.bezierCurveTo(240, 160, 400, 120, 480, 145);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (styleIndex === 2) {
      // Executive Seal Style
      ctx.font = "bold 32px 'Cinzel', 'Cairo', sans-serif";
      ctx.fillStyle = strokeColor;
      ctx.fillText(name, canvas.width / 2, 85);

      ctx.font = "16px 'Tajawal', sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(signatoryTitle || "Certified Authorized Officer", canvas.width / 2, 125);

      // Line Flourish
      ctx.beginPath();
      ctx.moveTo(160, 150);
      ctx.lineTo(440, 150);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Arabic Traditional signature style
      ctx.font = "bold italic 48px 'Amiri', 'Aref Ruqaa', 'Cairo', serif";
      ctx.fillStyle = strokeColor;
      ctx.fillText(`✍️ ${name}`, canvas.width / 2, 110);
    }

    return canvas.toDataURL("image/png");
  };

  const handleSave = () => {
    let finalUrl = "";
    if (activeTab === "draw") {
      if (canvasRef.current) {
        finalUrl = canvasRef.current.toDataURL("image/png");
      }
    } else if (activeTab === "upload") {
      finalUrl = uploadedPreview;
    } else if (activeTab === "presets") {
      finalUrl = selectedPreset;
    }

    const resultUrl = finalUrl || uploadedPreview || effectiveInitialUrl;
    if (resultUrl) {
      onSaveSignature(resultUrl);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/40 rounded-xl border border-indigo-400/30 text-indigo-300">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {language === "ar" ? "إعداد التوقيع الرقمي المعتمد" : "Certified Digital Signature Pad"}
              </h2>
              <p className="text-xs text-indigo-200">
                {language === "ar"
                  ? "ارسم توقيعك بدقة أو ارفعه ليدرج تلقائياً في السندات والفواتير"
                  : "Draw, upload, or generate an authorized digital signature"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose && onClose()}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === "draw"
                ? "bg-white text-indigo-600 border-slate-200 -mb-px shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100"
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>{language === "ar" ? "رسم التوقيع الرقمي" : "Draw Signature"}</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-indigo-600 border-slate-200 -mb-px shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === "ar" ? "رفع صورة التوقيع" : "Upload File"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("presets");
              if (!selectedPreset) {
                setSelectedPreset(generateCalligraphicPreset(1));
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === "presets"
                ? "bg-white text-indigo-600 border-slate-200 -mb-px shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === "ar" ? "نماذج وتوقيعات جاهزة" : "Calligraphic Styles"}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: DRAW SIGNATURE */}
          {activeTab === "draw" && (
            <div className="space-y-4">
              
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* Color choices */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {language === "ar" ? "لون الحبر:" : "Ink Color:"}
                  </span>
                  {[
                    { color: "#0f172a", label: "Navy / Slate" },
                    { color: "#1d4ed8", label: "Royal Blue" },
                    { color: "#065f46", label: "Emerald" },
                    { color: "#000000", label: "Black" }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setStrokeColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        strokeColor === c.color ? "ring-2 ring-indigo-500 ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Stroke thickness */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {language === "ar" ? "السماكة:" : "Thickness:"}
                  </span>
                  <div className="flex bg-white rounded-xl border border-slate-200 p-0.5">
                    {[
                      { width: 1.8, label: language === "ar" ? "رفيع" : "Fine" },
                      { width: 2.8, label: language === "ar" ? "متوسط" : "Med" },
                      { width: 4.2, label: language === "ar" ? "عريض" : "Bold" }
                    ].map((w) => (
                      <button
                        key={w.width}
                        type="button"
                        onClick={() => setStrokeWidth(w.width)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          strokeWidth === w.width ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Undo / Clear Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={history.length <= 1}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                    title={language === "ar" ? "تراجع" : "Undo"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title={language === "ar" ? "مسح اللوحة" : "Clear Pad"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Canvas */}
              <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl bg-white p-2 shadow-inner overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-48 sm:h-56 cursor-crosshair touch-none rounded-2xl bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
                />

                {/* Background Guide Line */}
                <div className="absolute bottom-10 left-12 right-12 border-b border-slate-300 pointer-events-none flex justify-between text-[10px] text-slate-400 px-2 font-mono">
                  <span>{language === "ar" ? "خط التوقيع الرقمي" : "Sign on the line"}</span>
                  <span>{signatoryName || "Authorized Signatory"}</span>
                </div>

                {!hasDrawn && !initialSignatureUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 space-y-1">
                    <PenTool className="w-8 h-8 text-slate-300 animate-bounce" />
                    <span className="text-xs font-semibold">
                      {language === "ar" ? "استخدم الماوس أو اللمس لرسم توقيعك هنا" : "Draw your signature here using pen, mouse or touch"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD SIGNATURE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-3xl p-8 text-center bg-slate-50 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {language === "ar" ? "اسحب وأفلت صورة التوقيع هنا، أو انقر للاختيار" : "Upload signature image (PNG / JPG / SVG)"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "ar" ? "يفضل ملف PNG شفاف بدقة عالية للحصول على أفضل جودة طباعة" : "Transparent PNG recommended for best print output"}
                  </p>
                </div>
                <label className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all">
                  <span>{language === "ar" ? "تصفح الملفات" : "Browse Files"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadedPreview && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <img src={uploadedPreview} alt="Uploaded Signature" className="h-14 max-w-xs object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {language === "ar" ? "معاينة التوقيع المرفوع" : "Active Signature Preview"}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {language === "ar" ? "جاهز للإدراج في السندات" : "Ready for document embedding"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedPreview("")}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                {language === "ar"
                  ? "اختر تصميماً إلكترونياً معتمداً لاسمك ومنصبك المالي ليتم اعتماده كختم توقيع:"
                  : "Choose an automated certified signature layout generated from your profile info:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((styleId) => {
                  const presetData = generateCalligraphicPreset(styleId);
                  const isSelected = selectedPreset === presetData;
                  return (
                    <div
                      key={styleId}
                      onClick={() => setSelectedPreset(presetData)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 bg-white ${
                        isSelected ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-200" : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="h-20 flex items-center justify-center p-2 bg-slate-50/80 rounded-xl overflow-hidden">
                        <img src={presetData} alt={`Style ${styleId}`} className="max-h-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold pt-1">
                        <span>
                          {styleId === 1
                            ? (language === "ar" ? "خط ديواني انسيابي" : "Flourish Script")
                            : styleId === 2
                            ? (language === "ar" ? "ختم إداري رسمي" : "Executive Seal")
                            : (language === "ar" ? "توقيع تقليدي" : "Traditional Sign")}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">
                {language === "ar" ? "مصادقة التوقيع الرقمي الآمن" : "Verified Digital Signature Certification"}
              </span>
              <span className="text-[11px] text-emerald-700">
                {language === "ar"
                  ? `يتم إدراج هذا التوقيع تلقائياً في أسفل جميع السندات والفواتير باسم [${signatoryName || "المدير المالي"}]`
                  : `This signature will be embedded on all printable receipts & invoices for [${signatoryName || "Authorized Signatory"}]`}
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onClose && onClose()}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{language === "ar" ? "حفظ واعتماد التوقيع" : "Save & Apply Signature"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
