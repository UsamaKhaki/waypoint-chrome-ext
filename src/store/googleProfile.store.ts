import { create } from 'zustand';
import { storage } from '@/services/storage';

export interface GoogleProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface GoogleProfileState {
  profile: GoogleProfile | null;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => void;
}

async function fetchGoogleProfile(token: string): Promise<GoogleProfile> {
  const res = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
  if (!res.ok) throw new Error('Failed to fetch Google profile');
  return res.json();
}

export const useGoogleProfileStore = create<GoogleProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  load: async () => {
    const saved = await storage.get<GoogleProfile>('googleProfile');
    if (saved) set({ profile: saved });
  },

  signIn: async () => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      // Silently no-op outside extension context — UI handles this with isExtension check
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(token as string);
        });
      });
      const profile = await fetchGoogleProfile(token);
      await storage.set('googleProfile', profile);
      set({ profile, isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  signOut: () => {
    if (typeof chrome !== 'undefined' && chrome.identity) {
      chrome.identity.clearAllCachedAuthTokens(() => {});
    }
    storage.set('googleProfile', null as unknown as GoogleProfile);
    set({ profile: null, error: null });
  },
}));
