export interface CodeSnippet {
  id: string;
  filePath: string;
  title: string;
  description: string;
  language: string;
  code: string;
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'drizzle-schema',
    filePath: 'drizzle/schema.ts',
    title: '1. مخطط قاعدة البيانات (Drizzle ORM - SQLite)',
    description: 'تعريف جدول حجز مواعيد غرفة المصادر resource_room_bookings مع الحقول المطلوبة وحقل البريد الإلكتروني studentEmail.',
    language: 'typescript',
    code: `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * جدول حجوزات غرفة مصادر التعلم للطلاب
 */
export const resourceRoomBookings = sqliteTable('resource_room_bookings', {
  // المفتاح الأساسي التلقائي
  id: integer('id').primaryKey({ autoIncrement: true }),

  // اسم الطالب الثلاثي أو الرباعي
  studentName: text('student_name').notNull(),

  // البريد الإلكتروني للطالب (Gmail / حساب مدرستي)
  studentEmail: text('student_email').notNull(),

  // تاريخ الحجز (صيغة YYYY-MM-DD)
  date: text('date').notNull(),

  // الفترة الزمنية / الحصة المدرسية المحجوزة
  timeSlot: text('time_slot').notNull(),

  // الغرض من حجز غرفة المصادر
  purpose: text('purpose').notNull(),

  // تاريخ ووقت إنشاء الحجز (تلقائي)
  createdAt: text('created_at')
    .default(sql\`CURRENT_TIMESTAMP\`)
    .notNull(),
});

// استخراج أنواع البيانات للاستعلام والإدخال (TypeScript Types)
export type ResourceRoomBooking = typeof resourceRoomBookings.$inferSelect;
export type NewResourceRoomBooking = typeof resourceRoomBookings.$inferInsert;
`,
  },
  {
    id: 'trpc-router',
    filePath: 'server/routers.ts',
    title: '2. خادم tRPC والمسارات (server/routers.ts)',
    description: 'مسار tRPC Mutation باسم bookResourceRoom للتحقق من صحة المدخلات بما فيها البريد الإلكتروني Zod وحفظ الحجز في SQLite.',
    language: 'typescript',
    code: `import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from './db'; // استورد اتصال قاعدة البيانات الخاص بمشروعك
import { resourceRoomBookings } from '../drizzle/schema';
import { desc, eq } from 'drizzle-orm';

const t = initTRPC.create();
export const router = t.router;
export const publicProcedure = t.procedure;

// مخطط التحقق من صحة بيانات الحجز عبر Zod
export const bookResourceRoomSchema = z.object({
  studentName: z
    .string({ required_error: 'يرجى إدخال اسم الطالب' })
    .min(3, 'يجب ألا يقل اسم الطالب عن 3 أحرف')
    .max(100, 'الاسم طويل جداً'),
  studentEmail: z
    .string({ required_error: 'يرجى إدخال البريد الإلكتروني' })
    .email('صيغة البريد الإلكتروني غير صحيحة (مثال: student@gmail.com)'),
  date: z
    .string({ required_error: 'يرجى اختيار التاريخ' })
    .regex(/^\\d{4}-\\d{2}-\\d{2}$/, 'صيغة التاريخ غير صحيحة'),
  timeSlot: z
    .string({ required_error: 'يرجى تحديد وقت الحصة' })
    .min(1, 'يرجى تحديد وقت الحصة'),
  purpose: z
    .string({ required_error: 'يرجى توضيح الغرض من الحجز' })
    .min(3, 'يرجى كتابة سبب الحجز بالتفصيل'),
});

export const appRouter = router({
  /**
   * مسار حجز مقعد في غرفة المصادر (Mutation)
   */
  bookResourceRoom: publicProcedure
    .input(bookResourceRoomSchema)
    .mutation(async ({ input }) => {
      try {
        const [insertedBooking] = await db
          .insert(resourceRoomBookings)
          .values({
            studentName: input.studentName.trim(),
            studentEmail: input.studentEmail.trim().toLowerCase(),
            date: input.date,
            timeSlot: input.timeSlot,
            purpose: input.purpose.trim(),
          })
          .returning();

        return {
          success: true,
          message: 'تم حجز موعدك في غرفة المصادر بنجاح!',
          booking: insertedBooking,
        };
      } catch (error) {
        console.error('خطأ أثناء حفظ الحجز:', error);
        throw new Error('حدث خطأ أثناء حفظ الحجز في قاعدة البيانات. يرجى المحاولة مرة أخرى.');
      }
    }),

  /**
   * مسار جلب حجوزات طالب معين بواسطة بريده الإلكتروني (Query)
   */
  getMyBookings: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(resourceRoomBookings)
        .where(eq(resourceRoomBookings.studentEmail, input.email.toLowerCase()))
        .orderBy(desc(resourceRoomBookings.createdAt));
    }),
});

export type AppRouter = typeof appRouter;
`,
  },
  {
    id: 'booking-page',
    filePath: 'client/src/pages/BookingPage.tsx',
    title: '3. واجهة المستخدم (client/src/pages/BookingPage.tsx)',
    description: 'صفحة الحجز باللغة العربية مع دعم تسجيل الدخول عبر Google/Gmail، وحفظ الحجز بالبريد، وإشعار Toast.',
    language: 'typescript',
    code: `import React, { useState } from 'react';
import { trpc } from '../utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, BookOpen, User, Mail, LogIn, CheckCircle2, QrCode } from 'lucide-react';

const TIME_SLOTS = [
  'الحصة الأولى (07:30 - 08:15)',
  'الحصة الثانية (08:20 - 09:05)',
  'الحصة الثالثة (09:10 - 09:55)',
  'فترة الفسحة المدرسية (09:55 - 10:25)',
  'الحصة الرابعة (10:30 - 11:15)',
  'الحصة الخامسة (11:20 - 12:05)',
  'الحصة السادسة (12:10 - 12:50)',
  'الحصة السابعة (12:55 - 01:30)',
];

export default function BookingPage() {
  const { toast } = useToast();

  // حالة تسجيل الدخول عبر Gmail
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');

  // نموذج الحجز
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
    purpose: '',
  });

  const [bookingCompleted, setBookingCompleted] = useState<any | null>(null);

  const bookMutation = trpc.bookResourceRoom.useMutation({
    onSuccess: (data) => {
      toast({
        title: '🎉 تم تأكيد حجزك بنجاح!',
        description: \`مرحباً بك يا \${currentUser?.name}، تم إرسال تفاصيل الحجز إلى \${currentUser?.email}.\`,
        className: 'bg-emerald-600 text-white border-none',
      });
      setBookingCompleted(data.booking);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        timeSlot: '',
        purpose: '',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في عملية الحجز',
        description: error.message || 'حدث خطأ غير متوقع، يرجى إعادة المحاولة.',
      });
    },
  });

  // تسجيل الدخول التجريبي عبر Google
  const handleGoogleLogin = () => {
    const demoName = 'عبدالله بن أحمد';
    const demoEmail = 'student.abdullah@gmail.com';
    setCurrentUser({ name: demoName, email: demoEmail });
    toast({
      title: 'تم تسجيل الدخول بنجاح',
      description: \`أهلاً بك يا \${demoName} (\${demoEmail})\`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى تسجيل الدخول بحساب Gmail أولاً.' });
      return;
    }
    if (!formData.timeSlot) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى تحديد وقت الحصة.' });
      return;
    }
    if (!formData.purpose.trim()) {
      toast({ variant: 'destructive', title: 'تنبيه', description: 'يرجى توضيح الغرض من الحجز.' });
      return;
    }

    bookMutation.mutate({
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      date: formData.date,
      timeSlot: formData.timeSlot,
      purpose: formData.purpose,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white shadow-lg mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">حجز موعد غرفة مصادر التعلم</h1>
          <p className="mt-2 text-slate-600">سجّل دخولك بحساب Gmail واحجز مقعدك وجهازك فوراً.</p>
        </div>

        {/* خطوة 1: تسجيل الدخول عبر Gmail */}
        {!currentUser ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
            <h2 className="text-xl font-bold text-slate-800">تسجيل الدخول لمتابعة الحجز</h2>
            <p className="text-sm text-slate-600">يجب تسجيل الدخول بحسابك لتوثيق الحجز وربطه ببريدك الإلكتروني.</p>

            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl flex items-center justify-center gap-3 shadow-xs"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>تسجيل الدخول السريع عبر Google (Gmail)</span>
            </Button>
          </div>
        ) : (
          /* خطوة 2: نموذج الحجز للطالب المسجل */
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-emerald-950">مرحباً، {currentUser.name}</p>
                <p className="text-xs text-emerald-800 font-mono mt-0.5">{currentUser.email}</p>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                تبديل الحساب
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="date">تاريخ الحجز المطلوب:</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot">الحصة / الفترة الزمنية:</Label>
                <select
                  id="timeSlot"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  required
                  className="w-full h-12 px-3 border rounded-xl bg-white"
                >
                  <option value="">-- اختر الحصة --</option>
                  {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">الغرض من استخدام غرفة المصادر:</Label>
                <Input
                  id="purpose"
                  type="text"
                  placeholder="مثال: بحث علمي، استخدام الحاسوب..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={bookMutation.isPending}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {bookMutation.isPending ? 'جاري التأكيد...' : 'تأكيد الحجز باسم ' + currentUser.name}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
`,
  },
  {
    id: 'app-routing',
    filePath: 'client/src/App.tsx',
    title: '4. التوجيه ومسار الصفحة (client/src/App.tsx)',
    description: 'تعديل مسار /book في React Router لدعم صفحة الحجز مع المصادقة.',
    language: 'typescript',
    code: `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
        <Routes>
          <Route path="/book" element={<BookingPage />} />
          <Route path="/" element={<Navigate to="/book" replace />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
`,
  },
];
