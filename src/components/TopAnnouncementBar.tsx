import React from 'react';
import { Sparkles, Award } from 'lucide-react';

export default function TopAnnouncementBar() {
  const announcements = [
    '✨ تم بواسطة أمينة مصادر التعلم : عواطف البهلال ✨',
    '🌟 إشراف: أ. عواطف البهلال 🌟',
    '📖 مركز مصادر التعلم والابتكار المدرسي 📖',
    '✨ تم بواسطة أمينة مصادر التعلم : عواطف البهلال ✨',
    '🌟 إشراف: أ. عواطف البهلال 🌟',
    '📖 مركز مصادر التعلم والابتكار المدرسي 📖',
  ];

  return (
    <div
      className="no-print relative overflow-hidden bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 border-b-2 border-amber-500/40 text-slate-950 shadow-md z-50 select-none py-2 px-3"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Fixed Eye-catching Supervisor Badge */}
        <div className="shrink-0 flex items-center gap-2 bg-slate-950 text-amber-300 px-3 py-1 rounded-full shadow-sm border border-amber-400/40 text-xs sm:text-sm font-black">
          <Award className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>إشراف: أ. عواطف البهلال</span>
        </div>

        {/* Smooth Moving Ticker Track */}
        <div className="flex-1 overflow-hidden relative" dir="ltr">
          <div className="animate-marquee-left flex items-center gap-8 whitespace-nowrap">
            {announcements.map((text, idx) => (
              <span
                key={idx}
                dir="rtl"
                className="inline-flex items-center gap-2 text-xs sm:text-sm md:text-base font-black text-slate-950 tracking-wide"
              >
                <Sparkles className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>{text}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900/60 inline-block mx-2" />
              </span>
            ))}
          </div>
        </div>

        {/* Secondary Title Badge on larger screens */}
        <div className="hidden md:flex shrink-0 items-center gap-1.5 bg-emerald-900 text-white px-3 py-1 rounded-full text-xs font-bold border border-emerald-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>أمينة مصادر التعلم</span>
        </div>
      </div>
    </div>
  );
}
