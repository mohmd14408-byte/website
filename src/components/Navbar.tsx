import React from 'react';
import MinistryLogo from './MinistryLogo';
import {
  BookOpen,
  CalendarCheck,
  QrCode,
  LayoutDashboard,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'book' | 'poster' | 'admin';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  bookingCount: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export default function Navbar({
  activeTab,
  onTabChange,
  bookingCount,
  isAdmin,
  onOpenAdminLogin,
  onAdminLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs no-print" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:h-20 gap-3">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <MinistryLogo variant="dark" className="h-10 hidden sm:inline-flex" />
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    نظام حجز غرفة المصادر
                  </h1>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      وضع المشرف العام
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      بوابة المعلمين
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isAdmin ? 'التحكم الكامل بالحجوزات واللافتة المعتمدة' : 'حجز المعلمين للحصص والقاعة والأجهزة'}
                </p>
              </div>
            </div>

            {/* Mobile Admin button if not logged in */}
            {!isAdmin && (
              <button
                onClick={onOpenAdminLogin}
                className="sm:hidden text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer font-bold"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>دخول المشرف</span>
              </button>
            )}
          </div>

          {/* Navigation Controls: STRICT SEPARATION */}
          {isAdmin ? (
            /* ADMIN CONTROLS (Only visible to the Supervisor) */
            <nav className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => onTabChange('admin')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 cursor-pointer relative ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>لوحة الإشراف</span>
                {bookingCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950">
                    {bookingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onTabChange('poster')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'poster'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>لافتة الباركود</span>
              </button>

              <button
                onClick={() => onTabChange('book')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>نموذج حجز المعلمين</span>
              </button>

              <button
                onClick={onAdminLogout}
                className="px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                title="تسجيل خروج المشرف والعودة لوضع المعلم"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </nav>
          ) : (
            /* STUDENT VIEW: Clean, Simple, NO ADMIN PRIVILEGES FOR PUBLIC */
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>دخول أمين المصادر (المشرف)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
