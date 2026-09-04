import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  Lock,
  QrCode,
  Award,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';
import { RequestDocument } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import { captureElementToCanvas } from '../../utils/pdfGenerator';
import jsPDF from 'jspdf';

interface GeneratedDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RequestDocument | null;
  companySettings?: any;
}

export const GeneratedDocumentModal: React.FC<GeneratedDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  companySettings
}) => {
  const { language } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (document?.qrPayload) {
      QRCode.toDataURL(document.qrPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const metadata = document.metadata || {};
  const companyName = companySettings?.name || 'شركة ديشال لحلول الأعمال المتكاملة ش.م.م';
  const companyCr = companySettings?.crNumber || '1492084';
  const companyAddress = companySettings?.address || 'سلطنة عمان - صحار / مسقط';
  const companyPhone = companySettings?.phone || '+968 2450 0000';
  const companyEmail = companySettings?.email || 'info@deshal.om';

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF Export using captureElementToCanvas (with OKLCH color sanitizer) & jsPDF
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await captureElementToCanvas(printRef.current);
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${document.documentNumber}_${document.templateNameEn || 'Official_Document'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to print
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>{document.titleAr}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                  {document.documentNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? 'مستند رسمي صادر وموثق إلكترونياً مع رمز QR فريد' : 'Official certified document with digital QR validation'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer border border-slate-700 shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>{language === 'ar' ? 'طباعة المستند' : 'Print'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? (language === 'ar' ? 'جاري التصدير...' : 'Exporting...') : (language === 'ar' ? 'تحميل PDF رسمي' : 'Download PDF')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Canvas / Printable Area */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-200/80 print:p-0 print:bg-white">
          <div
            ref={printRef}
            id="deshal-official-document"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg print:shadow-none print:rounded-none relative flex flex-col justify-between border border-slate-200 print:border-none"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Top Official Letterhead Header */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-indigo-900 pb-5 mb-8">
                {/* Company Brand (Right in RTL / Left in LTR) */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md border border-indigo-700">
                    D
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-indigo-950 tracking-tight leading-tight">
                      {companyName}
                    </h1>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      سجل تجاري (C.R): <span className="font-mono text-indigo-900">{companyCr}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Deshal Integrated Business Solutions S.P.C - Sultanate of Oman
                    </p>
                  </div>
                </div>

                {/* Document Reference & Metadata Box */}
                <div className="text-start rtl:text-left text-xs space-y-1 bg-slate-50 border border-slate-200/80 p-3 rounded-xl min-w-[190px]">
                  <div className="flex items-center justify-between gap-3 text-slate-600">
                    <span className="font-bold text-slate-500">رقم الإشارة:</span>
                    <span className="font-mono font-extrabold text-indigo-950">{document.documentNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-slate-600">
                    <span className="font-bold text-slate-500">تاريخ الإصدار:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {new Date(document.generatedAt).toLocaleDateString('ar-OM', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-slate-600">
                    <span className="font-bold text-slate-500">رمز التحقق:</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-700">{document.verificationCode}</span>
                  </div>
                </div>
              </div>

              {/* Document Main Heading Title */}
              <div className="text-center my-6">
                <div className="inline-block px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-2xs">
                  <h2 className="text-lg sm:text-xl font-black text-indigo-950 tracking-wide">
                    {document.titleAr}
                  </h2>
                  {document.titleEn && (
                    <p className="text-xs font-bold text-indigo-700 tracking-wider uppercase mt-0.5 font-sans">
                      {document.titleEn}
                    </p>
                  )}
                </div>
              </div>

              {/* Document Body Content */}
              <div className="text-sm leading-relaxed text-slate-800 space-y-5 my-6">
                {metadata.renderedBodyAr ? (
                  <div className="whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100 font-medium text-justify">
                    {metadata.renderedBodyAr}
                  </div>
                ) : (
                  <div className="whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100 font-medium">
                    {document.titleAr} - {document.documentNumber}
                  </div>
                )}

                {/* Optional Financial Breakdown Table for Salary Certificate / Statement */}
                {metadata.basicSalary && (
                  <div className="my-6 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-indigo-950 text-white px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-extrabold">تفصيل الاستحقاقات والأجر المعتمد (Remuneration Breakdown)</span>
                      <span className="text-[11px] font-mono text-indigo-200">العملة: {metadata.currency || 'ر.ع (OMR)'}</span>
                    </div>
                    <table className="w-full text-xs text-center divide-y divide-slate-200">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="py-2 px-3 text-start">البيان (Item)</th>
                          <th className="py-2 px-3">الراتب الأساسي (Basic)</th>
                          <th className="py-2 px-3">البدلات الثابتة (Allowances)</th>
                          <th className="py-2 px-3 bg-indigo-50 text-indigo-950 font-black">إجمالي الراتب الشهري (Gross)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-medium">
                        <tr>
                          <td className="py-3 px-3 text-start font-bold text-slate-900">
                            {metadata.employeeName || 'الموظف'} ({metadata.employeeCode})
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">{metadata.basicSalary}</td>
                          <td className="py-3 px-3 font-mono text-slate-700">{metadata.allowances}</td>
                          <td className="py-3 px-3 font-mono font-black text-indigo-900 bg-indigo-50/60 text-sm">
                            {metadata.totalSalary} {metadata.currency || 'ر.ع'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* English Content Section if bilingual */}
                {metadata.renderedBodyEn && (
                  <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-600 font-sans leading-relaxed text-justify" dir="ltr">
                    <p className="font-bold text-slate-800 mb-1 text-sm uppercase">English Translation / Transcript:</p>
                    <div className="whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                      {metadata.renderedBodyEn}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Footer: Signatures, Stamp & QR Verification */}
            <div className="mt-10 pt-6 border-t-2 border-slate-200">
              <div className="grid grid-cols-3 gap-4 items-end">
                {/* 1. Signatory Authority */}
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600">{document.signatoryTitle || 'المفوض بالتوقيع والاعتماد'}</p>
                  <p className="text-sm font-black text-indigo-950">{document.signatoryName || 'إدارة الموارد البشرية'}</p>
                  <div className="h-12 flex items-center justify-center">
                    <div className="font-serif italic text-lg font-black text-indigo-900 border-b-2 border-indigo-900 px-6 py-1">
                      {document.signatoryName || 'Deshal HR'}
                    </div>
                  </div>
                </div>

                {/* 2. Official Golden Seal / Stamp */}
                <div className="flex flex-col items-center justify-center">
                  {document.officialStampApplied && (
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-amber-600/80 bg-amber-50/40 flex flex-col items-center justify-center text-center p-2 transform rotate-[-6deg] shadow-xs">
                      <Award className="w-6 h-6 text-amber-700" />
                      <span className="text-[9px] font-black text-amber-900 leading-tight uppercase mt-0.5">
                        DESHAL ERP
                      </span>
                      <span className="text-[8px] font-extrabold text-amber-800">
                        OFFICIAL SEAL
                      </span>
                      <span className="text-[7px] font-mono text-amber-700">
                        VERIFIED
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Security Verification QR Code */}
                <div className="flex flex-col items-center text-center space-y-1">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Verification QR"
                      className="w-20 h-20 rounded-lg border border-slate-300 p-1 bg-white shadow-2xs"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400">
                      <QrCode className="w-8 h-8" />
                    </div>
                  )}
                  <p className="text-[9px] font-mono font-bold text-slate-500">
                    امسح للتحقق الرقمي
                  </p>
                  <p className="text-[8px] font-mono text-emerald-700 font-bold">
                    {document.verificationCode}
                  </p>
                </div>
              </div>

              {/* Bottom Micro Footer */}
              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{companyAddress} | هاتف: {companyPhone} | بريد: {companyEmail}</span>
                <span className="font-mono">تم التوليد بواسطة Deshal ERP Engine - سلطنة عمان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
