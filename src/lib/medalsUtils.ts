import { Booking } from '../types/booking';

export type MedalTier = 'gold' | 'silver' | 'bronze' | null;

export interface TeacherMedalInfo {
  teacherName: string;
  count: number;
  tier: MedalTier;
  tierTitle: string;
  tierColor: string;
  tierBadgeBg: string;
  tierBorder: string;
  icon: string;
  department?: string;
  bookings: Booking[];
}

/**
 * Calculates teacher medal tier based on weekly reservation count:
 * - 5 to 6+ times per week: Gold Medal (ميدالية ذهبية)
 * - 3 to 4 times per week: Silver Medal (ميدالية فضية)
 * - 2 times per week: Bronze Medal (ميدالية برونزية)
 * - Less than 2: No medal
 */
export function getMedalTierForCount(count: number): MedalTier {
  if (count >= 5) {
    return 'gold';
  }
  if (count >= 3 && count <= 4) {
    return 'silver';
  }
  if (count === 2) {
    return 'bronze';
  }
  return null;
}

export function getMedalDetails(tier: MedalTier) {
  switch (tier) {
    case 'gold':
      return {
        tier: 'gold' as const,
        title: 'الميدالية الذهبية',
        subtitle: '٥ - ٦ حصص / أسبوع (أعلى تميز)',
        icon: '🥇',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        cardClass: 'bg-gradient-to-br from-amber-50 to-yellow-100/70 border-amber-300 text-amber-950 shadow-sm',
        ribbonColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.25)',
      };
    case 'silver':
      return {
        tier: 'silver' as const,
        title: 'الميدالية الفضية',
        subtitle: '٣ - ٤ حصص / أسبوع (تميز رائع)',
        icon: '🥈',
        badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
        cardClass: 'bg-gradient-to-br from-slate-50 to-slate-100/90 border-slate-300 text-slate-800 shadow-sm',
        ribbonColor: '#94a3b8',
        glowColor: 'rgba(148, 163, 184, 0.25)',
      };
    case 'bronze':
      return {
        tier: 'bronze' as const,
        title: 'الميدالية البرونزية',
        subtitle: 'حصتان / أسبوع (نشاط مستمر)',
        icon: '🥉',
        badgeClass: 'bg-amber-900/10 text-amber-800 border-amber-700/30',
        cardClass: 'bg-gradient-to-br from-orange-50/70 to-amber-100/40 border-amber-700/30 text-amber-900 shadow-sm',
        ribbonColor: '#b45309',
        glowColor: 'rgba(180, 83, 9, 0.2)',
      };
    default:
      return null;
  }
}

/**
 * Computes weekly medal standings for all teachers who booked during a given week
 */
export function computeWeeklyTeacherMedals(weekBookings: Booking[]): TeacherMedalInfo[] {
  const teacherMap: Record<string, { bookings: Booking[]; department?: string }> = {};

  for (const b of weekBookings) {
    const name = b.studentName?.trim() || 'معلمة غير محددة';
    if (!teacherMap[name]) {
      teacherMap[name] = {
        bookings: [],
        department: b.grade,
      };
    }
    teacherMap[name].bookings.push(b);
  }

  const results: TeacherMedalInfo[] = [];

  for (const [teacherName, data] of Object.entries(teacherMap)) {
    const count = data.bookings.length;
    const tier = getMedalTierForCount(count);
    const details = getMedalDetails(tier);

    results.push({
      teacherName,
      count,
      tier,
      tierTitle: details ? details.title : 'مشاركة فردية (حصة واحدة)',
      tierColor: details ? details.ribbonColor : '#64748b',
      tierBadgeBg: details ? details.badgeClass : 'bg-slate-100 text-slate-600 border-slate-200',
      tierBorder: details ? details.cardClass : '',
      icon: details ? details.icon : '✨',
      department: data.department,
      bookings: data.bookings,
    });
  }

  // Sort: highest count first
  return results.sort((a, b) => b.count - a.count);
}
