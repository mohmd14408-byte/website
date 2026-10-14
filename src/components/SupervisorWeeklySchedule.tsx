import React, { useState, useMemo, useEffect } from 'react';
import {
  Booking,
  DEFAULT_TIME_SLOTS,
  SchoolDayInfo,
} from '../types/booking';
import {
  getSchoolWeekDays,
  addWeeksToDate,
  getTodayIsoDate,
} from '../lib/dateUtils';
import {
  Printer,
  FileSpreadsheet,
  Copy,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  School,
  User,
  Share2,
  AlertCircle,
  FileText,
  BadgeCheck,
  Building,
  Trophy,
} from 'lucide-react';
import { useToast } from './ui/Toast';
import MinistryLogo from './MinistryLogo';
import TeacherMedalsShowcase from './TeacherMedalsShowcase';
import { useSchoolSettings } from '../lib/schoolSettings';
import {
  getMedalTierForCount,
  getMedalDetails,
  computeWeeklyTeacherMedals,
} from '../lib/medalsUtils';

interface SupervisorWeeklyScheduleProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
}

export default function SupervisorWeeklySchedule({
  bookings,
  onSelectBooking,
}: SupervisorWeeklyScheduleProps) {
  const { toast } = useToast();
  const { settings, saveSettings } = useSchoolSettings();
  const todayIso = getTodayIsoDate();

  // Current anchor date (defaults to today)
  const [anchorDate, setAnchorDate] = useState<string>(todayIso);
  const [schoolName, setSchoolName] = useState<string>(() => settings.schoolName);
  const [isEditingSchool, setIsEditingSchool] = useState<boolean>(false);

  useEffect(() => {
    setSchoolName(settings.schoolName);
  }, [settings.schoolName]);

  // Compute school days for the selected week (Sunday through Thursday)
  const weekDays = useMemo(() => {
    return getSchoolWeekDays(anchorDate);
  }, [anchorDate]);

  const weekStartFormatted = weekDays[0]?.formatted;
  const weekEndFormatted = weekDays[4]?.formatted;
  const weekRangeText = `من الأحد ${weekStartFormatted} إلى الخميس ${weekEndFormatted}`;

  // Filter periods (exclude break period from formal teaching grid, or keep as separator)
  const teachingPeriods = useMemo(() => {
    return DEFAULT_TIME_SLOTS.filter((s) => s.id !== 'period-break');
  }, []);

  // Map bookings to day & period for fast lookup
  const weekDatesSet = useMemo(() => new Set(weekDays.map((d) => d.date)), [weekDays]);

  const weekBookings = useMemo(() => {
    return bookings.filter((b) => weekDatesSet.has(b.date));
  }, [bookings, weekDatesSet]);

  // Lookup matrix: [date][periodName] -> Booking[]
  const bookingsMatrix = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    for (const d of weekDays) {
      map[d.date] = {};
      for (const p of teachingPeriods) {
        map[d.date][p.name] = [];
      }
    }

    for (const b of weekBookings) {
      if (map[b.date]) {
        for (const p of teachingPeriods) {
          if (b.timeSlot.includes(p.name)) {
            map[b.date][p.name].push(b);
          }
        }
      }
    }
    return map;
  }, [weekDays, teachingPeriods, weekBookings]);

  // Compute teacher counts and medals for this week
  const teacherWeeklyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of weekBookings) {
      const name = b.studentName?.trim();
      if (name) {
        map[name] = (map[name] || 0) + 1;
      }
    }
    return map;
  }, [weekBookings]);

  const weeklyMedals = useMemo(() => {
    return computeWeeklyTeacherMedals(weekBookings);
  }, [weekBookings]);

  // Weekly Stats
  const totalSlots = weekDays.length * teachingPeriods.length; // 5 * 7 = 35
  const bookedSlotsCount = useMemo(() => {
    let count = 0;
    for (const d of weekDays) {
      for (const p of teachingPeriods) {
        if (bookingsMatrix[d.date]?.[p.name]?.length > 0) {
          count++;
        }
      }
    }
    return count;
  }, [weekDays, teachingPeriods, bookingsMatrix]);

  const freeSlotsCount = totalSlots - bookedSlotsCount;
  const occupancyRate = Math.round((bookedSlotsCount / totalSlots) * 100);

  // Handlers for Week Navigation
  const handlePrevWeek = () => {
    setAnchorDate((prev) => addWeeksToDate(prev, -1));
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => addWeeksToDate(prev, 1));
  };

  const handleCurrentWeek = () => {
    setAnchorDate(todayIso);
  };

  const handleSaveSchoolName = async (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setSchoolName(trimmed);
    await saveSettings({ schoolName: trimmed });
    setIsEditingSchool(false);
    toast({
      title: 'تم حفظ اسم المدرسة بنجاح!',
      description: `تم تثبيت اسم: ${trimmed} في النظام.`,
      variant: 'success',
    });
  };

  // 1. PRINT OFFICIAL SCHEDULE
  const handlePrint = () => {
    window.print();
  };

  // 2. EXPORT WEEKLY CSV (EXCEL)
  const handleExportWeeklyCSV = () => {
    if (weekBookings.length === 0) {
      toast({
        title: 'لا توجد حجوزات في هذا الأسبوع',
        description: 'يمكنك اختيار أسبوع آخر للتصدير أو إضافة حجوزات جديدة.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'اليوم',
      'التاريخ',
      'الحصة',
      'الوقت',
      'اسم المعلم/المعلمة',
      'القسم / المادة',
      'الهدف من الحجز',
      'رقم التذكرة',
      'الحالة',
    ];

    const rows: string[][] = [];

    weekDays.forEach((day) => {
      teachingPeriods.forEach((period) => {
        const slots = bookingsMatrix[day.date]?.[period.name] || [];
        if (slots.length > 0) {
          slots.forEach((b) => {
            rows.push([
              `"${day.name}"`,
              `"${day.date}"`,
              `"${period.name}"`,
              `"${period.time}"`,
              `"${b.studentName}"`,
              `"${b.grade || '-'}"`,
              `"${(b.purpose || '').replace(/"/g, '""')}"`,
              `"${b.ticketNumber}"`,
              `"${b.status === 'attended' ? 'حاضر' : b.status === 'cancelled' ? 'ملغي' : 'مؤكد'}"`,
            ]);
          });
        }
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `جدول_حجوزات_الأسبوع_${weekDays[0].date}_إلى_${weekDays[4].date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'تم حفظ وتصدير ملف الأسبوع',
      description: 'تم تحميل ملف CSV الخاص بالأسبوع بنجاح ومتوافق مع Excel.',
      variant: 'success',
    });
  };

  // 3. COPY WHATSAPP SUMMARY FOR SCHOOL ADMINISTRATION
  const handleCopyWhatsApp = () => {
    let summary = `📋 *جدول حجوزات مركز مصادر التعلم*\n🏫 *${schoolName}*\n📅 *${weekRangeText}*\n\n`;

    let hasAny = false;
    weekDays.forEach((day) => {
      const dayBookings: { period: string; teacher: string; subject: string }[] = [];
      teachingPeriods.forEach((period) => {
        const list = bookingsMatrix[day.date]?.[period.name] || [];
        list.forEach((b) => {
          dayBookings.push({
            period: period.name,
            teacher: b.studentName,
            subject: b.grade || '',
          });
        });
      });

      if (dayBookings.length > 0) {
        hasAny = true;
        summary += `📌 *${day.name} (${day.formatted}):*\n`;
        dayBookings.forEach((item) => {
          summary += `  ▫️ ${item.period}: ${item.teacher} (${item.subject})\n`;
        });
        summary += `\n`;
      }
    });

    if (!hasAny) {
      summary += `لا توجد حجوزات مسجلة لهذا الأسبوع حتى الآن.\n`;
    }

    summary += `📊 إجمالي الحصص المحجوزة: ${bookedSlotsCount} حصة.\n`;
    summary += `✍️ إعداد: أمينة مركز مصادر التعلم أ. عواطف البهلال`;

    navigator.clipboard.writeText(summary);
    toast({
      title: 'تم نسخ تقرير الأسبوع للواتساب!',
      description: 'يمكنك الآن لصقه مباشرة في قروب المعلمين أو إدارة المدرسة.',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Controls Card (Hidden during print) */}
      <div className="no-print bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-1.5 border border-emerald-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>ميزة خاصة بالمشرف • إدارة وطباعة الجدول الأسبوعي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              جدول حجوزات الأسبوع الرسمي المعتمد
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              استعراض كامل لحجوزات المعلمين من الأحد إلى الخميس مع إمكانية الحفظ والطباعة الرسمية A4 أو التصدير.
            </p>
          </div>

          {/* Action Buttons: PRINT & EXPORT */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-900/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              title="طباعة الجدول الأسبوعي أو حفظه كـ PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الجدول الأسبوعي (A4 / PDF)</span>
            </button>

            <button
              onClick={handleExportWeeklyCSV}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border border-slate-200"
              title="تصدير بيانات الأسبوع إلى ملف Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>تصدير Excel (CSV)</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-200"
              title="نسخ ملخص جاهز للإرسال في الواتساب"
            >
              <Copy className="w-4 h-4 text-emerald-600" />
              <span>نسخ للواتساب</span>
            </button>
          </div>
        </div>

        {/* Week Selector Bar & School Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-all"
              title="الأسبوع السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[200px]">
              <div className="text-xs font-black text-slate-900">{weekRangeText}</div>
              <div className="text-[10px] text-slate-500 font-medium">الأسبوع الدراسي</div>
            </div>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer transition-all"
              title="الأسبوع القادم"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentWeek}
              className="text-xs px-3 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
            >
              الأسبوع الحالي
            </button>
          </div>

          {/* School Name Customizer */}
          <div className="flex items-center gap-2 text-xs">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-medium">اسم المدرسة على التقرير:</span>
            {isEditingSchool ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="px-2 py-1 border border-emerald-400 rounded-lg text-xs font-bold text-slate-900 bg-emerald-50/50"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveSchoolName(schoolName)}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingSchool(true)}
                className="font-black text-slate-800 underline decoration-dotted hover:text-emerald-700 cursor-pointer"
                title="اضغط للتعديل"
              >
                {schoolName} ✎
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
            <div className="text-xl font-black text-emerald-900">{bookedSlotsCount}</div>
            <div className="text-xs font-bold text-emerald-700">حصص محجوزة هذا الأسبوع</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xl font-black text-slate-800">{freeSlotsCount}</div>
            <div className="text-xs font-bold text-slate-600">حصص شاغرة متاحة</div>
          </div>
          <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-2xl">
            <div className="text-xl font-black text-teal-900">%{occupancyRate}</div>
            <div className="text-xs font-bold text-teal-700">نسبة إشغال القاعة</div>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
            <div className="text-xl font-black text-amber-900">{totalSlots}</div>
            <div className="text-xs font-bold text-amber-700">إجمالي الحصص (٥ أيام)</div>
          </div>
        </div>
      </div>

      {/* 2. WEEKLY TEACHER MEDALS & HONORS BOARD (Gold 5-6, Silver 3-4, Bronze 2) */}
      <div className="no-print">
        <TeacherMedalsShowcase
          weekBookings={weekBookings}
          weekRangeText={weekRangeText}
        />
      </div>

      {/* 3. OFFICIAL PRINT HEADER (Only visible on paper printout) */}
      <div className="hidden print-only mb-4" dir="rtl">
        <div className="border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 leading-relaxed">
            <div className="text-right flex items-center gap-3">
              <MinistryLogo variant="dark" className="h-12 w-auto" />
              <div>
                <div>المملكة العربية السعودية</div>
                <div>وزارة التعليم</div>
                <div>الإدارة العامة للتعليم</div>
                <div>مدرسة: {schoolName}</div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-base font-black text-slate-900">
                مركز مصادر التعلم
              </div>
              <div className="text-sm font-bold bg-slate-100 px-3 py-0.5 rounded-md border border-slate-300">
                الجدول الأسبوعي المعتمد لحجوزات القاعة
              </div>
              <div className="text-xs font-medium text-slate-600">
                الفترة: {weekRangeText}
              </div>
            </div>

            <div className="text-left font-mono text-[10px] text-slate-500">
              <div>تاريخ الطباعة: {todayIso}</div>
              <div>إجمالي الحجوزات: {bookedSlotsCount} حصة</div>
              <div>نسبة الإشغال: %{occupancyRate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THE WEEKLY MATRIX TABLE (Renders on Screen AND on Print) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse printable-weekly-table">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="p-3 text-center border border-slate-800 w-28 shrink-0">
                  اليوم / الحصة
                </th>
                {teachingPeriods.map((period) => (
                  <th
                    key={period.id}
                    className="p-3 text-center border border-slate-800 min-w-[130px]"
                  >
                    <div className="font-black text-xs">{period.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono" dir="ltr">
                      {period.time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day, idx) => (
                <tr
                  key={day.date}
                  className={`border-b transition-colors ${
                    day.isToday
                      ? 'bg-emerald-50/40 font-semibold'
                      : idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-slate-50/50'
                  }`}
                >
                  {/* Day Header Cell */}
                  <td className="p-3 border border-slate-200 text-center bg-slate-100/80">
                    <div className="font-black text-sm text-slate-900">{day.name}</div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {day.formatted}
                    </div>
                    {day.isToday && (
                      <span className="no-print mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                        اليوم
                      </span>
                    )}
                  </td>

                  {/* Period Cells */}
                  {teachingPeriods.map((period) => {
                    const slots = bookingsMatrix[day.date]?.[period.name] || [];
                    const isBooked = slots.length > 0;

                    return (
                      <td
                        key={period.id}
                        className={`p-2 border border-slate-200 align-top transition-all ${
                          isBooked
                            ? 'bg-emerald-50/60'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {isBooked ? (
                          <div className="space-y-1.5">
                            {slots.map((b) => (
                              <div
                                key={b.id}
                                className="p-2 rounded-xl bg-white border border-emerald-300 shadow-xs text-xs space-y-1"
                              >
                                {(() => {
                                  const tCount = teacherWeeklyCounts[b.studentName?.trim()] || 0;
                                  const tTier = getMedalTierForCount(tCount);
                                  const tMedal = getMedalDetails(tTier);
                                  return (
                                    <div className="font-black text-emerald-950 flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="truncate">{b.studentName}</span>
                                        {tMedal && (
                                          <span
                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0 border ${tMedal.badgeClass}`}
                                            title={`${tMedal.title} (${tCount} حصص هذا الأسبوع)`}
                                          >
                                            <span>{tMedal.icon}</span>
                                            <span className="text-[8px] hidden sm:inline">
                                              {tTier === 'gold' ? 'ذهبية' : tTier === 'silver' ? 'فضية' : 'برونزية'}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                          b.status === 'attended'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : b.status === 'cancelled'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-900'
                                        }`}
                                      >
                                        {b.status === 'attended'
                                          ? 'حاضر'
                                          : b.status === 'cancelled'
                                          ? 'ملغي'
                                          : 'مؤكد'}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {b.grade && (
                                  <div className="text-[10px] text-slate-600 line-clamp-1">
                                    {b.grade}
                                  </div>
                                )}

                                {b.purpose && (
                                  <div className="text-[10px] text-slate-500 line-clamp-1 italic">
                                    «{b.purpose}»
                                  </div>
                                )}

                                <div className="text-[9px] font-mono text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-100">
                                  <span>{b.ticketNumber}</span>
                                  {onSelectBooking && (
                                    <button
                                      onClick={() => onSelectBooking(b)}
                                      className="no-print text-emerald-700 hover:underline cursor-pointer font-bold"
                                    >
                                      عرض
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full min-h-[55px] flex items-center justify-center text-center">
                            <span className="text-[11px] text-slate-400 font-medium">
                              شاغر
                            </span>
                          </div>
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

      {/* 4. OFFICIAL PRINT FOOTER & SIGNATURES (Only visible on paper printout) */}
      <div className="hidden print-only mt-6 pt-4 border-t border-slate-300 text-xs font-bold text-slate-900" dir="rtl">
        {/* Weekly Medal Honors in Printout */}
        {weeklyMedals.filter((m) => m.tier !== null).length > 0 && (
          <div className="mb-6 p-3 rounded-lg border border-slate-400 bg-slate-50">
            <div className="font-black text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="text-sm">🏅</span>
              <span>لوحة تكريم المعلمات وأوسمة التميز لهذا الأسبوع ({weekRangeText}):</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-800">
              {weeklyMedals
                .filter((m) => m.tier !== null)
                .map((m) => (
                  <span key={m.teacherName} className="inline-flex items-center gap-1">
                    <span>{m.icon}</span>
                    <span className="font-black text-slate-900">{m.teacherName}</span>
                    <span className="text-slate-600">({m.tierTitle} - {m.count} حصص)</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="space-y-8">
            <div>أمينة مركز مصادر التعلم: أ. عواطف البهلال</div>
            <div className="border-b border-dashed border-slate-500 w-40 mx-auto"></div>
            <div>التوقيع: ............................</div>
          </div>

          <div className="space-y-8">
            <div>وكيل / وكيلة الشؤون التعليمية:</div>
            <div className="border-b border-dashed border-slate-500 w-40 mx-auto"></div>
            <div>التوقيع: ............................</div>
          </div>

          <div className="space-y-8">
            <div>مدير / مديرة المدرسة:</div>
            <div className="border-b border-dashed border-slate-500 w-40 mx-auto"></div>
            <div>الختم والاعتماد الرسمي: [ ............... ]</div>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 mt-6">
          طُبع هذا التقرير آلياً عبر نظام إدارة غرفة مصادر التعلم المعتمد • تاريخ التوليد: {todayIso}
        </div>
      </div>
    </div>
  );
}
