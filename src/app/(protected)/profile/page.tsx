"use client";

import {
  IconCalendar,
  IconChevronRight,
  IconClipboardList,
  IconClock,
  IconLogout,
  IconMail,
  IconShield,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/providers/auth-provider";

/**
 * InfoItem Component
 * A premium-styled row for displaying user information
 */
const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string;
  className?: string;
}) => (
  <div
    className={cn(
      "group flex items-center justify-between p-4 rounded-2xl glass-card transition-all hover:bg-white/[0.05]",
      className,
    )}
  >
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">
          {label}
        </span>
        <span className="text-sm font-semibold tracking-tight">{value}</span>
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto p-6 space-y-8 pt-12">
        <div className="flex flex-col items-center space-y-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="space-y-3 w-full flex flex-col items-center">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Initials for avatar fallback
  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : user.email.substring(0, 2).toUpperCase();

  const UserRoleLabel = {
    user: "Citizen",
    ngo: "NGO Representative",
    admin: "Administrator",
  };

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lastActivity = user.last_issue_at
    ? new Date(user.last_issue_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "No activity yet";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-background to-background">
      <div className="container max-w-md mx-auto p-6 space-y-8 pb-32 pt-10 animate-in fade-in duration-700">
        {/* Header Profile Section */}
        <div className="flex flex-col items-center text-center space-y-5 pt-4">
          <div className="relative group">
            {/* Multi-layered glow effects */}
            <div className="absolute -inset-4 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-1000"></div>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/40 to-primary/10 opacity-50 blur-md animate-pulse"></div>

            <Avatar className="h-28 w-28 border-2 border-white/20 relative shadow-2xl animate-float">
              <AvatarImage
                src={user.avatar_url || ""}
                alt={user.full_name || "User"}
                className="object-cover"
              />
              <AvatarFallback className="text-3xl font-extrabold bg-zinc-800 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="absolute -bottom-1 -right-1">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-background">
                <IconShield className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              {user.full_name || "UrbanFix User"}
            </h1>
            <p className="text-sm text-muted-foreground font-medium tracking-wide">
              {user.email}
            </p>
          </div>

          <Badge
            variant="outline"
            className="px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 border-white/10 backdrop-blur-sm"
          >
            {UserRoleLabel[user.role] || user.role}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">
              Personal Details
            </h2>
          </div>

          <div className="grid gap-3 slide-in-from-bottom-2 duration-500 fill-mode-forwards">
            <InfoItem
              icon={IconMail}
              label="Email Address"
              value={user.email}
            />
            <InfoItem
              icon={IconUser}
              label="Full Name"
              value={user.full_name || "Not set"}
            />
            <InfoItem
              icon={IconShield}
              label="Account Access"
              value={UserRoleLabel[user.role] || user.role.toUpperCase()}
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary/60 mb-1">
              <IconCalendar className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                Joined
              </span>
            </div>
            <span className="text-sm font-bold">{memberSince}</span>
          </div>

          <div className="glass-card p-4 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary/60 mb-1">
              <IconClock className="h-3.5 w-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                Activity
              </span>
            </div>
            <span className="text-sm font-bold">{lastActivity}</span>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-3 pt-2">
          <Button
            className="w-full h-14 rounded-2xl text-md font-bold shadow-xl bg-white text-black hover:bg-white/90 transition-all group overflow-hidden relative"
            asChild
          >
            <Link href="/profile/reports">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-between w-full px-2">
                <span className="flex items-center gap-3">
                  <div className="bg-black/10 p-2 rounded-xl text-black">
                    <IconClipboardList className="h-5 w-5" />
                  </div>
                  View My Reports
                </span>
                <IconChevronRight className="h-5 w-5 opacity-50 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </Button>

          <Button
            variant="destructive"
            className="w-full h-14 rounded-2xl text-md font-bold shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all active:scale-[0.98] mt-2"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <IconLogout className="mr-2 h-5 w-5" />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>

          <div className="flex flex-col items-center space-y-2 pt-6">
            <div className="h-1.5 w-1.5 rounded-full bg-primary/20"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
              UrbanFix • Build 1.0.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
