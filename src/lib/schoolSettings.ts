import { useState, useEffect } from 'react';

export interface SchoolSettings {
  schoolName: string;
  roomTitle: string;
}

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'ثانوية الملك عبدالله بن عبدالعزيز',
  roomTitle: 'غرفة مصادر التعلم والابتكار الرقمي',
};

const STORAGE_KEY_SCHOOL = 'school_name_display';
const STORAGE_KEY_ROOM = 'school_room_title';
const EVENT_NAME = 'school-settings-updated';

export function getStoredSchoolSettings(): SchoolSettings {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_SETTINGS;
  return {
    schoolName: localStorage.getItem(STORAGE_KEY_SCHOOL) || DEFAULT_SCHOOL_SETTINGS.schoolName,
    roomTitle: localStorage.getItem(STORAGE_KEY_ROOM) || DEFAULT_SCHOOL_SETTINGS.roomTitle,
  };
}

export async function fetchSchoolSettings(): Promise<SchoolSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.schoolName) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_SCHOOL, data.schoolName);
          if (data.roomTitle) localStorage.setItem(STORAGE_KEY_ROOM, data.roomTitle);
          window.dispatchEvent(new Event(EVENT_NAME));
        }
        return {
          schoolName: data.schoolName,
          roomTitle: data.roomTitle || DEFAULT_SCHOOL_SETTINGS.roomTitle,
        };
      }
    }
  } catch (err) {
    console.warn('Could not fetch school settings from server:', err);
  }
  return getStoredSchoolSettings();
}

export async function saveSchoolSettings(settings: Partial<SchoolSettings>): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      if (settings.schoolName !== undefined) {
        localStorage.setItem(STORAGE_KEY_SCHOOL, settings.schoolName);
      }
      if (settings.roomTitle !== undefined) {
        localStorage.setItem(STORAGE_KEY_ROOM, settings.roomTitle);
      }
      window.dispatchEvent(new Event(EVENT_NAME));
    }

    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to save school settings to server:', err);
    return false;
  }
}

/**
 * Hook to read and write school settings live across all components
 */
export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(() => getStoredSchoolSettings());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSchoolSettings().then((remote) => {
      setSettings(remote);
    });

    const handleUpdate = () => {
      setSettings(getStoredSchoolSettings());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
    };
  }, []);

  const save = async (newSettings: Partial<SchoolSettings>) => {
    setIsSaving(true);
    const success = await saveSchoolSettings(newSettings);
    setIsSaving(false);
    return success;
  };

  return {
    settings,
    saveSettings: save,
    isSaving,
  };
}
