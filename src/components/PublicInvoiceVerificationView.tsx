import React, { useEffect, useState } from 'react';
import { verifyInvoiceOrVoucher } from '../lib/supabase/qrVerificationService';
import type { PublicInvoiceVerification } from '../types';
import { CheckCircle2, XCircle, ShieldCheck, FileText, Calendar, Building, DollarSign, Award, ArrowRight } from 'lucide-react';

interface PublicInvoiceVerificationViewProps {
  invoiceId: string;
  token: string;
  onBackToApp?: () => void;
}

export const PublicInvoiceVerificationView: React.FC<PublicInvoiceVerificationViewProps> = ({
  invoiceId,
  token,
  onBackToApp,
}) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PublicInvoiceVerification | null>(null);

  useEffect(() => {
    let isMounted = true;
    verifyInvoiceOrVoucher(invoiceId, token).then((res) => {
      if (isMounted) {
        setResult(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [invoiceId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-xl font-bold">جاري التحقق من الفاتورة...</h2>
        <p className="text-sm text-slate-400 mt-1">Verifying official document authenticity...</p>
      </div>
    );
  }

  const isValid = result?.valid;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl ${isValid ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />

        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="text-sm font-black tracking-wider uppercase text-white">ديشال - نظام التحقق المالي</span>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
            DESHAL VERIFY
          </span>
        </div>

        {/* Authenticity Badge */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center">
            {isValid ? (
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <h1 className={`text-xl font-black ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isValid ? 'مستند صحفي ومعتمد رسمياً' : 'مستند غير صالح أو غير معتمد'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isValid
                ? 'Official Verified Document Issued by Deshal ERP'
                : result?.message || 'Invalid or revoked verification token'}
            </p>
          </div>
        </div>

        {/* Verification Summary Card */}
        {isValid && (
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs relative z-10 font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                رقم المستند:
              </span>
              <span className="font-bold text-white text-sm">{result?.documentNumber}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-400" />
                الشركة المصدرة:
              </span>
              <span className="font-semibold text-slate-200">{result?.companyName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                تاريخ الإصدار:
              </span>
              <span className="font-medium text-slate-300">{result?.issueDate}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                حالة المستند:
              </span>
              <span className="font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                {result?.status === 'PAID' ? 'ملموع / مدفوع بالكامل' : 'صادر ومعتمد'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
              <span className="text-slate-300 font-sans font-bold flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                الإجمالي الكلي:
              </span>
              <span className="font-black text-amber-400 text-base">
                {result?.totalAmount} {result?.currency || 'OMR'}
              </span>
            </div>
          </div>
        )}

        {/* Security Assurance Disclaimer */}
        <div className="text-[11px] text-slate-500 text-center leading-relaxed pt-2 border-t border-slate-800/60">
          تم إنتاج رمز التشفير هذا وتوثيقه بواسطة منصة ديشال الرقمية. البيانات الحساسة محمية وتخضع لقوانين الأمان والاستخدام المعتمد.
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>العودة للنظام</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
