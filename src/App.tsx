import React, { useState, useEffect } from 'react';
import Navbar, { NavTab } from './components/Navbar';
import BookingForm from './components/BookingForm';
import QRCodePoster from './components/QRCodePoster';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import TopAnnouncementBar from './components/TopAnnouncementBar';
import { ToastProvider, useToast } from './components/ui/Toast';
import { getStoredBookings, getStoredUser, fetchBookingsFromServer } from './lib/storage';
import {
  isAdminAuthenticated,
  logoutAdmin,
  isSupervisorEmail,
  loginAdminByEmail,
  checkUrlForSupervisorAccess,
  loginAdminByToken,
  SUPERVISOR_SECRET_TOKEN,
} from './lib/auth';
import { BookOpen, Sparkles, QrCode, Lock, ShieldCheck } from 'lucide-react';

function AppContent() {
  // Check if supervisor access is requested or already authenticated
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (checkUrlForSupervisorAccess()) return true;
    if (isAdminAuthenticated()) return true;

    const user = getStoredUser();
    if (user && isSupervisorEmail(user.email)) {
      loginAdminByEmail(user.email);
      return true;
    }
    return false;
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  
  // Initialize tab directly to admin if supervisor link was used
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      if (checkUrlForSupervisorAccess()) return 'admin';
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'admin' || hash === 'supervisor' || hash === 'schedule') {
        loginAdminByToken();
        return 'admin';
      }
      if (hash === 'poster') {
        if (isAdminAuthenticated()) return 'poster';
      }
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes('/supervisor') || pathname.includes('/admin') || pathname.includes('/schedule')) {
        loginAdminByToken();
        return 'admin';
      }
    }
    return 'book';
  });

  const [bookingCount, setBookingCount] = useState<number>(0);

  // Sync hash routing & supervisor protection
  useEffect(() => {
    // 1. Check URL for supervisor entry on load
    if (checkUrlForSupervisorAccess()) {
      setIsAdmin(true);
      setActiveTab('admin');
      if (window.location.hash !== '#admin') {
        window.history.replaceState(null, '', '#admin');
      }
    }

    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '').toLowerCase();
      // Handle query strings inside hash e.g. #admin?supervisor=9988
      const hash = rawHash.split('?')[0].split('&')[0] as NavTab;

      if (hash === 'admin' || rawHash.includes('supervisor') || rawHash.includes('schedule')) {
        if (checkUrlForSupervisorAccess() || isAdminAuthenticated()) {
          setIsAdmin(true);
          setActiveTab('admin');
        } else {
          // If trying to access admin tab directly without supervisor credentials, prompt PIN modal
          setIsAdminModalOpen(true);
          setActiveTab('book');
        }
      } else if (hash === 'poster') {
        if (isAdminAuthenticated() || checkUrlForSupervisorAccess()) {
          setIsAdmin(true);
          setActiveTab('poster');
        } else {
          setIsAdminModalOpen(true);
          setActiveTab('book');
        }
      } else {
        setActiveTab('book');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    setBookingCount(getStoredBookings().length);

    // Sync count with server
    fetchBookingsFromServer().then((data) => {
      if (Array.isArray(data)) setBookingCount(data.length);
    }).catch(() => setBookingCount(0));

    const handleUpdate = () => {
      setBookingCount(getStoredBookings().length);
    };
    window.addEventListener('bookings-updated', handleUpdate);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('bookings-updated', handleUpdate);
    };
  }, []);

  const handleTabChange = (tab: NavTab) => {
    if (['poster', 'admin'].includes(tab) && !isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setActiveTab('admin');
    window.location.hash = 'admin';
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setActiveTab('book');
    window.location.hash = 'book';
  };

  const handleDataRefresh = () => {
    setBookingCount(getStoredBookings().length);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Topmost Animated Announcement Ribbon */}
      <TopAnnouncementBar />

      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        bookingCount={bookingCount}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'book' && (
          <BookingForm
            onBookingSuccess={handleDataRefresh}
            onRequestAdminLogin={() => setIsAdminModalOpen(true)}
            onSupervisorLogin={() => {
              setIsAdmin(true);
              setActiveTab('admin');
              window.location.hash = 'admin';
            }}
          />
        )}

        {/* Protected Views: ONLY visible to the Authenticated Supervisor */}
        {isAdmin && activeTab === 'poster' && <QRCodePoster />}

        {(isAdmin || activeTab === 'admin') && activeTab === 'admin' && (
          <AdminDashboard onRefreshData={handleDataRefresh} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نظام حجز مواعيد غرفة مصادر التعلم المدرسية • مخصص للمعلمين والمعلمات وإدارة المدرسة</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {!isAdmin ? (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>دخول أمين المصادر (المشرف)</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>أنت في وضع المشرف (كامل الصلاحيات مفعلة)</span>
                </span>
                <button
                  onClick={handleAdminLogout}
                  className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
                >
                  تسجيل خروج
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Supervisor Login PIN Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
