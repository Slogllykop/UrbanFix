"use client";

import {
  IconCalendar,
  IconClock,
  IconLogout,
  IconMail,
  IconShield,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, useUser } from "@/providers/auth-provider";

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
      <div className="container max-w-md mx-auto p-4 space-y-8 pt-10">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 w-full flex flex-col items-center">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
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

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24 md:pb-8">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center space-y-4 pt-4 md:pt-8 w-full">
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-primary/50 opacity-30 blur-sm"></div>
          <Avatar className="h-24 w-24 border-4 border-background relative shadow-xl">
            <AvatarImage
              src={user.avatar_url || ""}
              alt={user.full_name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {user.full_name || "UrbanFix User"}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {user.email}
          </p>
        </div>

        <div className="flex gap-2 text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
          {UserRoleLabel[user.role] || user.role}
        </div>
      </div>

      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconUser className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
              >
                Email Address
              </Label>
              <div className="relative group">
                <IconMail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="email"
                  value={user.email}
                  readOnly
                  className="pl-9 bg-muted/30 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="fullname"
                className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
              >
                Full Name
              </Label>
              <div className="relative group">
                <IconUser className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="fullname"
                  value={user.full_name || "Not set"}
                  readOnly
                  className="pl-9 bg-muted/30 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
              >
                Account Role
              </Label>
              <div className="relative group">
                <IconShield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <Input
                  id="role"
                  value={UserRoleLabel[user.role] || user.role.toUpperCase()}
                  readOnly
                  className="pl-9 bg-muted/30 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  Member Since
                </Label>
                <div className="relative group">
                  <IconCalendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  <Input
                    value={new Date(user.created_at).toLocaleDateString()}
                    readOnly
                    className="pl-9 bg-muted/30 font-medium text-sm"
                  />
                </div>
              </div>
              {user.last_issue_date && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                    Last Activity
                  </Label>
                  <div className="relative group">
                    <IconClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    <Input
                      value={new Date(
                        user.last_issue_date,
                      ).toLocaleDateString()}
                      readOnly
                      className="pl-9 bg-muted/30 font-medium text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="pt-2">
          <Button
            variant="destructive"
            className="w-full h-12 text-md font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <IconLogout className="mr-2 h-5 w-5" />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Version 1.0.0 • UrbanFix
          </p>
        </div>
      </div>
    </div>
  );
}
