"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IssueTable } from "@/components/dashboard/issue-table";
import { StatsCards } from "@/components/dashboard/stats-cards";
import {
  type IssueFilters,
  StatusFilter,
} from "@/components/dashboard/status-filter";
import { useIssues } from "@/hooks/use-issues";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/providers/auth-provider";
import type { IssueStatus } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const role = useUserRole();
  const { issues, isLoading, refetch } = useIssues({ status: "all" });
  const [filters, setFilters] = useState<IssueFilters>({
    status: "all",
    search: "",
  });

  // Redirect if not NGO or admin
  useEffect(() => {
    if (role && role !== "ngo" && role !== "admin") {
      router.push("/");
    }
  }, [role, router]);

  // Calculate stats
  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "pending").length,
    verified: issues.filter((i) => i.status === "verified").length,
    addressed: issues.filter((i) => i.status === "addressed").length,
    rejected: issues.filter((i) => i.status === "rejected").length,
  };

  // Handle status change — real Supabase update
  const handleStatusChange = useCallback(
    async (issueId: string, newStatus: IssueStatus) => {
      const supabase = createClient();

      try {
        const updates: Record<string, unknown> = {
          status: newStatus,
        };

        if (newStatus === "addressed") {
          updates.addressed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from("issues")
          // @ts-expect-error: TS issues type update
          .update(updates)
          .eq("id", issueId);

        if (error) {
          throw new Error(error.message);
        }

        toast.success(`Issue marked as ${newStatus}!`);
        refetch();
      } catch (_error) {
        toast.error("Failed to update status");
      }
    },
    [refetch],
  );

  // Show loading while checking role
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">NGO Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and track urban issues in your area
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-6">
        <StatsCards stats={stats} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <StatusFilter filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Issue table */}
      <IssueTable
        issues={issues}
        onStatusChange={handleStatusChange}
        filters={filters}
        isLoading={isLoading}
      />
    </div>
  );
}
