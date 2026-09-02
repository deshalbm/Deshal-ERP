import React, { useState } from "react";
import { ReceiptVoucher, CompanySettings, DesignTheme } from "../types";
import { formatDateToDDMMMMYYYY } from "../utils/dateFormatter";
import { ReceiptPreview } from "./ReceiptPreview";
import { WhatsAppShareModal } from "./WhatsAppShareModal";
import { captureElementToPdf, captureElementToCanvas } from "../utils/pdfGenerator";
import { useLanguage } from "../utils/LanguageContext";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Printer,
  FileDown,
  Edit,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  Archive,
  Layers,
  Loader2,
  X,
  MessageSquare,
  Barcode
} from "lucide-react";

interface VoucherHistoryProps {
  vouchers: ReceiptVoucher[];
  settings?: CompanySettings;
  theme?: DesignTheme;
  onSelectVoucher: (v: ReceiptVoucher) => void;
  onDeleteVoucher: (id: string) => void;
  onDeleteMultipleVouchers?: (ids: string[]) => void;
  onDuplicateVoucher: (v: ReceiptVoucher) => void;
  onNewVoucher: () => void;
  onPrintVoucher: (v: ReceiptVoucher) => void;
  onExportPdfVoucher: (v: ReceiptVoucher) => void;
}

export const VoucherHistory: React.FC<VoucherHistoryProps> = ({
  vouchers,
  settings,
  theme,
  onSelectVoucher,
  onDeleteVoucher,
  onDeleteMultipleVouchers,
  onDuplicateVoucher,
  onNewVoucher,
  onPrintVoucher,
  onExportPdfVoucher
}) => {
  const { t, dir, isRTL, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [whatsAppVoucher, setWhatsAppVoucher] = useState<ReceiptVoucher | null>(null);
  
  // Bulk generation state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, status: "" });
  const [renderVoucher, setRenderVoucher] = useState<ReceiptVoucher | null>(null);

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.receivedFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.paidTo && v.paidTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.referenceNo && v.referenceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.payerPhone && v.payerPhone.includes(searchQuery)) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "ALL" || v.type === filterType;
    const matchesStatus = filterStatus === "ALL" || v.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const allFilteredSelected =
    filteredVouchers.length > 0 &&
    filteredVouchers.every((v) => selectedIds.includes(v.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVouchers.map((v) => v.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Financial KPI Summary
  const totalReceived = vouchers
    .filter((v) => v.type === "RECEIPT" || v.type === "TAX_INVOICE")
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const totalPaidOut = vouchers
    .filter((v) => v.type === "PAYMENT" || v.type === "PETTY_CASH")
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const totalCount = vouchers.length;

  const selectedVouchersList = vouchers.filter((v) => selectedIds.includes(v.id));

  // Helper to capture a single voucher element to canvas and PDF array buffer
  const captureVoucherToPdfBuffer = async (
    element: HTMLElement,
    vNumber: string
  ): Promise<{ filename: string; pdf: jsPDF; buffer: ArrayBuffer } | null> => {
    try {
      const pdf = await captureElementToPdf(element, theme?.pageSize || 'A4');
      if (!pdf) return null;
      const buffer = pdf.output("arraybuffer");
      return { filename: `Voucher_${vNumber}.pdf`, pdf, buffer };
    } catch (err) {
      console.error("Failed to render voucher for bulk export:", err);
      return null;
    }
  };

  // Bulk ZIP Download
  const handleBulkDownloadZip = async () => {
    if (selectedVouchersList.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedVouchersList.length, status: "Initializing ZIP..." });

    const zip = new JSZip();

    for (let i = 0; i < selectedVouchersList.length; i++) {
      const voucher = selectedVouchersList[i];
      setExportProgress({
        current: i + 1,
        total: selectedVouchersList.length,
        status: `Generating PDF for Voucher #${voucher.voucherNumber} (${i + 1}/${selectedVouchersList.length})...`
      });

      setRenderVoucher(voucher);
      await new Promise((r) => setTimeout(r, 200));

      const renderEl = document.getElementById("bulk-export-render-node");
      if (renderEl) {
        const res = await captureVoucherToPdfBuffer(renderEl, voucher.voucherNumber);
        if (res) {
          zip.file(res.filename, res.buffer);
        }
      }
    }

    setExportProgress({ current: selectedVouchersList.length, total: selectedVouchersList.length, status: "Compressing ZIP archive..." });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `Vouchers_Batch_${new Date().toISOString().slice(0, 10)}.zip`);

    setIsExporting(false);
    setRenderVoucher(null);
  };

  // Bulk Merged PDF Download
  const handleBulkDownloadMergedPdf = async () => {
    if (selectedVouchersList.length === 0) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedVouchersList.length, status: "Initializing Combined Document..." });

    let masterPdf: jsPDF | null = null;

    for (let i = 0; i < selectedVouchersList.length; i++) {
      const voucher = selectedVouchersList[i];
      setExportProgress({
        current: i + 1,
        total: selectedVouchersList.length,
        status: `Merging Voucher #${voucher.voucherNumber} (${i + 1}/${selectedVouchersList.length})...`
      });

      setRenderVoucher(voucher);
      await new Promise((r) => setTimeout(r, 200));

      const renderEl = document.getElementById("bulk-export-render-node");
      if (renderEl) {
        const canvas = await captureElementToCanvas(renderEl);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (!masterPdf) {
          const resPdf = await captureElementToPdf(renderEl, theme?.pageSize || 'A4');
          if (resPdf) {
            masterPdf = resPdf;
          }
        } else {
          masterPdf.addPage();
          const pdfWidth = masterPdf.internal.pageSize.getWidth();
          const pdfHeight = masterPdf.internal.pageSize.getHeight();

          let finalWidth = pdfWidth;
          let finalHeight = (canvas.height * pdfWidth) / canvas.width;
          if (finalHeight > pdfHeight) {
            const scale = pdfHeight / finalHeight;
            finalHeight = pdfHeight;
            finalWidth = pdfWidth * scale;
          }
          const xOffset = (pdfWidth - finalWidth) / 2;
          masterPdf.addImage(imgData, "JPEG", xOffset, 0, finalWidth, finalHeight);
        }
      }
    }

    if (masterPdf) {
      masterPdf.save(`Selected_Vouchers_Combined_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    setIsExporting(false);
    setRenderVoucher(null);
  };

  // Bulk Print
  const handleBulkPrint = () => {
    if (selectedVouchersList.length === 0) return;
    if (selectedVouchersList.length === 1) {
      onPrintVoucher(selectedVouchersList[0]);
    } else {
      window.print();
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedVouchersList.length === 0) return;
    if (confirm(t("deleteSelectedConfirm", { count: selectedVouchersList.length }))) {
      if (onDeleteMultipleVouchers) {
        onDeleteMultipleVouchers(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteVoucher(id));
      }
      setSelectedIds([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative" dir={dir}>
      
      {/* Off-screen rendering area for generating PDFs */}
      {renderVoucher && settings && theme && (
        <div className="fixed top-0 left-[-9999px] w-[794px] bg-white p-8 pointer-events-none z-[-50]">
          <div id="bulk-export-render-node">
            <ReceiptPreview voucher={renderVoucher} settings={settings} theme={theme} onPrint={() => {}} onExportPdf={() => {}} />
          </div>
        </div>
      )}

      {/* Bulk Export Progress Modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t("generatingBatch")}</h3>
              <p className="text-xs text-slate-500 mt-1">{exportProgress.status}</p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                style={{
                  width: `${(exportProgress.current / Math.max(exportProgress.total, 1)) * 100}%`
                }}
              />
            </div>
            <p className="text-[11px] font-mono text-slate-400 font-bold">
              {exportProgress.current} / {exportProgress.total} {t("completed")}
            </p>
          </div>
        </div>
      )}

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {t("totalInflow")}
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
              {totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {t("totalOutflow")}
            </span>
            <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
              {totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              {t("totalRecordsLogged")}
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {totalCount} {t("vouchersCount")}
            </span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Sticky Bulk Action Control Bar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200 border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg">
              {selectedIds.length} {t("selected")}
            </span>
            <p className="text-xs text-slate-300 font-medium hidden sm:block">
              {t("bulkActionHint")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>{t("downloadZip")}</span>
            </button>

            <button
              onClick={handleBulkDownloadMergedPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{t("mergedPdf")}</span>
            </button>

            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-xl cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t("printSelected")}</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t("deleteSelected")} ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer ml-1"
              title={t("deselectAll")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={`w-full ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50"
          >
            <option value="ALL">{t("allTypes")}</option>
            <option value="RECEIPT">{t("receiptVoucher")}</option>
            <option value="PAYMENT">{t("paymentVoucher")}</option>
            <option value="PETTY_CASH">{t("pettyCashVoucher")}</option>
            <option value="TAX_INVOICE">{t("taxInvoiceVoucher")}</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50"
          >
            <option value="ALL">{t("allStatuses")}</option>
            <option value="PAID">{t("paid")}</option>
            <option value="ISSUED">{t("issued")}</option>
            <option value="DRAFT">{t("draft")}</option>
            <option value="CANCELLED">{t("cancelled")}</option>
          </select>

          <button
            onClick={onNewVoucher}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-md cursor-pointer ms-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t("createNew")}</span>
          </button>
        </div>

      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                    title={allFilteredSelected ? t("deselectAll") : t("selectAll")}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5 text-start">{t("voucherNumber")}</th>
                <th className="p-3.5 text-start">{t("type")}</th>
                <th className="p-3.5 text-start">{t("date")}</th>
                <th className="p-3.5 text-start">{t("receivedFrom")} / {t("paidTo")}</th>
                <th className="p-3.5 text-start">{t("paymentMethod")}</th>
                <th className="p-3.5 text-end">{t("totalAmount")}</th>
                <th className="p-3.5 text-center">{t("status")}</th>
                <th className="p-3.5 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">{t("noVouchersFound")}</p>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const isSelected = selectedIds.includes(v.id);
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 transition-all font-medium ${
                        isSelected ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => toggleSelectOne(v.id)}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-indigo-700">
                        {v.voucherNumber}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          v.type === "RECEIPT"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.type === "PAYMENT"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {v.type === "RECEIPT" ? t("receiptVoucher") : v.type === "PAYMENT" ? t("paymentVoucher") : v.type}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-600 font-mono text-xs">
                        {formatDateToDDMMMMYYYY(v.date)}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-900">
                        {v.receivedFrom || v.paidTo || "---"}
                      </td>

                      <td className="p-3.5 text-slate-600 uppercase font-sans">
                        {v.paymentMethod.replace("_", " ")}
                      </td>

                      <td className="p-3.5 text-end font-mono font-black text-slate-900">
                        {v.currency} {v.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                          v.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : v.status === "ISSUED"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {v.status === "PAID" ? t("paid") : v.status === "ISSUED" ? t("issued") : v.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* WhatsApp Direct Share */}
                          <button
                            onClick={() => setWhatsAppVoucher(v)}
                            title={language === "ar" ? "إرسال عبر WhatsApp" : "Send WhatsApp Alert"}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectVoucher(v)}
                            title={t("edit")}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onPrintVoucher(v)}
                            title={t("print")}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onExportPdfVoucher(v)}
                            title={t("exportPdf")}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateVoucher(v)}
                            title={t("duplicate")}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteVoucher(v.id)}
                            title={t("delete")}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Direct Share Modal */}
      {whatsAppVoucher && (
        <WhatsAppShareModal
          isOpen={!!whatsAppVoucher}
          onClose={() => setWhatsAppVoucher(null)}
          voucher={whatsAppVoucher}
          settings={settings || {
            companyName: "ديشال لإدارة الأعمال (Deshal ERP)",
            phone: "+968 77438203",
            defaultCurrency: "OMR",
            bankDetails: {
              bankName: "بنك ظفار",
              accountName: "ديشال لإدارة الأعمال",
              accountNumber: "01041112233001",
              iban: "OM960111000000001041112233001"
            }
          } as any}
        />
      )}

    </div>
  );
};
