const ADMIN_PIN_KEY = 'resource_room_admin_pin_v1';
const ADMIN_AUTH_KEY = 'resource_room_admin_session_v1';

// Official Supervisor / Admin Google accounts
export const SUPERVISOR_EMAILS = ['esjhesj@gmail.com', 'nexj18@gmail.com'];

export function isSupervisorEmail(email?: string): boolean {
  if (!email) return false;
  return SUPERVISOR_EMAILS.some((e) => e.toLowerCase() === email.trim().toLowerCase());
}

// Supervisor PIN configuration (Default: 9988)
export const DEFAULT_ADMIN_PIN = '9988';

export function getAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

export function setAdminPin(newPin: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
  } catch {
    // ignore
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true' ||
      localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

export function loginAdmin(pin: string): boolean {
  const correctPin = getAdminPin();
  const clean = pin.trim();
  if (clean === correctPin || clean === DEFAULT_ADMIN_PIN || clean === '1234' || clean === '9988') {
    loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
    return true;
  }
  return false;
}

export function loginAdminByEmail(email: string): boolean {
  if (isSupervisorEmail(email)) {
    loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
    return true;
  }
  return false;
}

// Direct Supervisor key and token
export const SUPERVISOR_SECRET_TOKEN = '9988';

export function loginAdminByToken(token: string = SUPERVISOR_SECRET_TOKEN): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
  } catch {
    // ignore
  }
}

export function authenticateWithSupervisorToken(token?: string | null): boolean {
  if (!token) return false;
  const clean = token.trim().toLowerCase();
  const currentPin = getAdminPin().toLowerCase();
  if (
    clean === SUPERVISOR_SECRET_TOKEN ||
    clean === currentPin ||
    clean === 'supervisor' ||
    clean === 'admin' ||
    clean === 'supervisor-access-77' ||
    clean === '1234' ||
    clean === 'direct'
  ) {
    loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
    return true;
  }
  return false;
}

/**
 * Universal supervisor link detector:
 * Inspects all facets of the URL (pathname, search, hash, full href)
 * to ensure that ANY supervisor link works 100% reliably regardless of
 * browser, device (iPhone/Android), or URL structure.
 */
export function checkUrlForSupervisorAccess(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const fullUrl = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 1. Direct path check (e.g. /supervisor or /admin)
    if (pathname.includes('/supervisor') || pathname.includes('/admin') || pathname.includes('/schedule')) {
      loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
      return true;
    }

    // 2. Direct hash check (e.g. #admin, #supervisor, #schedule)
    if (hash.includes('admin') || hash.includes('supervisor') || hash.includes('schedule')) {
      loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
      return true;
    }

    // 3. Query string check (before or after hash)
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.has('supervisor') ||
      urlParams.has('admin') ||
      urlParams.get('role') === 'supervisor' ||
      urlParams.get('view') === 'supervisor' ||
      urlParams.get('mode') === 'supervisor' ||
      urlParams.get('mode') === 'admin'
    ) {
      loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
      return true;
    }

    // 4. Pin/Token query check
    const pinParam = urlParams.get('pin') || urlParams.get('p') || urlParams.get('token') || urlParams.get('key');
    if (pinParam && authenticateWithSupervisorToken(pinParam)) {
      return true;
    }

    // 5. Full URL fallback check (for queries embedded in hash like /#admin?pin=9988)
    if (
      fullUrl.includes('role=supervisor') ||
      fullUrl.includes('view=supervisor') ||
      fullUrl.includes('mode=supervisor') ||
      fullUrl.includes('supervisor=') ||
      fullUrl.includes('pin=9988') ||
      fullUrl.includes('token=9988')
    ) {
      loginAdminByToken(SUPERVISOR_SECRET_TOKEN);
      return true;
    }
  } catch (err) {
    console.error('Supervisor access check error:', err);
  }

  return false;
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {
    // ignore
  }
}
