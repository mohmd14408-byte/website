import { useState, useEffect } from 'react';

const LOCAL_STORAGE_LOGO_KEY = 'school_custom_logo_v1';

export function getStoredLogo(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_LOGO_KEY);
}

export async function fetchLogoFromServer(): Promise<string | null> {
  try {
    const res = await fetch('/api/logo');
    if (res.ok) {
      const data = await res.json();
      if (data.logoUrl) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_LOGO_KEY, data.logoUrl);
          window.dispatchEvent(new Event('logo-updated'));
        }
        return data.logoUrl;
      }
    }
  } catch (err) {
    console.warn('Could not fetch logo from server:', err);
  }
  return getStoredLogo();
}

export async function saveLogoAsync(logoDataUrl: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_LOGO_KEY, logoDataUrl);
      window.dispatchEvent(new Event('logo-updated'));
    }

    const res = await fetch('/api/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoUrl: logoDataUrl }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to save logo to server:', err);
    return false;
  }
}

export async function resetLogoAsync(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_LOGO_KEY);
      window.dispatchEvent(new Event('logo-updated'));
    }

    const res = await fetch('/api/logo', { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset logo:', err);
    return false;
  }
}

/**
 * React hook to listen for live logo changes across tabs and components
 */
export function useCustomLogo(): {
  logoUrl: string | null;
  saveLogo: (url: string) => Promise<boolean>;
  resetLogo: () => Promise<boolean>;
} {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => getStoredLogo());

  useEffect(() => {
    // 1. Fetch latest logo from server
    fetchLogoFromServer().then((url) => {
      if (url) setLogoUrl(url);
    });

    // 2. Listen to local updates
    const handleUpdate = () => {
      setLogoUrl(getStoredLogo());
    };

    window.addEventListener('logo-updated', handleUpdate);
    return () => {
      window.removeEventListener('logo-updated', handleUpdate);
    };
  }, []);

  return {
    logoUrl,
    saveLogo: saveLogoAsync,
    resetLogo: resetLogoAsync,
  };
}
