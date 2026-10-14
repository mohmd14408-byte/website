export type BookingStatus = 'confirmed' | 'attended' | 'cancelled' | 'absent';

export interface StudentUser {
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
}

export interface Booking {
  id: string | number;
  studentName: string;
  studentEmail: string; // البريد الإلكتروني (Gmail / Google)
  studentId?: string;
  grade?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "08:20 - 09:05 (الحصة الثانية)"
  purpose: string;
  notes?: string;
  createdAt: string; // ISO string
  status: BookingStatus;
  ticketNumber: string;
}

export interface TimeSlotConfig {
  id: string;
  name: string;
  time: string;
  capacity: number;
}

export const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: 'period-1', name: 'الحصة الأولى', time: '07:30 - 08:15', capacity: 15 },
  { id: 'period-2', name: 'الحصة الثانية', time: '08:20 - 09:05', capacity: 15 },
  { id: 'period-3', name: 'الحصة الثالثة', time: '09:10 - 09:55', capacity: 15 },
  { id: 'period-break', name: 'فترة الفسحة المدرسية', time: '09:55 - 10:25', capacity: 20 },
  { id: 'period-4', name: 'الحصة الرابعة', time: '10:30 - 11:15', capacity: 15 },
  { id: 'period-5', name: 'الحصة الخامسة', time: '11:20 - 12:05', capacity: 15 },
  { id: 'period-6', name: 'الحصة السادسة', time: '12:10 - 12:50', capacity: 15 },
  { id: 'period-7', name: 'الحصة السابعة', time: '12:55 - 01:30', capacity: 15 },
];

export const PURPOSE_PRESETS = [
  'تنفيذ درس تطبيقي / نموذجي تفاعلي',
  'عرض مرئي أو سينما تعليمية للصف',
  'تدريب الطلاب على برامج الحاسوب والتقنية',
  'إجراء مسابقة أو نشاط منهجي وتفاعلي',
  'جلسة مجتمع تعلم مهني (PLC) واجتماع قسم',
  'استخدام الشاشة التفاعلية وأجهزة العرض',
  'استعارة مراجع وحقائب تدريسية',
];

export const GRADE_PRESETS = [
  'قسم العلوم الطبيعية (فيزياء / كيمياء / أحياء)',
  'قسم الرياضيات',
  'قسم اللغة العربية والتربية الإسلامية',
  'قسم اللغة الإنجليزية',
  'قسم الحاسب الآلي والتقنية الرقمية',
  'قسم الدراسات الاجتماعية والمواطنة',
  'قسم المهارات الحياتية والتربية الفنية/البدنية',
  'التوجيه الطلابي والإرشاد الأكاديمي',
];

export const EQUIPMENT_PRESETS = [
  'شاشة تفاعلية ذكية (Smart Board)',
  'جهاز عرض داتا شو (Projector)',
  'أجهزة لوحية / آيباد للطلاب',
  'معمل أجهزة حاسب آلي مكتبي',
  'نظام صوتي وميكروفون لاسلكي',
  'شبكة إنترنت سريعة مخصصة للدرس',
];

export interface SchoolDayInfo {
  name: string; // e.g. الأحد
  date: string; // YYYY-MM-DD
  formatted: string; // e.g. 15 أكتوبر
  isToday: boolean;
}
