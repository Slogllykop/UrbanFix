"use client";

import { IconBrandGoogle } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

interface GoogleLoginButtonProps {
  className?: string;
}

export function GoogleLoginButton({ className }: GoogleLoginButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
    // Don't set loading to false on success, as we'll redirect
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className={className}
      onClick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <IconBrandGoogle className="mr-2 h-5 w-5" />
      )}
      Continue with Google
    </Button>
  );
}
