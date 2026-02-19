"use client";

import type { User as AuthUser, Session } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

function isAbortLikeError(error: unknown): boolean {
  if (typeof error === "string") {
    return error.includes("AbortError") || error.includes("signal is aborted");
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("AbortError") ||
      error.message.includes("signal is aborted")
    );
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(
    async (currentAuthUser: AuthUser) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentAuthUser.id)
          .maybeSingle();

        if (error) {
          if (isAbortLikeError(error.message)) {
            return null;
          }

          console.error("Error fetching user profile:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          return null;
        }

        if (data) {
          return data;
        }

        // Self-heal missing profile rows (e.g. older users created before trigger existed).
        if (!currentAuthUser.email) {
          console.error("Cannot create user profile: missing auth email", {
            userId: currentAuthUser.id,
          });
          return null;
        }

        const authType: User["auth_type"] =
          currentAuthUser.app_metadata?.provider === "google"
            ? "oauth"
            : "email";

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: currentAuthUser.id,
            email: currentAuthUser.email,
            full_name:
              (currentAuthUser.user_metadata?.full_name as
                | string
                | undefined) ??
              (currentAuthUser.user_metadata?.name as string | undefined) ??
              null,
            avatar_url:
              (currentAuthUser.user_metadata?.avatar_url as
                | string
                | undefined) ?? null,
            role: "user",
            auth_type: authType,
          })
          .select("*")
          .single();

        if (!createError) {
          return createdProfile;
        }

        // If creation failed due race/duplicate, retry fetch once.
        const { data: retriedProfile, error: retryError } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentAuthUser.id)
          .maybeSingle();

        if (retriedProfile) {
          return retriedProfile;
        }

        console.error("Error creating missing user profile:", {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint,
          retryMessage: retryError?.message,
        });

        return null;
      } catch (error) {
        if (isAbortLikeError(error)) {
          return null;
        }
        console.error("Unexpected profile fetch error:", error);
        return null;
      }
    },
    [supabase],
  );

  // Refresh user data
  const refreshUser = async () => {
    if (authUser) {
      const profile = await fetchUserProfile(authUser);
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
          const profile = await fetchUserProfile(initialSession.user);
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
      try {
        setSession(newSession);
        setAuthUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profile = await fetchUserProfile(newSession.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (!isAbortLikeError(error)) {
          console.error("Auth state change error:", error);
        }
      }

      // Handle specific events
      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, supabase]);

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
