import React from 'react';
import { Booking } from '../types/booking';
import {
  computeWeeklyTeacherMedals,
  getMedalDetails,
  MedalTier,
} from '../lib/medalsUtils';
import { Award, Sparkles, Trophy, Star, ChevronDown } from 'lucide-react';

interface TeacherMedalsShowcaseProps {
  weekBookings: Booking[];
  weekRangeText?: string;
  onFilterTeacher?: (teacherName: string) => void;
}

export default function TeacherMedalsShowcase({
  weekBookings,
  weekRangeText,
  onFilterTeacher,
}: TeacherMedalsShowcaseProps) {
  const teacherMedals = computeWeeklyTeacherMedals(weekBookings);

  const goldTeachers = teacherMedals.filter((t) => t.tier === 'gold');
  const silverTeachers = teacherMedals.filter((t) => t.tier === 'silver');
  const bronzeTeachers = teacherMedals.filter((t) => t.tier === 'bronze');
  const otherTeachers = teacherMedals.filter((t) => t.tier === null);

  const totalMedalHolders = goldTeachers.length + silverTeachers.length + bronzeTeachers.length;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 text-2xl shrink-0">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                لوحة ميداليات التميز الأسبوعية للمعلمات
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                {totalMedalHolders} معلمات مُكَرَّمات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              نظام تحفيز أسبوعي تلقائي بناءً على تكرار حجز غرفة المصادر ({weekRangeText || 'الأسبوع المحدد'})
            </p>
          </div>
        </div>

        {/* Medal Criteria Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-bold">
            <span className="text-base">🥇</span>
            <span>الذهبية: ٥ - ٦ حصص</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-bold">
            <span className="text-base">🥈</span>
            <span>الفضية: ٣ - ٤ حصص</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-amber-700/30 text-amber-900 font-bold">
            <span className="text-base">🥉</span>
            <span>البرونزية: حصتان (٢)</span>
          </div>
        </div>
      </div>

      {/* Three Medal Podiums / Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. GOLD PODIUM */}
        <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/90 to-yellow-100/40 p-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-2 left-2 opacity-15 pointer-events-none">
            <Trophy className="w-20 h-20 text-amber-600" />
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥇</span>
              <div>
                <h4 className="text-sm font-black text-amber-950">الميدالية الذهبية</h4>
                <p className="text-[10px] text-amber-800 font-semibold">٥ إلى ٦ مرات بالأسبوع</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-black">
              {goldTeachers.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {goldTeachers.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/60 border border-amber-200/60 text-center text-xs text-amber-800/80">
                لا توجد معلمة بلغت ٥ - ٦ حصص هذا الأسبوع بعد.
              </div>
            ) : (
              goldTeachers.map((teacher) => (
                <div
                  key={teacher.teacherName}
                  onClick={() => onFilterTeacher && onFilterTeacher(teacher.teacherName)}
                  className="p-3 rounded-xl bg-white/90 border border-amber-300 hover:border-amber-400 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{teacher.teacherName}</span>
                    </div>
                    {teacher.department && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {teacher.department}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-left">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-xs">
                      {teacher.count} حصص
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. SILVER PODIUM */}
        <div className="rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-slate-50/90 to-slate-100/60 p-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-2 left-2 opacity-15 pointer-events-none">
            <Award className="w-20 h-20 text-slate-600" />
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥈</span>
              <div>
                <h4 className="text-sm font-black text-slate-900">الميدالية الفضية</h4>
                <p className="text-[10px] text-slate-600 font-semibold">٣ إلى ٤ مرات بالأسبوع</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-black">
              {silverTeachers.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {silverTeachers.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/60 border border-slate-200 text-center text-xs text-slate-600">
                لا توجد معلمة بلغت ٣ - ٤ حصص هذا الأسبوع.
              </div>
            ) : (
              silverTeachers.map((teacher) => (
                <div
                  key={teacher.teacherName}
                  onClick={() => onFilterTeacher && onFilterTeacher(teacher.teacherName)}
                  className="p-3 rounded-xl bg-white/90 border border-slate-300 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-black text-slate-900 truncate">
                      {teacher.teacherName}
                    </div>
                    {teacher.department && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {teacher.department}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-left">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-black text-xs">
                      {teacher.count} حصص
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. BRONZE PODIUM */}
        <div className="rounded-2xl border-2 border-amber-700/30 bg-gradient-to-b from-orange-50/70 to-amber-100/30 p-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-2 left-2 opacity-15 pointer-events-none">
            <Sparkles className="w-20 h-20 text-amber-800" />
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-amber-700/20">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥉</span>
              <div>
                <h4 className="text-sm font-black text-amber-950">الميدالية البرونزية</h4>
                <p className="text-[10px] text-amber-800 font-semibold">حصتان (٢) بالأسبوع</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/15 text-amber-900 font-black">
              {bronzeTeachers.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {bronzeTeachers.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/60 border border-amber-700/20 text-center text-xs text-amber-800/80">
                لا توجد معلمة بحصتين اثنتين هذا الأسبوع.
              </div>
            ) : (
              bronzeTeachers.map((teacher) => (
                <div
                  key={teacher.teacherName}
                  onClick={() => onFilterTeacher && onFilterTeacher(teacher.teacherName)}
                  className="p-3 rounded-xl bg-white/90 border border-amber-700/30 hover:border-amber-700/50 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-xs font-black text-slate-900 truncate">
                      {teacher.teacherName}
                    </div>
                    {teacher.department && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {teacher.department}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-left">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-900/10 text-amber-900 font-black text-xs">
                      {teacher.count} حصص
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Single Reservation Mentions (Encouragement) */}
      {otherTeachers.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-700">🌱 معلمات بحصة واحدة (في طريقهن للميدالية البرونزية):</span>
          {otherTeachers.map((t) => (
            <span
              key={t.teacherName}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-medium"
            >
              {t.teacherName} (حصة)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
