/**
 * Enterprise Platform Audit Log View Component — Deshal ERP
 * 
 * Clean Architecture Presentation Component:
 * Displays platform administration audit events, tenant provisioning job execution history,
 * idempotency keys, failure trace logs, and permits job retries.
 */

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter
} from 'lucide-react';
import { TenantProvisioningJob } from '../../domain/tenant/tenantEntities';
import { retryFailedProvisioningUseCase } from '../../application/services/tenantProvisioningEngine';
import { SupabaseTenantProvisioningAdapter } from '../../lib/adapters/tenantProvisioningAdapter';
import { useAuth } from '../../contexts/AuthContext';

const adapter = new SupabaseTenantProvisioningAdapter();

export interface PlatformAuditLogViewProps {
  jobs?: TenantProvisioningJob[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const PlatformAuditLogView: React.FC<PlatformAuditLogViewProps> = ({
  jobs = [],
  loading = false,
  onRefresh
}) => {
  const auth = useAuth();
  const userId = auth.state.supabaseAuthUser?.id || auth.state.authSession?.user?.id || '';

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredJobs = jobs.filter(j => {
    const matchesStatus = filterStatus === 'ALL' || j.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      j.id.toLowerCase().includes(searchLower) ||
      j.idempotencyKey.toLowerCase().includes(searchLower) ||
      (j.tenantId && j.tenantId.toLowerCase().includes(searchLower)) ||
      (j.companyId && j.companyId.toLowerCase().includes(searchLower)) ||
      (j.errorMessage && j.errorMessage.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    setMsg(null);
    try {
      const res = await retryFailedProvisioningUseCase(jobId, userId, adapter);
      if (res.success) {
        setMsg({ type: 'success', text: `تمت أعادة تنفيذ أمر التهيئة بنجاح للمهمة: ${jobId}` });
        if (onRefresh) onRefresh();
      } else {
        setMsg({ type: 'error', text: res.error || 'فشلت أعادة تنفيذ المهمة.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء إعادة المحاولة.' });
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">سجل عمليات التهيئة بالمنصة (Provisioning History)</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {filteredJobs.length} سجل
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالمفتاح أو المعرّف..."
              className="w-48 rounded-lg border border-slate-200 py-1.5 pe-3 ps-8 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="COMPLETED">مكتملة (COMPLETED)</option>
            <option value="FAILED">فاشلة (FAILED)</option>
            <option value="IN_PROGRESS">قيد التنفيذ (IN_PROGRESS)</option>
            <option value="PENDING">معلقة (PENDING)</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Alert Message */}
      {msg && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
            msg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Jobs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">معرّف المهمة</th>
              <th className="px-4 py-3">مفتاح Idempotency</th>
              <th className="px-4 py-3">معرّف المستأجر / الشركة</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الخطوة الفاشلة / الخطأ</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
                  <span>جاري تحميل سجلات عمليات التهيئة...</span>
                </td>
              </tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  لا تتوفر سجلات عمليات تهيئة مطابقة.
                </td>
              </tr>
            ) : (
              filteredJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">{job.id}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 max-w-[150px] truncate">{job.idempotencyKey}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {job.tenantId || job.companyId || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : job.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {job.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                      {job.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                      {job.status === 'IN_PROGRESS' && <Clock className="h-3 w-3" />}
                      <span>{job.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {job.failedStep && (
                      <span className="block font-semibold text-red-600 text-[11px]">
                        خطوة: {job.failedStep}
                      </span>
                    )}
                    {job.errorMessage ? (
                      <span className="block truncate text-[11px] text-red-500" title={job.errorMessage}>
                        {job.errorMessage}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {new Date(job.createdAt).toLocaleString('ar-OM')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingJobId === job.id}
                        className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <RotateCcw className={`h-3 w-3 ${retryingJobId === job.id ? 'animate-spin' : ''}`} />
                        <span>إعادة المحاولة</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
