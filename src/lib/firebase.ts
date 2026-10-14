import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { loginAdminByEmail, isSupervisorEmail } from './auth';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthResult {
  user: User;
  name: string;
  email: string;
  avatar?: string;
  isSupervisor: boolean;
}

// Check redirect result on load (especially useful for iOS Safari)
export async function checkRedirectResult(): Promise<GoogleAuthResult | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) return null;
    const user = result.user;
    const name = user.displayName || user.email?.split('@')[0] || 'طالب';
    const email = user.email || '';
    const avatar = user.photoURL || undefined;
    const isSupervisor = isSupervisorEmail(email);

    if (isSupervisor) {
      loginAdminByEmail(email);
    }

    return {
      user,
      name,
      email,
      avatar,
      isSupervisor,
    };
  } catch (error) {
    console.warn('Redirect auth check notice:', error);
    return null;
  }
}

// Official Google Sign-In with Popup and automatic Redirect fallback
export async function signInWithGoogleOfficial(): Promise<GoogleAuthResult> {
  try {
    // Attempt popup first (standard for desktop and modern mobile)
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const name = user.displayName || user.email?.split('@')[0] || 'طالب';
    const email = user.email || '';
    const avatar = user.photoURL || undefined;
    const isSupervisor = isSupervisorEmail(email);

    if (isSupervisor) {
      loginAdminByEmail(email);
    }

    return {
      user,
      name,
      email,
      avatar,
      isSupervisor,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // If popup is blocked by mobile Safari or browser, trigger redirect flow
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, provider);
        // Will redirect away from page
        return new Promise(() => {});
      } catch (redirectErr) {
        console.error('Redirect fallback error:', redirectErr);
        throw error;
      }
    }
    throw error;
  }
}

// Direct Redirect Sign-In (optional manual trigger)
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, provider);
}

// Sign Out
export async function signOutOfficial(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

// Auth State Listener
export function onAuthStateChangeOfficial(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

