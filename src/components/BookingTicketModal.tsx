import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Booking } from '../types/booking';
import { formatArabicDate } from '../lib/storage';
import { CheckCircle, Printer, X, Calendar, Clock, BookOpen, User, Hash, Share2 } from 'lucide-react';
import { useToast } from './ui/Toast';

interface BookingTicketModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export default function BookingTicketModal({ booking, onClose }: BookingTicketModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!booking) return;

    const qrPayload = JSON.stringify({
      ticket: booking.ticketNumber,
      student: booking.studentName,
      date: booking.date,
      slot: booking.timeSlot,
      purpose: booking.purpose,
    });

    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code generation error:', err));
  }, [booking]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `تذكرة حجز غرفة مصادر التعلم\nالمعلم/المعلمة: ${booking.studentName}\nالموعد: ${booking.date} (${booking.timeSlot})\nرقم الحجز: ${booking.ticketNumber}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({
        title: 'تم نسخ بيانات التذكرة',
        description: 'يمكنك الآن إرسالها أو لصقها في أي مكان.',
        variant: 'success',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors no-print"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-200" />
          </div>
          <h2 className="text-2xl font-black">بطاقة حجز غرفة المصادر</h2>
          <p className="text-emerald-100 text-sm mt-1">بطاقة حجز معتمدة للمعلمين</p>
        </div>

        {/* Ticket body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Ticket Number Badge */}
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>رقم التذكرة:</span>
            </div>
            <span className="font-mono text-lg font-black text-emerald-800 tracking-wider">
              {booking.ticketNumber}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>اسم المعلم / المعلمة:</span>
              </div>
              <p className="font-bold text-slate-800">{booking.studentName}</p>
              {booking.studentEmail && (
                <span className="text-[11px] text-emerald-700 font-mono mt-0.5 block truncate" dir="ltr">
                  {booking.studentEmail}
                </span>
              )}
              {booking.grade && <span className="text-xs text-slate-500 mt-0.5 block">{booking.grade}</span>}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>تاريخ الزيارة:</span>
              </div>
              <p className="font-bold text-slate-800">{booking.date}</p>
              <span className="text-xs text-slate-500 mt-0.5 block">{formatArabicDate(booking.date)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>الفترة / الحصة:</span>
              </div>
              <p className="font-bold text-slate-800">{booking.timeSlot}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>الغرض:</span>
              </div>
              <p className="font-bold text-slate-800 line-clamp-2">{booking.purpose}</p>
            </div>
          </div>

          {/* QR Code Verification */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="رمز التحقق" className="w-36 h-36 rounded-lg bg-white p-1 border shadow-xs" />
            ) : (
              <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-lg" />
            )}
            <p className="text-xs text-slate-500 mt-2 text-center font-medium">
              أبرز هذا الباركود لأمين مصادر التعلم عند دخول القاعة
            </p>
          </div>

          {/* Instructions */}
          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200/70 p-3 rounded-xl leading-relaxed">
            <span className="font-bold text-amber-800">تنبيهات الحضور:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-900/90">
              <li>يرجى التواجد في الموعد المحدد قبل بدء الحصة بخمس دقائق.</li>
              <li>الالتزام بالهدوء والمحافظة على أجهزة الحاسوب والكتب المدرسية.</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3 justify-end no-print">
          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>مشاركة التذكرة</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>طباعة التذكرة</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
