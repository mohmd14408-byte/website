import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Send,
  Mail,
  LogIn,
  LogOut,
  ShieldCheck,
  History,
  Lock,
  ArrowRight,
  AlertCircle,
  Crown,
  Edit3,
  Phone,
  FileText,
  Monitor,
  Tv,
  Tablet,
  Laptop,
  Volume2,
  Wifi,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import MinistryLogo from './MinistryLogo';
import {
  DEFAULT_TIME_SLOTS,
  PURPOSE_PRESETS,
  GRADE_PRESETS,
  EQUIPMENT_PRESETS,
  Booking,
  StudentUser,
} from '../types/booking';
import {
  saveBookingAsync,
  getTodayDateString,
  getStoredBookings,
  fetchBookingsFromServer,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
} from '../lib/storage';
import {
  getSchoolWeekDays,
  addWeeksToDate,
  getTodayIsoDate,
} from '../lib/dateUtils';
import {
  signInWithGoogleOfficial,
  signOutOfficial,
  checkRedirectResult,
} from '../lib/firebase';
import { isSupervisorEmail } from '../lib/auth';
import { useToast } from './ui/Toast';
import BookingTicketModal from './BookingTicketModal';

interface BookingFormProps {
  onBookingSuccess?: (booking: Booking) => void;
  onRequestAdminLogin?: () => void;
  onSupervisorLogin?: () => void;
}

export default function BookingForm({
  onBookingSuccess,
  onRequestAdminLogin,
  onSupervisorLogin,
}: BookingFormProps) {
  const { toast } = useToast();
  const todayStr = getTodayDateString();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(() => getStoredUser());
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // View toggle for Teachers: 'form' (booking form) or 'schedule' (visual weekly schedule)
  const [teacherViewTab, setTeacherViewTab] = useState<'form' | 'schedule'>('form');

  // Form Fields - Teacher enters/edits her name freely!
  const [teacherName, setTeacherName] = useState<string>(() => {
    const user = getStoredUser();
    return user?.name || '';
  });
  const [teacherContact, setTeacherContact] = useState<string>(() => {
    const user = getStoredUser();
    return user?.email || '';
  });
  const [grade, setGrade] = useState<string>(GRADE_PRESETS[0]);
  const [customGrade, setCustomGrade] = useState<string>('');
  const [targetClass, setTargetClass] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'شاشة تفاعلية ذكية (Smart Board)',
  ]);
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals & History
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [viewHistoryModal, setViewHistoryModal] = useState<boolean>(false);
  const [allBookings, setAllBookings] = useState<Booking[]>(() => getStoredBookings());

  // Weekly Schedule Navigation for Teachers
  const [weekAnchorDate, setWeekAnchorDate] = useState<string>(todayStr);
  const weekDays = useMemo(() => getSchoolWeekDays(weekAnchorDate), [weekAnchorDate]);
  const teachingPeriods = useMemo(
    () => DEFAULT_TIME_SLOTS.filter((s) => s.id !== 'period-break'),
    []
  );

  // Load latest bookings from cloud on mount & auto-poll every 6s for cross-device slots
  useEffect(() => {
    fetchBookingsFromServer().then((data) => {
      if (Array.isArray(data)) setAllBookings(data);
    }).catch(() => setAllBookings([]));

    const pollInterval = setInterval(() => {
      fetchBookingsFromServer().then((data) => {
        if (Array.isArray(data)) setAllBookings(data);
      }).catch(() => setAllBookings([]));
    }, 6000);

    const handleUpdate = () => {
      setAllBookings(getStoredBookings());
    };
    window.addEventListener('bookings-updated', handleUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('bookings-updated', handleUpdate);
    };
  }, []);

  // Check redirect auth result on page mount
  useEffect(() => {
    checkRedirectResult().then((res) => {
      if (res) {
        const user: StudentUser = {
          name: res.name,
          email: res.email,
          avatar: res.avatar,
          provider: 'google',
        };
        setCurrentUser(user);
        saveStoredUser(user);
        if (!teacherName) setTeacherName(res.name);
        if (!teacherContact) setTeacherContact(res.email);

        toast({
          title: '🎉 تم ربط حساب Google بنجاح',
          description: `مرحباً بك (${res.email}). يمكنك تعديل اسمك في حقل الاسم أدناه بحرية.`,
          variant: 'success',
        });
        if (res.isSupervisor && onSupervisorLogin) {
          onSupervisorLogin();
        }
      }
    });
  }, []);

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      const res = await signInWithGoogleOfficial();
      const user: StudentUser = {
        name: res.name,
        email: res.email,
        avatar: res.avatar,
        provider: 'google',
      };

      setCurrentUser(user);
      saveStoredUser(user);

      setTeacherName((prev) => (prev.trim() ? prev : res.name));
      setTeacherContact(res.email);

      if (res.isSupervisor) {
        toast({
          title: '👑 أهلاً بك يا أمين المصادر (المشرف)',
          description: `تم التحقق من حسابك الرسمي (${res.email}).`,
          variant: 'success',
        });
        if (onSupervisorLogin) {
          onSupervisorLogin();
        }
      } else {
        toast({
          title: '🎉 تم تسجيل الدخول بنجاح',
          description: `أهلاً بك، يمكنك تأكيد أو تعديل اسمك أدناه قبل إتمام الحجز.`,
          variant: 'success',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تسجيل الدخول بواسطة Google';
      setAuthError(msg);
      toast({
        title: 'تنبيه في تسجيل الدخول',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutOfficial();
    clearStoredUser();
    setCurrentUser(null);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'يمكنك إدخال اسمك مباشرة أو تسجيل الدخول بحساب آخر.',
      variant: 'info',
    });
  };

  // Equipment Toggle
  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Quick Slot Select from Timetable
  const handleSelectSlotFromSchedule = (targetDate: string, periodName: string, periodTime: string) => {
    setDate(targetDate);
    setTimeSlot(`${periodName} (${periodTime})`);
    setTeacherViewTab('form');

    toast({
      title: 'تم تحديد الحصة بنجاح',
      description: `تم اختيار ${periodName} بتاريخ ${targetDate}. أكملي بيانات الحجز واضغطي تأكيد.`,
      variant: 'success',
    });

    // Scroll to form smoothly
    setTimeout(() => {
      const formEl = document.getElementById('booking-form-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Quick Date Selectors
  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  // Bookings for selected date
  const bookingsForSelectedDate = useMemo(() => {
    return allBookings.filter((b) => b.date === date && b.status !== 'cancelled');
  }, [allBookings, date]);

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherName.trim()) {
      toast({
        title: 'اسم المعلمة مطلوب',
        description: 'يرجى كتابة اسم المعلم أو المعلمة لحفظ الحجز.',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'التاريخ مطلوب',
        description: 'يرجى تحديد تاريخ حجز القاعة.',
        variant: 'destructive',
      });
      return;
    }

    if (!timeSlot) {
      toast({
        title: 'الحصة مطلوبة',
        description: 'يرجى اختيار الحصة المدرسية المناسبة لحجز القاعة.',
        variant: 'destructive',
      });
      return;
    }

    if (!purpose.trim()) {
      toast({
        title: 'الهدف من الحجز مطلوب',
        description: 'يرجى تحديد الهدف من استخدام غرفة مصادر التعلم.',
        variant: 'destructive',
      });
      return;
    }

    const selectedGradeFinal = grade === 'أخرى' && customGrade.trim() ? customGrade.trim() : grade;
    const finalDepartmentWithClass = targetClass.trim()
      ? `${selectedGradeFinal} • [الصف: ${targetClass.trim()}]`
      : selectedGradeFinal;

    const equipmentText =
      selectedEquipment.length > 0 ? `\nالتجهيزات المطلوبة: ${selectedEquipment.join('، ')}` : '';
    const fullNotes = (notes.trim() + equipmentText).trim();

    setIsSubmitting(true);

    try {
      const newBooking = await saveBookingAsync({
        studentName: teacherName.trim(),
        studentEmail: teacherContact.trim() || currentUser?.email || 'teacher@school.edu.sa',
        studentId: currentUser?.email || undefined,
        grade: finalDepartmentWithClass,
        date: date,
        timeSlot: timeSlot,
        purpose: purpose.trim(),
        notes: fullNotes || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#047857', '#10b981', '#fbbf24', '#f59e0b'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }

      setCompletedBooking(newBooking);

      toast({
        title: '🎉 تم تأكيد حجز غرفة المصادر بنجاح!',
        description: `تم حفظ حجزك برقم تذكرة (${newBooking.ticketNumber}) وتم إدراجه في سجل الإدارة فوراً.`,
        variant: 'success',
      });

      if (onBookingSuccess) {
        onBookingSuccess(newBooking);
      }

      // Reset slot and purpose for next booking
      setTimeSlot('');
      setPurpose('');
      setNotes('');
      setTargetClass('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء حفظ الحجز.';
      toast({
        title: 'تعذر حفظ الحجز',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSupervisorUser = currentUser && isSupervisorEmail(currentUser.email);
  const myBookings = allBookings.filter(
    (b) =>
      (teacherName && b.studentName.toLowerCase().includes(teacherName.toLowerCase().trim())) ||
      (currentUser && b.studentEmail.toLowerCase() === currentUser.email.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8" dir="rtl">
      {/* 1. ROYAL HERO SECTION (Inspired by Manus Luxury Emerald Educational Aesthetic) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-emerald-800/50">
        {/* Subtle decorative glow circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Institutional Badge & Ministry of Education Logo */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Official Logo Display */}
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
                <MinistryLogo variant="light" className="h-12 w-auto" />
              </div>

              <div className="hidden lg:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>مركز مصادر التعلم المعتمد</span>
              </div>
            </div>

            {/* Quick links & history */}
            <div className="flex items-center gap-2">
              {myBookings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewHistoryModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <History className="w-3.5 h-3.5 text-amber-300" />
                  <span>سجل حجوزاتي ({myBookings.length})</span>
                </button>
              )}

              {isSupervisorUser && onRequestAdminLogin && (
                <button
                  type="button"
                  onClick={onRequestAdminLogin}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>لوحة الإشراف والمتابعة</span>
                </button>
              )}
            </div>
          </div>

          {/* Headline & Description */}
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              مركز مصادر التعلم... <span className="text-emerald-300">بيئة ملهمة تصنع فرق</span> وترتقي بالتعليم
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              بوابة مخصصة للمعلمين والمعلمات لحجز قاعة مصادر التعلم، الشاشات التفاعلية الذكية، وأجهزة العرض التقنية بكل يسر وموثوقية مع تسجيل فوري معتمد لدى الإدارة.
            </p>
          </div>

          {/* Three Feature Highlight Cards (Manus-inspired) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">١. استعراض الحصص المتاحة</div>
                <div className="text-[11px] text-slate-300 mt-0.5">تفقد شواغر القاعة طوال الأسبوع وحجز أي حصة بنقرة واحدة.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">٢. تجهيزات وتقنيات ذكية</div>
                <div className="text-[11px] text-slate-300 mt-0.5">شاشات ذكية، أجهزة آيباد للطلاب، داتا شو، وإنترنت سريع.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">٣. تأكيد فوري وباركود رسمي</div>
                <div className="text-[11px] text-slate-300 mt-0.5">إصدار تذكرة معتمدة مع باركود وربط مباشر مع لوحة المشرف.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER FOR TEACHERS: BOOKING FORM VS WEEKLY SCHEDULE */}
      <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-200/70 p-1.5 rounded-2xl max-w-md mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => setTeacherViewTab('form')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            teacherViewTab === 'form'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit3 className="w-4 h-4 text-emerald-600" />
          <span>نموذج الحجز وتحديد الأجهزة</span>
        </button>

        <button
          type="button"
          onClick={() => setTeacherViewTab('schedule')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            teacherViewTab === 'schedule'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>جدول الحصص الشاغرة هذا الأسبوع</span>
        </button>
      </div>

      {/* 3. TEACHER VIEW A: INTERACTIVE WEEKLY SCHEDULE FOR EASY SLOT PICKING */}
      {teacherViewTab === 'schedule' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                الجدول الأسبوعي لمواعيد القاعة
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك الضغط على أي حصة متاحة (شاغرة) لحجزها فوراً وتعبئة بياناتك.
              </p>
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekAnchorDate((prev) => addWeeksToDate(prev, -1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                title="الأسبوع السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-xs font-black text-slate-800 px-3 py-1 bg-slate-100 rounded-lg">
                من الأحد {weekDays[0]?.formatted} إلى الخميس {weekDays[4]?.formatted}
              </div>

              <button
                type="button"
                onClick={() => setWeekAnchorDate((prev) => addWeeksToDate(prev, 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                title="الأسبوع القادم"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-center border border-slate-800 min-w-[100px]">اليوم</th>
                  {teachingPeriods.map((p) => (
                    <th key={p.id} className="p-2.5 text-center border border-slate-800 min-w-[120px]">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono" dir="ltr">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day) => (
                  <tr key={day.date} className={day.isToday ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}>
                    <td className="p-3 border border-slate-200 text-center bg-slate-100/70">
                      <div className="font-black text-slate-900">{day.name}</div>
                      <div className="text-[11px] text-slate-500">{day.formatted}</div>
                      {day.isToday && (
                        <span className="mt-1 inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                          اليوم
                        </span>
                      )}
                    </td>

                    {teachingPeriods.map((p) => {
                      const existing = allBookings.find(
                        (b) => b.date === day.date && b.timeSlot.includes(p.name) && b.status !== 'cancelled'
                      );

                      return (
                        <td key={p.id} className="p-2 border border-slate-200 align-top">
                          {existing ? (
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] space-y-0.5">
                              <div className="font-black text-amber-950 truncate">
                                🔒 {existing.studentName}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {existing.grade || 'محجوز'}
                              </div>
                              <div className="text-[9px] text-amber-700 font-bold">
                                القاعة مشغولة
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectSlotFromSchedule(day.date, p.name, p.time)}
                              className="w-full h-full min-h-[50px] p-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-100/70 text-emerald-800 transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer group"
                            >
                              <span className="text-[10px] font-bold text-emerald-700 group-hover:underline">
                                شاغر • احجز الآن
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TEACHER VIEW B: MAIN BOOKING FORM */}
      {teacherViewTab === 'form' && (
        <div
          id="booking-form-card"
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/90 overflow-hidden animate-in fade-in"
        >
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 h-2.5 w-full" />

          {/* Account helper strip */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                      حساب متصل
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                    {currentUser.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-600">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>ملاحظة للمعلمة:</strong> يمكنك كتابة اسمك مباشرة في النموذج أدناه، أو الربط بحساب Google للتسهيل.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-rose-700 font-bold transition-all cursor-pointer"
                >
                  تسجيل خروج
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white bg-slate-100 text-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>{isGoogleLoading ? 'جاري الفتح...' : 'ربط بحساب Google (اختياري)'}</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
            {/* 1. Teacher Information (Fully Editable) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>بيانات المعلم / المعلمة</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" />
                  اكتبي اسمك الثلاثي أو الرباعي المعتمد
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Teacher Name Input */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="teacherName" className="block text-xs font-bold text-slate-800">
                    اسم المعلم / المعلمة كاملاً: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="teacherName"
                      type="text"
                      required
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="مثال: أ. نورة محمد القحطاني أو أ. سارة فهد الحربي"
                      className="w-full h-12 pr-11 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <User className="w-4 h-4 text-emerald-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-500 pr-1">
                    هذا الاسم هو الذي سيظهر رسمياً في لوحة الإشراف وسجل الحجوزات المعتمد.
                  </p>
                </div>

                {/* Department / Subject Selection */}
                <div className="space-y-1.5">
                  <label htmlFor="grade" className="block text-xs font-bold text-slate-800">
                    القسم / التخصص التدريسي: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    {GRADE_PRESETS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    <option value="أخرى">قسم / تخصص آخر (كتابة يدوية)</option>
                  </select>
                </div>

                {/* Target Class/Grade (الصف والشعبة) */}
                <div className="space-y-1.5">
                  <label htmlFor="targetClass" className="block text-xs font-bold text-slate-800">
                    الصف والشعبة المستهدفة: <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    id="targetClass"
                    type="text"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    placeholder="مثال: ثاني متوسط / أ أو الصف الأول ثانوي / ٣"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Teacher Email or Phone for communication */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="teacherContact" className="block text-xs font-bold text-slate-800">
                    البريد الإلكتروني أو رقم التواصل: <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="teacherContact"
                      type="text"
                      value={teacherContact}
                      onChange={(e) => setTeacherContact(e.target.value)}
                      placeholder="بريد منصة مدرستي أو رقم الجوال للتنسيق مع أمين المصادر"
                      className="w-full h-12 pr-11 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Custom Department if chosen */}
                {grade === 'أخرى' && (
                  <div className="space-y-1.5 sm:col-span-2 animate-in fade-in">
                    <label htmlFor="customGrade" className="block text-xs font-bold text-slate-800">
                      اكتب اسم القسم أو المادة يدوياً:
                    </label>
                    <input
                      id="customGrade"
                      type="text"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      placeholder="مثال: قسم صعوبات التعلم أو ريادة النشاط المدرسي"
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Date Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>تاريخ الحجز المطلوب <span className="text-rose-500">*</span></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDate(0)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      date === todayStr
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate(1)}
                    className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    غداً
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate(2)}
                    className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    بعد غد
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  min={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 pr-11 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-emerald-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Class Period / Time Slot Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>اختر الحصة المدرسية <span className="text-rose-500">*</span></span>
                </div>
                <span className="text-xs text-slate-500 font-medium">حدد الحصة المطلوبة لحجز القاعة</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEFAULT_TIME_SLOTS.map((slot) => {
                  const isSelected = timeSlot.includes(slot.name);
                  const bookedBookings = bookingsForSelectedDate.filter((b) =>
                    b.timeSlot.includes(slot.name)
                  );
                  const isOccupied = bookedBookings.length > 0;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTimeSlot(`${slot.name} (${slot.time})`)}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-sm'
                          : isOccupied
                          ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/60'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black text-sm ${
                              isSelected ? 'text-emerald-950' : 'text-slate-800'
                            }`}
                          >
                            {slot.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                          {slot.time}
                        </div>
                      </div>

                      <div className="text-left">
                        {isOccupied ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 block">
                              حجز سابق
                            </span>
                            <span className="text-[9px] text-slate-500 block truncate max-w-[120px]">
                              {bookedBookings[0].studentName}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            متاح للحجز
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {timeSlot && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-black flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>الحصة المحددة للحجز: {timeSlot}</span>
                </div>
              )}
            </div>

            {/* 4. Equipment & Resource Options (Manus-inspired multi-select tags) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <Tv className="w-5 h-5 text-emerald-600" />
                  <span>التجهيزات والتقنيات المطلوبة للحصة</span>
                </div>
                <span className="text-xs text-slate-500">حددي الأجهزة لتجهيزها مسبقاً</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {EQUIPMENT_PRESETS.map((item) => {
                  const isChecked = selectedEquipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Purpose of Reservation (Direct input without clutter chips) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-base">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>الهدف من استخدام غرفة المصادر / عنوان الدرس والنشاط <span className="text-rose-500">*</span></span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="اكتبي موضوع الدرس أو الهدف (مثال: درس تفاعلي، تجارب علمية، ورشة عمل، مسابقة تعليمية)..."
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* 6. Additional Notes for Supervisor */}
            <div className="space-y-2">
              <label htmlFor="notes" className="block text-xs font-bold text-slate-800">
                ملاحظات خاصة موجهة لأمين المصادر أو الإدارة: <span className="text-slate-400 font-normal">(اختياري)</span>
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: نرجو تجهيز القاعة قبل بداية الحصة بـ 5 دقائق وتوصيل إنترنت الشاشة..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-900/25 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>جاري تسجيل الحجز وإصدار التذكرة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>تأكيد الحجز وإصدار تذكرة المعلم الرسمية فوراً</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  يتم توثيق الحجز فورياً في قاعدة البيانات السحابية المشتركة مع لوحة المشرف.
                </span>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Modal popup after successful booking */}
      <BookingTicketModal
        booking={completedBooking}
        onClose={() => setCompletedBooking(null)}
      />

      {/* Teacher History Modal */}
      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">سجل حجوزات المعلمة</h3>
              </div>
              <button
                onClick={() => setViewHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                لا توجد حجوزات سابقة مسجلة باسمك بعد.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {myBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-2">
                        <span>{b.timeSlot}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          {b.ticketNumber}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        📅 {b.date} • {b.purpose}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setViewHistoryModal(false);
                        setCompletedBooking(b);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 font-bold shrink-0 cursor-pointer"
                    >
                      عرض التذكرة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
