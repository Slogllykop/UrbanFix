import { IconMapPin } from "@tabler/icons-react";
import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export const metadata = {
  title: "Login",
  description: "Sign in to UrbanFix to report and track urban issues",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        {/* Logo and branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <IconMapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to UrbanFix
          </h1>
          <p className="text-sm text-muted-foreground">
            Report and track urban issues in your city
          </p>
        </div>

        {/* Login button */}
        <div className="grid gap-4">
          <GoogleLoginButton className="w-full" />

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* NGO link */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Are you an NGO?{" "}
          <Link
            href="/ngo-login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Apply or login here
          </Link>
        </p>
      </div>
    </div>
  );
}
