import React from 'react';
import { useCustomLogo } from '../lib/logoStorage';
import { GraduationCap, BookOpen, Building } from 'lucide-react';

interface MinistryLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  showText?: boolean;
}

/**
 * Renders the official Saudi Ministry of Education / School Logo.
 * Uses the user's uploaded official image if available, or a clean institutional mark.
 */
export default function MinistryLogo({
  className = 'h-12 w-auto',
  variant = 'light',
  showText = true,
}: MinistryLogoProps) {
  const { logoUrl } = useCustomLogo();
  const effectiveLogoUrl = logoUrl || '/logo.png';
  const isLight = variant === 'light';
  const textColor = isLight ? '#ffffff' : '#0f172a';
  const subTextColor = isLight ? '#cbd5e1' : '#475569';

  // Always display the official school/ministry logo
  if (effectiveLogoUrl) {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`} dir="rtl">
        <div className="h-full flex items-center justify-center max-h-16">
          <img
            src={effectiveLogoUrl}
            alt="شعار وزارة التعليم الرسمي"
            className="h-full max-h-14 w-auto object-contain rounded-md"
          />
        </div>

        {showText && (
          <div className="flex flex-col text-right justify-center">
            <span
              className="text-[10px] font-medium tracking-wide opacity-90 leading-none"
              style={{ color: subTextColor }}
            >
              المملكة العربية السعودية
            </span>
            <span
              className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5"
              style={{ color: textColor }}
            >
              وزارة التعليم
            </span>
            <span
              className="text-[9px] font-semibold tracking-wider uppercase opacity-80 leading-none mt-0.5 font-sans"
              style={{ color: subTextColor }}
            >
              Ministry of Education
            </span>
          </div>
        )}
      </div>
    );
  }

  // Clean institutional emblem fallback
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`} dir="rtl">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
          isLight
            ? 'bg-white/15 border-white/25 text-white'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}
      >
        <BookOpen className="w-6 h-6 stroke-[2.2]" />
      </div>

      {showText && (
        <div className="flex flex-col text-right justify-center">
          <span
            className="text-[10px] font-medium tracking-wide opacity-90 leading-none"
            style={{ color: subTextColor }}
          >
            المملكة العربية السعودية
          </span>
          <span
            className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5"
            style={{ color: textColor }}
          >
            وزارة التعليم
          </span>
          <span
            className="text-[9px] font-semibold tracking-wider uppercase opacity-80 leading-none mt-0.5 font-sans"
            style={{ color: subTextColor }}
          >
            Ministry of Education
          </span>
        </div>
      )}
    </div>
  );
}
