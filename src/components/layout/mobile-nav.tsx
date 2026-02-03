"use client";

import {
  IconCamera,
  IconHome,
  IconLayoutDashboard,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/providers/auth-provider";

export function MobileNav() {
  const pathname = usePathname();
  const role = useUserRole();

  const navItems = [
    { href: "/", label: "Home", icon: IconHome },
    ...(role === "user"
      ? [{ href: "/report", label: "Report", icon: IconCamera }]
      : []),
    ...(role === "ngo" || role === "admin"
      ? [{ href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard }]
      : []),
    { href: "/profile", label: "Profile", icon: IconUser },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-around px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-transform",
                  isActive && "scale-110",
                )}
                stroke={isActive ? 2.5 : 1.5}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
