"use client";

import type { User as AuthUser, Session } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/types/database";

interface AuthContextType {
  authUser: AuthUser | null;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  };

  // Refresh user data
  const refreshUser = async () => {
    if (authUser) {
      const profile = await fetchUserProfile(authUser.id);
      setUser(profile);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        setSession(initialSession);
        setAuthUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profile = await fetchUserProfile(initialSession.user.id);
          setUser(profile);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profile = await fetchUserProfile(newSession.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }

      // Handle specific events
      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [
    fetchUserProfile,
    supabase.auth.getSession,
    supabase.auth.onAuthStateChange,
  ]);

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  // Sign in with email/password (for NGOs)
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    setUser(null);
    setAuthUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

export function useUserRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}

export function useIsAuthenticated(): boolean {
  const { authUser, isLoading } = useAuth();
  return !isLoading && authUser !== null;
}
