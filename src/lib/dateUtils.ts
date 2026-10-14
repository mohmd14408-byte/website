import { SchoolDayInfo } from '../types/booking';

/**
 * Returns the Sunday-to-Thursday dates for a week containing the given reference date.
 * If reference date is on a Friday or Saturday, it computes the upcoming school week starting Sunday.
 */
export function getSchoolWeekDays(refDateStr?: string): SchoolDayInfo[] {
  let ref: Date;
  if (refDateStr) {
    const parts = refDateStr.split('-');
    ref = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    ref = new Date();
  }

  const dayOfWeek = ref.getDay(); // 0 is Sunday, 1 Monday, ... 4 Thursday, 5 Friday, 6 Saturday
  let diffToSunday = 0;

  if (dayOfWeek === 5) {
    // Friday -> upcoming Sunday is +2 days
    diffToSunday = 2;
  } else if (dayOfWeek === 6) {
    // Saturday -> upcoming Sunday is +1 day
    diffToSunday = 1;
  } else {
    // Sunday (0) to Thursday (4) -> Sunday is -dayOfWeek
    diffToSunday = -dayOfWeek;
  }

  const sunday = new Date(ref);
  sunday.setDate(ref.getDate() + diffToSunday);

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const todayStr = getTodayIsoDate();

  const days: SchoolDayInfo[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;

    days.push({
      name: dayNames[i],
      date: iso,
      formatted: `${d.getDate()} ${monthNamesArabic[d.getMonth()]}`,
      isToday: iso === todayStr,
    });
  }

  return days;
}

export function getTodayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addWeeksToDate(dateStr: string, weeksCount: number): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + weeksCount * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
