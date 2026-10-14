import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Clock,
  ShieldCheck,
  ExternalLink,
  Link2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  Tag,
  Zap,
  Save,
  School,
} from 'lucide-react';
import { useToast } from './ui/Toast';
import MinistryLogo from './MinistryLogo';
import { useSchoolSettings } from '../lib/schoolSettings';

export const PERMANENT_PRODUCTION_URL = 'https://school-msader.netlify.app/#book';

export default function QRCodePoster() {
  const { settings, saveSettings, isSaving } = useSchoolSettings();

  const getInitialBookingUrl = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qr_custom_booking_url');
      if (stored) return stored;
      if (window.location.origin && window.location.origin.includes('netlify.app')) {
        return `${window.location.origin}/#book`;
      }
    }
    return PERMANENT_PRODUCTION_URL;
  };

  const [bookingUrl, setBookingUrl] = useState<string>(getInitialBookingUrl);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>(() => settings.schoolName);
  const [roomTitle, setRoomTitle] = useState<string>(() => settings.roomTitle);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const { toast } = useToast();

  // Sync with remote/stored settings when loaded
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setSchoolName(settings.schoolName);
      setRoomTitle(settings.roomTitle);
    }
  }, [settings.schoolName, settings.roomTitle, hasUnsavedChanges]);

  const handleSaveSchoolInfo = async () => {
    if (!schoolName.trim()) {
      toast({
        title: 'يرجى كتابة اسم المدرسة',
        description: 'لا يمكن ترك حقل اسم المدرسة فارغاً.',
        variant: 'destructive',
      });
      return;
    }

    const ok = await saveSettings({
      schoolName: schoolName.trim(),
      roomTitle: roomTitle.trim() || 'غرفة مصادر التعلم والابتكار الرقمي',
    });

    if (typeof window !== 'undefined' && bookingUrl) {
      localStorage.setItem('qr_custom_booking_url', bookingUrl.trim());
    }

    if (ok) {
      setHasUnsavedChanges(false);
      toast({
        title: 'تم حفظ وتثبيت بيانات اللافتة والباركود بنجاح!',
        description: `الباركود مبرمج الآن ليفتح رابط: ${bookingUrl.trim()}`,
        variant: 'success',
      });
    } else {
      toast({
        title: 'تعذر الحفظ',
        description: 'حدث خطأ في الاتصال بالخادم، تم الحفظ محلياً.',
        variant: 'destructive',
      });
    }
  };

  // توليد الباركود بدقة عالية
  useEffect(() => {
    if (!bookingUrl) return;

    QRCode.toDataURL(bookingUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error('Error generating QR:', err));
  }, [bookingUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast({
        title: 'تم نسخ الرابط بنجاح',
        description: `تم نسخ: ${bookingUrl}`,
        variant: 'success',
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Top Action Bar */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-600" />
            <span>لافتة باركود باب غرفة المصادر (جاهزة للطباعة للمعلمين)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            اطبع هذه اللوحة وعلّقها على مدخل القاعة ليتمكن المعلمون والمعلمات من مسح الرمز وحجز الحصص مباشرة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="تجربة فتح الرابط في نافذة جديدة"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح الرابط</span>
          </a>

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="نسخ الرابط"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة اللافتة (A4)</span>
          </button>
        </div>
      </div>

      {/* Customizable School Info with Save Functionality */}
      <div className="no-print bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="font-black text-slate-800 text-xs sm:text-sm">
              تخصيص اسم المدرسة والقاعة للافتة والجدول الأسبوعي
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveSchoolInfo}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="حفظ اسم المدرسة والقاعة واعتماده في النظام"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{hasUnsavedChanges ? '💾 حفظ التعديلات' : '💾 حفظ اسم المدرسة'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم المدرسة / الصرح التعليمي:</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="مثال: ثانوية الملك عبدالله بن عبدالعزيز"
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:outline-emerald-600 font-semibold text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">عنوان القاعة / المركز:</label>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => {
                setRoomTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="مثال: غرفة مصادر التعلم والابتكار الرقمي"
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:outline-emerald-600 font-semibold text-xs"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80">
          <label className="block font-bold text-slate-700 mb-1">الرابط المضمّن في الباركود (الذي يفتحه المعلم عند المسح):</label>
          <input
            type="text"
            value={bookingUrl}
            onChange={(e) => setBookingUrl(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-emerald-800 font-mono text-xs focus:outline-emerald-600"
            dir="ltr"
          />
        </div>

        {hasUnsavedChanges ? (
          <p className="text-[11px] text-amber-600 font-bold">
            ⚠️ لديك تعديلات غير محفوظة. اضغط على «حفظ التعديلات» لاعتمادها دائماً.
          </p>
        ) : (
          <p className="text-[11px] text-emerald-700 font-medium">
            ✓ اسم المدرسة محفوظ في النظام ويظهر تلقائياً في اللافتة المطبوعة والجدول الأسبوعي.
          </p>
        )}
      </div>

      {/* The Printable Door Poster Container */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border-4 border-emerald-700/80 relative overflow-hidden print:p-6 print:border-4 print:shadow-none print:w-full">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

        {/* Top Header of the Poster */}
        <div className="text-center pb-6 border-b-2 border-emerald-100 relative">
          <div className="flex items-center justify-between mb-4">
            <MinistryLogo variant="dark" className="h-10 w-auto" />
            <div className="text-left font-bold text-emerald-900 text-xs">
              <div>{schoolName}</div>
              <div className="text-[10px] text-slate-500 font-medium">مركز مصادر التعلم المعتمد</div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {roomTitle}
          </h1>
          <p className="text-emerald-700 font-bold text-base sm:text-lg mt-1">
            نظام الحجز الذاتي لغرفة المصادر والأجهزة التفاعلية للمعلمين
          </p>
        </div>

        {/* Main QR Section */}
        <div className="my-8 flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-inner flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="باركود الحجز"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                  جاري توليد الباركود...
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>امسح الكاميرا هنا بحساب المعلم لحجز حصتك بالقاعة فوراً</span>
            </div>

            {/* Clean Short Address printed on poster */}
            <div className="mt-3 text-xs text-emerald-950 font-bold flex items-center gap-1.5">
              <span>رابط حجز المعلمين المباشر:</span>
              <span className="font-mono text-emerald-700 font-bold" dir="ltr">
                {bookingUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Steps for Teachers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 text-right">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">امسح الباركود</h4>
              <p className="text-xs text-slate-500 mt-1">افتح كاميرا الجوال ووجّهها نحو الباركود لفتح صفحة الحجز فوراً.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">سجّل بحساب المعلم</h4>
              <p className="text-xs text-slate-500 mt-1">سجّل دخولك بحساب Google أو منصة مدرستي ليظهر اسمك وتخصصك.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">احجز الحصة المتاحة</h4>
              <p className="text-xs text-slate-500 mt-1">اختر الحصة والقسم التعليمي والغرض واستلم تذكرة الحجز المعتمدة.</p>
            </div>
          </div>
        </div>

        {/* Room Rules & Footer */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>نرجو الالتزام بالهدوء التام والمحافظة على مقتنيات وتجهيزات القاعة.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>متاح طوال ساعات الدوام المدرسي الرسمي</span>
          </div>
        </div>
      </div>
    </div>
  );
}
