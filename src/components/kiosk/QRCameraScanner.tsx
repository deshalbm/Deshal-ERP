import React, { useState, useEffect, useRef } from "react";
import { Camera, XCircle, AlertTriangle, RefreshCw, Upload, CheckCircle2, QrCode } from "lucide-react";

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScan,
  onClose,
  title = "مسح QR Code عبر الكاميرا",
  description = "وجه كاميرا الجهاز نحو رمز QR المخصص للاقتران والتفعيل الفوري"
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [manualCode, setManualCode] = useState<string>("");
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrameId: number | null = null;
    let isSubscribed = true;

    async function startCamera() {
      try {
        setErrorMessage("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasCameraAccess(true);
          scanFrames();
        }
      } catch (err: any) {
        console.warn("Camera access failed:", err);
        if (isSubscribed) {
          setHasCameraAccess(false);
          setErrorMessage("تعذر فتح كاميرا الجهاز. يمكنك رفع صورة الكود أو إدخاله يدوياً.");
        }
      }
    }

    async function scanFrames() {
      if (!isSubscribed || !isScanningActive) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Native BarcodeDetector API check
        if ("BarcodeDetector" in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const raw = barcodes[0].rawValue;
              onScan(raw);
              return; // Stop scanning once detected
            }
          } catch (e) {
            // Fallback frame scan if BarcodeDetector fails
          }
        }
      }

      animFrameId = requestAnimationFrame(scanFrames);
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, isScanningActive, onScan]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        if ("BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              onScan(barcodes[0].rawValue);
              return;
            }
          } catch (err) {
            console.warn("BarcodeDetector image failed:", err);
          }
        }
        alert("تعذر قراءة الـ QR Code من الصورة التلقائية. يرجى التأكد من وضوح الرمز أو إدخال الكود.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>{title}</span>
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 text-center leading-relaxed">{description}</p>

          {/* Video Viewport */}
          <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Box Overlay */}
            {hasCameraAccess && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br" />
                  {/* Laser Line */}
                  <div className="w-full h-0.5 bg-amber-400/90 shadow-[0_0_12px_#f59e0b] animate-bounce mt-24" />
                </div>
              </div>
            )}

            {/* Fallback state when camera fails */}
            {hasCameraAccess === false && (
              <div className="p-6 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">{errorMessage || "الكاميرا غير متاحة حالياً"}</p>
                
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة الـ QR Code</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Toggle Camera direction button */}
          {hasCameraAccess && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تبديل الكاميرا ({facingMode === "environment" ? "الخلفية" : "الأمامية"})</span>
              </button>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400">أو لصق الكود المرمز يدوياً (JSON / Activation Code):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit();
                }}
                placeholder="ألصق كود الـ QR أو كود التفعيل هنا..."
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl font-mono text-xs outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
