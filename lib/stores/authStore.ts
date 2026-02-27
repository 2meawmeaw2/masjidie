import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────
// Store types
// ──────────────────────────────────────────────
interface AuthState {
  session: Session | null;
  user: User | null;
  mosqueId: string | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    metadata: Record<string, string>,
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  mosqueId: null,
  isSuperAdmin: false,
  isLoading: false,
  error: null,

  initialize: () => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        mosqueId: session?.user?.user_metadata?.mosque_id ?? null,
        isSuperAdmin: session?.user?.user_metadata?.role === "super_admin",
      });
    });

    // Subscribe to auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        mosqueId: session?.user?.user_metadata?.mosque_id ?? null,
        isSuperAdmin: session?.user?.user_metadata?.role === "super_admin",
      });
    });
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  signUp: async (
    email: string,
    password: string,
    metadata: Record<string, string>,
  ) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return false;
    }
    // Explicitly set the session so the client is authenticated immediately
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      set({
        session: data.session,
        user: data.session.user,
        mosqueId: data.session.user?.user_metadata?.mosque_id ?? null,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, mosqueId: null, isSuperAdmin: false });
  },
}));
