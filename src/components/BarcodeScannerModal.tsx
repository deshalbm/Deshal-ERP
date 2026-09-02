import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Barcode,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Sparkles,
  Package,
  Layers
} from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";
import { InventoryItem } from "../types";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  inventory?: InventoryItem[];
  title?: string;
  continuous?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  inventory = [],
  title,
  continuous = true
}) => {
  const { language, isRTL } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>("");
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Play audio beep sound
  const playBeep = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context restricted
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setErrorMessage(language === "ar" ? "الكاميرا غير مدعومة في هذا المتصفح" : "Camera API not supported in browser");
        setManualMode(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);

      // Check Torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      // Start Barcode Detection Loop
      startScanningLoop();
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setHasCameraPermission(false);
      setErrorMessage(
        language === "ar"
          ? "تعذر الوصول للكاميرا (يرجى التحقق من الأذونات أو استخدام الإدخال اليدوي)"
          : "Could not access camera. Please check permissions or use manual input."
      );
      setManualMode(true);
    }
  };

  // Toggle Flashlight/Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const newTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorch }]
      });
      setTorchOn(newTorch);
    } catch (e) {
      console.warn("Torch error", e);
    }
  };

  // Switch between front and back cameras
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Handle successful code capture
  const handleCodeDetected = (code: string) => {
    if (scanCooldown) return;
    const trimmed = code.trim();
    if (!trimmed) return;

    playBeep();
    setLastScannedCode(trimmed);
    setScanCount((c) => c + 1);

    // Find linked inventory item if any
    const found = inventory.find(
      (it) =>
        (it.barcode && it.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        it.sku.toLowerCase() === trimmed.toLowerCase()
    );
    setLastScannedItem(found || null);

    onScan(trimmed);

    // Set short cooldown to avoid scanning same barcode multiple times within 1.2 seconds
    setScanCooldown(true);
    setTimeout(() => {
      setScanCooldown(false);
    }, 1200);

    if (!continuous) {
      onClose();
    }
  };

  // Barcode Detection Scanning Loop
  const startScanningLoop = () => {
    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    let detector: any = null;

    if (BarcodeDetectorClass) {
      try {
        detector = new BarcodeDetectorClass({
          formats: [
            "code_128",
            "code_39",
            "code_93",
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "qr_code",
            "data_matrix"
          ]
        });
      } catch (e) {
        console.warn("BarcodeDetector formats fallback:", e);
      }
    }

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (detector && !scanCooldown) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleCodeDetected(rawValue);
            }
          }
        } catch {
          // ignore frame detection error
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Hardware Scanner / USB Barcode Reader listener
  useEffect(() => {
    if (!isOpen) return;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing inside an input element, don't hijack unless Enter is pressed
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Barcode scanners type very rapidly (< 40ms between characters)
      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleCodeDetected(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (diff > 100 && !isInput) {
          buffer = "";
        }
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, scanCooldown, inventory]);

  // Lifecycle
  useEffect(() => {
    if (isOpen && !manualMode) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, cameraFacing, manualMode]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeDetected(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Barcode className="w-5 h-5" />
            </div>
            <div className="text-start">
              <h3 className="text-sm font-bold text-white">
                {title || (language === "ar" ? "ماسح وقارئ الباركود" : "Barcode & QR Scanner")}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === "ar" ? "يدعم كاميرا الهاتف والماسح اللاسلكي واليدوي" : "Supports camera, USB scanner & manual input"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs transition-colors ${
                soundEnabled ? "bg-slate-800 text-indigo-400" : "bg-slate-800/50 text-slate-500"
              }`}
              title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewfinder or Manual Mode */}
        {!manualMode ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />

            {/* Target Viewfinder Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
              <div className="relative w-64 h-40 border-2 border-dashed border-indigo-400/80 rounded-2xl flex items-center justify-center overflow-hidden backdrop-brightness-110">
                {/* Laser Red Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-rose-500 animate-pulse shadow-md shadow-rose-500/80"></div>
                
                {/* Corner Markers */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>

                <div className="bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] text-white font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{language === "ar" ? "وجّه الباركود داخل الإطار" : "Align barcode in box"}</span>
                </div>
              </div>
            </div>

            {/* Floating Camera Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-slate-700/60 shadow-lg cursor-pointer"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>{cameraFacing === "environment" ? (language === "ar" ? "الكاميرا الخلفية" : "Rear") : (language === "ar" ? "الأمامية" : "Front")}</span>
              </button>

              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border shadow-lg cursor-pointer ${
                    torchOn
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                  <span>{language === "ar" ? "الفلاش" : "Flash"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setManualMode(true)}
                className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer ms-auto"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "إدخال يدوي" : "Manual"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Manual Input Fallback View */
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                <span>{language === "ar" ? "إدخال رقم الباركود يدوياً" : "Enter Barcode Manually"}</span>
              </span>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{language === "ar" ? "العودة للكاميرا" : "Use Camera"}</span>
              </button>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded-xl text-start">
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-2.5">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={language === "ar" ? "اكتب أو الصق رقم الباركود / SKU..." : "Type or paste barcode/SKU..."}
                className="w-full bg-slate-900 border border-slate-700 text-white text-center font-mono text-sm rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {language === "ar" ? "بحث وإضافة المنتج" : "Search & Add Product"}
              </button>
            </form>
          </div>
        )}

        {/* Last Scanned Feedback Toast */}
        {lastScannedCode && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-start animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {lastScannedItem ? lastScannedItem.name : (language === "ar" ? "تمت قراءة الرمز بنجاح" : "Barcode Scanned")}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {lastScannedCode} {lastScannedItem && `• ${lastScannedItem.sellingPrice?.toFixed(3)}`}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
              #{scanCount}
            </span>
          </div>
        )}

        {/* Quick Inventory Suggestions based on search */}
        {inventory.length > 0 && (
          <div className="text-start space-y-1.5 pt-1">
            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === "ar" ? "أصناف متوفرة بها باركود سريع:" : "Quick Barcoded Items:"}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {inventory.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCodeDetected(item.barcode || item.sku)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/50 hover:border-indigo-500 text-slate-200 border border-slate-750 text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Barcode className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[120px]">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
