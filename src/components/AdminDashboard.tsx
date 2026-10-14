import React, { useState, useEffect, useMemo } from 'react';
import {
  Booking,
  BookingStatus,
  SchoolDayInfo,
} from '../types/booking';
import {
  getStoredBookings,
  fetchBookingsFromServer,
  updateBookingStatusAsync,
  resetToSeedAsync,
  saveBookingAsync,
  getTodayDateString,
  formatArabicDate,
  getCloudSyncStatus,
  CloudSyncStatus,
} from '../lib/storage';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
  Filter,
  UserCheck,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Check,
  Printer,
  LayoutGrid,
  Trophy,
  Star,
  Copy,
  ExternalLink,
  Link2,
  Globe,
  CloudUpload,
} from 'lucide-react';
import { useToast } from './ui/Toast';
import BookingTicketModal from './BookingTicketModal';
import DeployGuideModal from './DeployGuideModal';
import SupervisorWeeklySchedule from './SupervisorWeeklySchedule';
import TeacherMedalsShowcase from './TeacherMedalsShowcase';
import MinistryLogo from './MinistryLogo';
import {
  getMedalTierForCount,
  getMedalDetails,
  computeWeeklyTeacherMedals,
  TeacherMedalInfo,
  MedalTier,
} from '../lib/medalsUtils';
import { getSchoolWeekDays, getTodayIsoDate } from '../lib/dateUtils';

interface AdminDashboardProps {
  onRefreshData?: () => void;
}

export default function AdminDashboard({ onRefreshData }: AdminDashboardProps) {
  const { toast } = useToast();
  const todayStr = getTodayDateString();

  const [bookings, setBookings] = useState<Booking[]>(() => getStoredBookings());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sub-tabs for Supervisor: 'schedule' (printable weekly table) | 'medals' (weekly honors) | 'records' (detailed management table)
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'medals' | 'records'>('schedule');

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' | 'today' | 'custom'
  const [customDate, setCustomDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewTicketBooking, setViewTicketBooking] = useState<Booking | null>(null);
  const [isAddingTestBooking, setIsAddingTestBooking] = useState<boolean>(false);

  const baseDomain =
    typeof window !== 'undefined' && window.location.origin && window.location.origin.includes('netlify.app')
      ? window.location.origin
      : 'https://school-msader.netlify.app';

  const teacherBookingUrl = `${baseDomain}/#book`;
  const supervisorDirectUrl = `${baseDomain}/?role=supervisor#admin`;

  const [copiedTeacher, setCopiedTeacher] = useState<boolean>(false);
  const [copiedSupervisor, setCopiedSupervisor] = useState<boolean>(false);
  const [showDeployGuide, setShowDeployGuide] = useState<boolean>(false);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleBlobDownload = async (url: string, filename: string) => {
    setIsDownloading(true);
    toast({
      title: 'جاري تحميل الملف...',
      description: 'يرجى الانتظار بينما يتم تجهيز الملف للتحميل.',
      variant: 'info',
    });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل تحميل الملف');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({
        title: 'تم التحميل بنجاح!',
        description: `تم تنزيل ملف ${filename} إلى جهازك.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'حدث خطأ أثناء التحميل',
        description: 'يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyTeacherLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(teacherBookingUrl);
    }
    setCopiedTeacher(true);
    setTimeout(() => setCopiedTeacher(false), 2000);
    toast({
      title: 'تم نسخ رابط المعلمات المباشر!',
      description: 'تم نسخ الرابط العام المباشر لحجز المعلمات بدون تسجيل دخول.',
      variant: 'success',
    });
  };

  const handleCopySupervisorLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(supervisorDirectUrl);
    }
    setCopiedSupervisor(true);
    setTimeout(() => setCopiedSupervisor(false), 2000);
    toast({
      title: 'تم نسخ رابط المشرفة المباشر!',
      description: 'هذا الرابط يدخلك مباشرة للوحة التحكم والجدول الأسبوعي دون الحاجة لرمز سري.',
      variant: 'success',
    });
  };

  // Load and poll bookings from server API
  const refreshList = async () => {
    setIsLoading(true);
    try {
      const fresh = await fetchBookingsFromServer();
      if (Array.isArray(fresh)) {
        setBookings(fresh);
      }
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.warn('Refresh error:', e);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => getCloudSyncStatus());

  useEffect(() => {
    refreshList();

    // Auto-poll every 3 seconds for live cross-device sync
    const interval = setInterval(async () => {
      try {
        const fresh = await fetchBookingsFromServer();
        if (Array.isArray(fresh)) setBookings(fresh);
      } catch {
        setBookings([]);
      }
    }, 3000);

    const handleUpdate = () => {
      setBookings(getStoredBookings());
    };
    const handleCloudStatus = (e: any) => {
      if (e.detail) setCloudStatus(e.detail);
    };

    window.addEventListener('bookings-updated', handleUpdate);
    window.addEventListener('cloud-status-updated', handleCloudStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bookings-updated', handleUpdate);
      window.removeEventListener('cloud-status-updated', handleCloudStatus);
    };
  }, []);

  const handleStatusChange = async (id: string | number, newStatus: BookingStatus) => {
    try {
      await updateBookingStatusAsync(id, newStatus);
      await refreshList();
      toast({
        title: 'تم تحديث حالة الحجز',
        description: `تم تغيير الحالة إلى: ${
          newStatus === 'attended'
            ? 'تم الحضور في القاعة'
            : newStatus === 'cancelled'
            ? 'ملغي'
            : newStatus === 'absent'
            ? 'تغيب عن الحضور'
            : 'مؤكد'
        }`,
        variant: 'success',
      });
    } catch {
      toast({ title: 'تعذر تحديث الحجز', description: 'تحقق من اتصال الخادم ثم أعد المحاولة.', variant: 'destructive' });
    }
  };



  const handleResetData = async () => {
    try {
      await resetToSeedAsync();
      await refreshList();
      toast({
        title: 'تمت استعادة السجلات الافتراضية',
        description: 'تمت استعادة البيانات التجريبية بنجاح.',
        variant: 'info',
      });
    } catch {
      toast({ title: 'تعذر مسح الحجوزات', description: 'تحقق من اتصال الخادم ثم أعد المحاولة.', variant: 'destructive' });
    }
  };

  // Quick action: Add test booking to verify cross-device sync
  const handleAddTestBooking = async () => {
    setIsAddingTestBooking(true);
    try {
      const testNames = [
        'أ. سارة محمد المنصور',
        'أ. فاطمة خالد القحطاني',
        'أ. نورة سعد الحربي',
        'أ. منيرة إبراهيم الشمري',
      ];
      const randomName = testNames[Math.floor(Math.random() * testNames.length)];
      const randomSlot = 'الحصة الرابعة (10:30 - 11:15)';

      const created = await saveBookingAsync({
        studentName: randomName,
        studentEmail: 'teacher.sample@school.edu.sa',
        grade: 'قسم العلوم الطبيعية (كيمياء) • [الصف: ثاني متوسط]',
        date: todayStr,
        timeSlot: randomSlot,
        purpose: 'تنفيذ درس تطبيقي تفاعلي باستخدام الشاشة الذكية',
        notes: 'تم حجز القاعة وتجهيز أجهزة الحاسب والشاشة الذكية',
      });

      refreshList();
      toast({
        title: '🎉 تم إضافة حجز تجريبي للمعلمة',
        description: `تم تثبيت حجز باسم (${created.studentName}) في سجل المشرف والجدول الأسبوعي مباشرة!`,
        variant: 'success',
      });
    } catch (err) {
      console.error('Error adding test booking:', err);
    } finally {
      setIsAddingTestBooking(false);
    }
  };

  // CSV Export for school records
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      toast({
        title: 'لا توجد بيانات',
        description: 'لا توجد حجوزات لتصديرها حالياً.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['رقم الحجز', 'اسم المعلم/المعلمة', 'البريد/التواصل', 'التخصص/القسم', 'التاريخ', 'الحصة', 'الغرض', 'الحالة', 'وقت التسجيل'];
    const rows = bookings.map((b) => [
      `"${b.ticketNumber}"`,
      `"${b.studentName}"`,
      `"${b.studentEmail || '-'}"`,
      `"${b.grade || '-'}"`,
      `"${b.date}"`,
      `"${b.timeSlot}"`,
      `"${(b.purpose || '').replace(/"/g, '""')}"`,
      `"${b.status}"`,
      `"${b.createdAt}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `حجوزات_المعلمين_غرفة_المصادر_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'تم تصدير ملف الحجوزات',
      description: 'تم تنزيل ملف CSV بنجاح وهو متوافق مع Excel.',
      variant: 'success',
    });
  };

  // Filter logic for records list
  const filteredBookings = bookings.filter((b) => {
    if (selectedDateFilter === 'today' && b.date !== todayStr) return false;
    if (selectedDateFilter === 'custom' && b.date !== customDate) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = b.studentName.toLowerCase().includes(q);
      const matchTicket = b.ticketNumber.toLowerCase().includes(q);
      const matchSlot = b.timeSlot.toLowerCase().includes(q);
      const matchGrade = (b.grade || '').toLowerCase().includes(q);
      const matchPurpose = b.purpose.toLowerCase().includes(q);
      return matchName || matchTicket || matchSlot || matchGrade || matchPurpose;
    }

    return true;
  });

  // Metrics
  const todayTotal = bookings.filter((b) => b.date === todayStr).length;
  const attendedCount = bookings.filter((b) => b.status === 'attended').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  // School week dates for current week & teacher medals
  const currentWeekDays = useMemo(() => getSchoolWeekDays(getTodayIsoDate()), []);
  const currentWeekDatesSet = useMemo(() => new Set(currentWeekDays.map((d: SchoolDayInfo) => d.date)), [currentWeekDays]);
  const currentWeekBookings = useMemo(
    () => bookings.filter((b) => currentWeekDatesSet.has(b.date)),
    [bookings, currentWeekDatesSet]
  );
  const currentWeekMedals = useMemo(
    () => computeWeeklyTeacherMedals(currentWeekBookings),
    [currentWeekBookings]
  );

  const teacherMedalMap = useMemo(() => {
    const map: Record<string, { count: number; tier: MedalTier; details: ReturnType<typeof getMedalDetails> }> = {};
    for (const m of currentWeekMedals) {
      map[m.teacherName] = {
        count: m.count,
        tier: m.tier,
        details: getMedalDetails(m.tier),
      };
    }
    return map;
  }, [currentWeekMedals]);

  const totalMedalTeachers = currentWeekMedals.filter((m: TeacherMedalInfo) => m.tier !== null).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner with Real-time Server Sync status (Hidden during paper print) */}
      <div className="no-print bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                <MinistryLogo variant="light" className="h-10 w-auto" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              لوحة متابعة وإدارة مركز مصادر التعلم
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              خاصة بالمشرف وأمين المصادر: متابعة الحجوزات المسجلة من كافة الأجهزة، حفظ وطباعة الجدول الأسبوعي الرسمي A4، واعتماد الحضور.
            </p>

            {/* Cloud Database Live Sync Indicator */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <span className={`w-2 h-2 rounded-full ${cloudStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {cloudStatus.isConnected
                  ? 'الخادم المشترك متصل؛ الحجوزات تظهر على الأجهزة الأخرى'
                  : 'الخادم المشترك غير متصل؛ لن تُحفظ الحجوزات أو تظهر للأجهزة الأخرى'}
              </span>
              {cloudStatus.lastSyncTime && (
                <span className="text-emerald-200/80 text-[11px] font-medium">
                  آخر تحديث: {cloudStatus.lastSyncTime}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveSubTab('schedule');
                setTimeout(() => window.print(), 100);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
              title="طباعة الجدول الأسبوعي الرسمي فوراً"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الجدول الأسبوعي</span>
            </button>

            <button
              onClick={refreshList}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5 cursor-pointer border border-white/15"
              title="تحديث البيانات فوراً من الخادم"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث فوري</span>
            </button>

            <button
              onClick={handleAddTestBooking}
              disabled={isAddingTestBooking}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="إضافة حجز تجريبي للتأكد من ظهور البيانات في الجدول"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ تجربة حجز معلمة</span>
            </button>
          </div>
        </div>
      </div>

      {/* DIRECT SYSTEM LINKS FOR TEACHERS & SUPERVISOR */}
      <div className="no-print bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                الروابط الرسمية المباشرة المعتمدة
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تم اعتماد الروابط العامة المباشرة لتعمل فوراً على كافة الهواتف (آيفون، أندرويد) وأجهزة الحاسب بدون أي تحذيرات
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            روابط فعالة وجاهزة للمشاركة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* TEACHER BOOKING LINK */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5" />
                  رابط حجز المعلمات المباشر
                </span>
                <span className="text-[11px] font-bold text-emerald-700">عام (بدون تسجيل دخول)</span>
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                هذا الرابط المخصص لإرساله في مجموعات الواتساب أو تضمينه في الباركود. يفتح للمعلمة صفحة الحجز فوراً.
              </p>
              <div className="bg-white px-3 py-2 rounded-xl border border-emerald-200 font-mono text-xs text-slate-700 truncate select-all dir-ltr text-left">
                {teacherBookingUrl}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopyTeacherLink}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                {copiedTeacher ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTeacher ? 'تم النسخ بنجاح!' : 'نسخ رابط المعلمات'}</span>
              </button>
              <a
                href={teacherBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="فتح الرابط في نافذة جديدة للتجربة"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>فتح وتجربة</span>
              </a>
            </div>
          </div>

          {/* SUPERVISOR DIRECT LINK */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl p-4 border border-amber-200 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950 bg-amber-100 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  رابط المشرفة المباشر (لوحة التحكم والجدول)
                </span>
                <span className="text-[11px] font-bold text-amber-800">خاص بأمينة المصادر فقط</span>
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                رابط سريع ومحمي لأمينة المصادر، يدخلك مباشرة للوحة التحكم والجدول الأسبوعي والطباعة بدون الحاجة لإدخال رمز.
              </p>
              <div className="bg-white px-3 py-2 rounded-xl border border-amber-200 font-mono text-xs text-slate-700 truncate select-all dir-ltr text-left">
                {supervisorDirectUrl}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopySupervisorLink}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                {copiedSupervisor ? <Check className="w-4 h-4 text-emerald-800" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSupervisor ? 'تم النسخ بنجاح!' : 'نسخ رابط المشرفة'}</span>
              </button>
              <a
                href={supervisorDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="فتح لوحة المشرفة في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>فتح اللوحة</span>
              </a>
            </div>
          </div>
        </div>


      </div>

      {/* SUB-TABS: WEEKLY SCHEDULE | MEDALS BOARD | DETAILED RECORDS */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'schedule'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>الجدول الأسبوعي المعتمد (طباعة وحفظ)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('medals')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'medals'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>لوحة أوسمة وميداليات المعلمات</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black">
            {totalMedalTeachers}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('records')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'records'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-emerald-400" />
          <span>سجل الحجوزات وإدارة العمليات</span>
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 text-slate-900 font-bold">
            {bookings.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: SUPERVISOR WEEKLY SCHEDULE & PRINT REPORT */}
      {activeSubTab === 'schedule' && (
        <SupervisorWeeklySchedule
          bookings={bookings}
          onSelectBooking={(b) => setViewTicketBooking(b)}
        />
      )}

      {/* VIEW 2: TEACHER HONORS & MEDALS BOARD */}
      {activeSubTab === 'medals' && (
        <div className="space-y-6 animate-in fade-in">
          <TeacherMedalsShowcase
            weekBookings={currentWeekBookings}
            weekRangeText={`الأسبوع الحالي (${currentWeekDays[0]?.formatted} - ${currentWeekDays[4]?.formatted})`}
            onFilterTeacher={(teacher) => {
              setSearchQuery(teacher);
              setActiveSubTab('records');
            }}
          />
        </div>
      )}

      {/* VIEW 2: DETAILED RECORDS MANAGEMENT TABLE */}
      {activeSubTab === 'records' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">حجوزات المعلمين اليوم</p>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{todayTotal}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">إجمالي الحجوزات المسجلة</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{bookings.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">تم الحضور بالقاعة</p>
                <h3 className="text-2xl sm:text-3xl font-black text-teal-600 mt-1">{attendedCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">حجوزات مؤكدة (قادمة)</p>
                <h3 className="text-2xl sm:text-3xl font-black text-sky-600 mt-1">{confirmedCount}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Control Bar: Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المعلم/المعلمة، التخصص، الحصة، الغرض، أو رقم التذكرة..."
                  className="w-full h-11 pr-10 pl-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-200"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير Excel (CSV)</span>
                </button>

                <button
                  onClick={handleResetData}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold transition-colors cursor-pointer"
                  title="استعادة البيانات الافتراضية"
                >
                  إعادة ضبط السجلات
                </button>
              </div>
            </div>

            {/* Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                تصفية التاريخ:
              </span>

              <button
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedDateFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                جميع الأيام ({bookings.length})
              </button>

              <button
                onClick={() => setSelectedDateFilter('today')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedDateFilter === 'today'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                اليوم فقط ({todayTotal})
              </button>

              <div className="flex items-center gap-1.5 mr-auto">
                <span className="text-slate-500 font-bold">الحالة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="all">الكل</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="attended">حاضر</option>
                  <option value="cancelled">ملغي</option>
                  <option value="absent">غائب</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base">سجل حجوزات المعلمين</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  {filteredBookings.length} حجز
                </span>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">لا توجد حجوزات تطابق المعايير</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  تأكد من إلغاء الفلاتر أو استخدام زر «+ تجربة حجز معلمة» لتجربة إضافة حجز فوري.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">المعلم / المعلمة</th>
                      <th className="p-3.5">القسم والتخصص</th>
                      <th className="p-3.5">التاريخ والحصة</th>
                      <th className="p-3.5">الغرض والتجهيزات</th>
                      <th className="p-3.5">رقم التذكرة</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          {(() => {
                            const medalInfo = teacherMedalMap[b.studentName?.trim()];
                            return (
                              <div>
                                <div className="font-black text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                                  <span>{b.studentName}</span>
                                  {medalInfo?.details && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${medalInfo.details.badgeClass}`}
                                      title={`${medalInfo.details.title} (${medalInfo.count} حصص هذا الأسبوع)`}
                                    >
                                      <span>{medalInfo.details.icon}</span>
                                      <span>{medalInfo.tier === 'gold' ? 'ميدالية ذهبية' : medalInfo.tier === 'silver' ? 'ميدالية فضية' : 'ميدالية برونزية'}</span>
                                    </span>
                                  )}
                                </div>
                                {b.studentEmail && (
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                                    {b.studentEmail}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            {b.grade || 'غير محدد'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{b.timeSlot}</div>
                          <div className={`text-[11px] font-medium mt-0.5 ${b.date === todayStr ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                            📅 {b.date} {b.date === todayStr && '(اليوم)'}
                          </div>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <div className="font-medium text-slate-800 line-clamp-1">{b.purpose}</div>
                          {b.notes && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 italic">
                              «{b.notes}»
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-700">
                          {b.ticketNumber}
                        </td>

                        <td className="p-3.5">
                          <select
                            value={b.status}
                            onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer ${
                              b.status === 'attended'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : b.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : b.status === 'absent'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="confirmed">مؤكد</option>
                            <option value="attended">حاضر (في القاعة)</option>
                            <option value="absent">غائب</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewTicketBooking(b)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                              title="عرض التذكرة والباركود"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Viewing Full Ticket / Barcode */}
      <BookingTicketModal
        booking={viewTicketBooking}
        onClose={() => setViewTicketBooking(null)}
      />

      {/* Modal for Permanent Lifetime Deployment Guide */}
      <DeployGuideModal
        isOpen={showDeployGuide}
        onClose={() => setShowDeployGuide(false)}
      />

      {/* DISCREET DEVELOPER DOWNLOAD TRIGGER */}
      <div className="no-print mt-12 pt-4 border-t border-slate-200 text-center">
        <button
          onClick={() => setShowDevModal(true)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium inline-flex items-center gap-1.5 cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-100"
        >
          <span>🔧 مركز المطور (تحميل السورس والنسخ)</span>
        </button>
      </div>

      {/* DEVELOPER DOWNLOAD MODAL */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">مركز تطوير ونشر النظام</h3>
              <button
                onClick={() => setShowDevModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              اختر الملف المطلوب تحميله لجهازك (هذه اللوحة مخفية ولا تظهر للمشرفين):
            </p>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => handleBlobDownload('/api/download-zip', 'school-sources-system.zip')}
                disabled={isDownloading}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-200" />
                <span>تحميل السورس الكامل (ZIP)</span>
              </button>
              <button
                onClick={() => handleBlobDownload('/api/download-ready-website', 'school-sources-ready-website.zip')}
                disabled={isDownloading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>تحميل الموقع الجاهز للنشر (ZIP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
