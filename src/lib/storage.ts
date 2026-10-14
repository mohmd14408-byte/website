import { Booking, StudentUser, BookingStatus } from '../types/booking';

const STORAGE_KEY = 'resource_room_bookings_v2';
const USER_KEY = 'resource_room_student_user_v1';
const CLOUD_CONFIG_KEY = 'resource_room_cloud_config_v1';

export const DEFAULT_CLOUD_INDEX_ID = 'local-server-sync';
export const CLOUD_API_BASE = '/api/bookings';

export interface CloudSyncStatus {
  isConnected: boolean;
  lastSyncTime: string | null;
  cloudId: string;
  error?: string | null;
}

let currentCloudStatus: CloudSyncStatus = {
  isConnected: true,
  lastSyncTime: null,
  cloudId: DEFAULT_CLOUD_INDEX_ID,
  error: null,
};

export function getCloudSyncStatus(): CloudSyncStatus {
  return { ...currentCloudStatus };
}

function updateCloudStatus(patch: Partial<CloudSyncStatus>) {
  currentCloudStatus = { ...currentCloudStatus, ...patch };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cloud-status-updated', { detail: currentCloudStatus }));
  }
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatArabicDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function generateTicketNumber(): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `RR-${randomPart}`;
}

const INITIAL_SEED_BOOKINGS: Booking[] = [];

// Local cache reader (instant synchronous access for initial UI render)
export function getStoredBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return INITIAL_SEED_BOOKINGS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_BOOKINGS;
  } catch {
    return INITIAL_SEED_BOOKINGS;
  }
}

function setLocalBookings(bookings: Booking[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event('bookings-updated'));
}

export function getCloudIndexId(): string {
  return DEFAULT_CLOUD_INDEX_ID;
}

export function setCustomCloudIndexId(_id: string) {
  // no-op for server-backed storage
}

// Fetch all bookings from Server Backend
export async function fetchBookingsFromServer(): Promise<Booking[]> {
  try {
    const res = await fetch('/api/bookings', { credentials: 'omit' });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const serverBookings: Booking[] = await res.json();
    if (Array.isArray(serverBookings)) {
      setLocalBookings(serverBookings);
      updateCloudStatus({
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('ar-SA'),
        error: null,
      });
      return serverBookings;
    }
    return getStoredBookings();
  } catch (err: any) {
    console.warn('Server sync warning, using local cache:', err);
    updateCloudStatus({
      isConnected: false,
      error: err?.message || 'تعذر الاتصال بالخادم',
    });
    return getStoredBookings();
  }
}

// Save booking to Server Backend and local cache
export async function saveBookingAsync(
  newBooking: Omit<Booking, 'id' | 'createdAt' | 'ticketNumber' | 'status'>
): Promise<Booking> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
      credentials: 'omit',
    });

    if (res.ok) {
      const created: Booking = await res.json();
      updateCloudStatus({
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('ar-SA'),
        error: null,
      });
      
      // Update local cache
      const local = getStoredBookings().filter((b) => b.id !== created.id);
      setLocalBookings([created, ...local]);
      return created;
    } else {
      throw new Error('فشل حفظ الحجز في الخادم');
    }
  } catch (err: any) {
    console.warn('Server save error, caching locally:', err);
    updateCloudStatus({
      isConnected: false,
      error: err?.message || 'تعذر حفظ الحجز',
    });

    // Fallback local save
    const ticketNumber = generateTicketNumber();
    const created: Booking = {
      ...newBooking,
      id: Date.now(),
      ticketNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    const local = getStoredBookings();
    setLocalBookings([created, ...local]);
    return created;
  }
}

// Synchronous wrapper
export function saveBooking(
  newBooking: Omit<Booking, 'id' | 'createdAt' | 'ticketNumber' | 'status'>
): Booking {
  saveBookingAsync(newBooking).catch((e) => console.warn('Background save error:', e));

  const ticketNumber = generateTicketNumber();
  const created: Booking = {
    ...newBooking,
    id: Date.now(),
    ticketNumber,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  const local = getStoredBookings();
  setLocalBookings([created, ...local]);
  return created;
}

// Update booking status on Server Backend
export async function updateBookingStatusAsync(id: string | number, status: BookingStatus): Promise<void> {
  // Update local cache immediately
  const local = getStoredBookings();
  const updated = local.map((b) => (b.id === id ? { ...b, status } : b));
  setLocalBookings(updated);

  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'omit',
    });
    if (res.ok) {
      updateCloudStatus({
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('ar-SA'),
      });
    }
  } catch (err) {
    console.warn('Server status update notice:', err);
  }
}

export function updateBookingStatus(id: string | number, status: BookingStatus): void {
  updateBookingStatusAsync(id, status);
}

// Delete booking from Server Backend
export async function deleteBookingAsync(id: string | number): Promise<void> {
  const local = getStoredBookings().filter((b) => b.id !== id);
  setLocalBookings(local);

  try {
    await fetch(`/api/bookings/${id}`, { method: 'DELETE', credentials: 'omit' });
    updateCloudStatus({
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString('ar-SA'),
    });
  } catch (err) {
    console.warn('Server delete notice:', err);
  }
}

export function deleteBooking(id: string | number): void {
  deleteBookingAsync(id);
}

// Reset bookings
export async function resetToSeedAsync(): Promise<void> {
  setLocalBookings(INITIAL_SEED_BOOKINGS);
  try {
    await fetch('/api/bookings/reset', { method: 'POST', credentials: 'omit' });
    updateCloudStatus({
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString('ar-SA'),
    });
  } catch (err) {
    console.warn('Server reset notice:', err);
  }
}

export function resetToSeed(): void {
  resetToSeedAsync();
}

// User Session Management (Gmail / Google)
export function getStoredUser(): StudentUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: StudentUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}
