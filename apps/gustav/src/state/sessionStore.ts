import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '../lib/supabase';

type SessionState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  session: Session | null;
  error: string | null;
  /** Ensures a session exists before the rest of the app runs. Anonymous
   * for now — a real account only happens at purchase (docs/bauplan.md,
   * Phase 3). Requires anonymous sign-ins enabled on the Supabase project. */
  ensureSignedIn: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'idle',
  session: null,
  error: null,

  ensureSignedIn: async () => {
    set({ status: 'loading', error: null });
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        set({ status: 'ready', session: data.session });
        return;
      }
      const { data: signInData, error } = await supabase.auth.signInAnonymously();
      if (error || !signInData.session) {
        throw error ?? new Error('anonymous sign-in did not return a session');
      }
      set({ status: 'ready', session: signInData.session });
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'unknown error' });
    }
  },
}));
