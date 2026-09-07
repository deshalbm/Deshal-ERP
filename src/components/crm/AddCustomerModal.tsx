import React, { useState, useEffect } from 'react';
import type { Customer, MasterLocation } from '../../types';
import { useLanguage } from '../../utils/LanguageContext';
import { generateUuid } from '../../utils/uuid';
import { getMasterLocations } from '../../lib/supabase/masterDataService';
import { upsertCustomer, checkPhoneExists, findCustomerByPhone, normalizePhone } from '../../lib/supabase/customerService';
import { User, Phone, Mail, Building, MapPin, X, CheckCircle2, AlertTriangle, Loader2, RefreshCw, Link as LinkIcon, Plus } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialName?: string;
  initialPhone?: string;
  onCustomerCreated: (customer: Customer) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  companyId,
  initialName = '',
  initialPhone = '',
  onCustomerCreated,
}) => {
  const { language, dir, isRTL } = useLanguage();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [taxId, setTaxId] = useState('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'CORPORATE'>('CORPORATE');

  const [masterLocations, setMasterLocations] = useState<MasterLocation[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Duplicate Phone Resolution Modal State
  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
    setDuplicateCustomer(null);
  }, [initialName, initialPhone]);

  useEffect(() => {
    if (isOpen) {
      getMasterLocations().then((locs) => {
        setMasterLocations(locs);
        if (locs.length > 0) {
          const defaultGov = locs[0].governorateAr;
          setGovernorate(defaultGov);
          const citiesForGov = locs.filter((l) => l.governorateAr === defaultGov).map((l) => l.cityAr);
          setAvailableCities(citiesForGov);
          if (citiesForGov.length > 0) setCity(citiesForGov[0]);
        }
      });
    }
  }, [isOpen]);

  const handleGovernorateChange = (gov: string) => {
    setGovernorate(gov);
    const citiesForGov = masterLocations.filter((l) => l.governorateAr === gov || l.governorateEn === gov).map((l) => l.cityAr);
    setAvailableCities(citiesForGov);
    if (citiesForGov.length > 0) setCity(citiesForGov[0]);
    else setCity('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال اسم العميل / الشركة' : 'Please enter customer name');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage(isRTL ? 'رقم الهاتف مطلوب كمفتاح إجباري للعميل' : 'Phone number is mandatory');
      return;
    }

    setIsSaving(true);
    const normalized = normalizePhone(phone);

    // Check duplicate phone
    const existing = await findCustomerByPhone(companyId, normalized);
    if (existing) {
      setIsSaving(false);
      setDuplicateCustomer(existing);
      return;
    }

    await saveCustomerRecord(false);
  };

  const saveCustomerRecord = async (allowDuplicatePhone: boolean, customNotes?: string, targetCustomerId?: string) => {
    setIsSaving(true);
    const normalized = normalizePhone(phone);
    const now = new Date().toISOString();

    const customerPayload: Customer = {
      id: targetCustomerId || generateUuid(),
      name: name.trim(),
      contactPerson: companyName.trim() || name.trim(),
      phone: phone.trim(),
      normalizedPhone: normalized,
      email: email.trim(),
      address: address.trim(),
      city: city || 'صحار',
      governorate: governorate || 'شمال الباطنة',
      country: 'سلطنة عمان',
      taxId: taxId.trim(),
      type: customerType,
      status: 'ACTIVE',
      tags: ['منشأ من محرّر السندات'],
      notes: customNotes || `تم الإضافة من نموذج السندات بتاريخ ${new Date().toLocaleDateString('ar-OM')}`,
      createdAt: now,
      updatedAt: now,
    };

    const res = await upsertCustomer(customerPayload, companyId, allowDuplicatePhone);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || (isRTL ? 'فشل حفظ العميل في قاعدة البيانات' : 'Failed to save customer'));
      return;
    }

    onCustomerCreated(res.data || customerPayload);
    onClose();
  };

  // Distinct Governorates
  const governorates = Array.from(new Set(masterLocations.map((l) => l.governorateAr)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn" dir={dir}>
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Duplicate Phone Decision Modal Step */}
        {duplicateCustomer ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  {isRTL ? "تنبيه: رقم الهاتف موجود مسبقاً في قاعدة البيانات!" : "Duplicate Phone Alert!"}
                </h3>
                <p className="text-xs text-amber-900 mt-0.5 font-medium">
                  {isRTL
                    ? `رقم الهاتف (${phone}) ارتبط مسبقاً بالعميل (${duplicateCustomer.name}).`
                    : `Phone (${phone}) is already registered for client (${duplicateCustomer.name}).`}
                </p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-700">
              {isRTL ? "يرجى تحديد الإجراء المحاسبي والإداري المطلوب:" : "Select required business action:"}
            </p>

            <div className="space-y-3 text-xs font-sans">
              {/* Option 1: Update Existing Customer */}
              <button
                type="button"
                onClick={() => saveCustomerRecord(true, `تم تحديث اسم العميل من ${duplicateCustomer.name} إلى ${name}`, duplicateCustomer.id)}
                className="w-full text-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-900 group-hover:text-indigo-900">
                    {isRTL ? "1. تحديث اسم وبيانات العميل السابق" : "1. Update Existing Customer"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isRTL
                      ? `تحديث سجل العميل (${duplicateCustomer.name}) إلى الاسم الجديد (${name}) مع الإبقاء على كافة الفواتير والسجلات.`
                      : `Update existing record name to (${name}) keeping historical ledgers.`}
                  </div>
                </div>
              </button>

              {/* Option 2: Link as Branch / Affiliate */}
              <button
                type="button"
                onClick={() => saveCustomerRecord(true, `مؤسسة/فرع مرتبط بالعميل الرئيسي: ${duplicateCustomer.name}`)}
                className="w-full text-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-900 group-hover:text-emerald-900">
                    {isRTL ? "2. ربط كشركة/مؤسسة تابعة أو فرع للعميل السابق" : "2. Link as Branch/Affiliate"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isRTL
                      ? `إضافة (${name}) ككيان مرتبط بنفس رقم الهاتف مع العميل (${duplicateCustomer.name}).`
                      : `Create (${name}) as affiliate entity linked to primary client (${duplicateCustomer.name}).`}
                  </div>
                </div>
              </button>

              {/* Option 3: Add as Independent Duplicate Customer */}
              <button
                type="button"
                onClick={() => saveCustomerRecord(true)}
                className="w-full text-start p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-slate-900 group-hover:text-purple-900">
                    {isRTL ? "3. متابعة الإضافة كعميل جديد مكرر رقم الهاتف" : "3. Add as Independent New Customer"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isRTL
                      ? `إنشاء سجل عميل جديد يسمى (${name}) بشرائح رقم الهاتف المكررة بدون تعديل السجل القديم.`
                      : `Add new independent record (${name}) sharing duplicate phone number.`}
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDuplicateCustomer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {isRTL ? "الرجوع والتعديل" : "Back & Edit"}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Customer Form */
          <>
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {isRTL ? '+ إضافة عميل جديد' : '+ Add New Customer'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {isRTL ? 'حفظ العميل مباشرة في قاعدة البيانات بدون مغادرة النموذج' : 'Save customer directly into DB without leaving form'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} type="button" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-bold">{errorMessage}</div>
                </div>
              )}

              {/* Type Toggle */}
              <div className="flex items-center gap-3">
                <label className="font-bold text-slate-700">{isRTL ? 'نوع العميل:' : 'Customer Type:'}</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerType('CORPORATE')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      customerType === 'CORPORATE' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isRTL ? 'شركة / مؤسسة' : 'Corporate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('INDIVIDUAL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      customerType === 'INDIVIDUAL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isRTL ? 'فرد / شخص' : 'Individual'}
                  </button>
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRTL ? 'اسم العميل / الشركة' : 'Client / Company Name'} <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isRTL ? 'مثال: شركة الحلول الرقمية ش.م.م' : 'e.g. Digital Solutions LLC'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRTL ? 'رقم الهاتف (إجباري)' : 'Phone Number (Mandatory)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+968 9123 4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isRTL ? 'رقم الهاتف إجباري. يُسمح بتكرار الأرقام مع التنبيه والربط.' : 'Mandatory phone number. Duplicate allowed with options.'}
                  </p>
                </div>
              </div>

              {/* Email & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@client.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRTL ? 'الرقم الضريبي / السجل التجاري' : 'VAT / Tax ID'}</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="OM-109283-B"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Location Master Dropdowns: Governorate & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRTL ? 'المحافظة' : 'Governorate'}</label>
                  <select
                    value={governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isRTL ? 'المدينة / الولاية' : 'City / Wilayat'}</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isRTL ? 'العنوان التفصيلي' : 'Street Address'}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isRTL ? 'المبنى، رقم الشارع، المنطقة' : 'Building, Street, District'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isRTL ? 'حفظ وااختيار العميل' : 'Save & Select Customer'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
