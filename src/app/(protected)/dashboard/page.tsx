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
import { useUserRole } from "@/providers/auth-provider";
import type { Issue, IssueStatus } from "@/types/database";

// Dummy data for development
const DUMMY_ISSUES: Issue[] = [
  {
    id: "1",
    created_by: "user-1",
    title: "Large pothole on MG Road near railway station",
    description: "There's a dangerous pothole that's been here for weeks.",
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&h=600&fit=crop",
    latitude: 18.5204,
    longitude: 73.8567,
    address: "MG Road, Near Railway Station, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 42,
    users_reported: 15,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "2",
    created_by: "user-2",
    title: "Overflowing garbage bin near Shivaji Nagar",
    description: "Garbage has been piling up for days.",
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop",
    latitude: 18.5308,
    longitude: 73.8474,
    address: "Shivaji Nagar, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 28,
    users_reported: 8,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "3",
    created_by: "user-3",
    title: "Broken streetlight on FC Road",
    description: "Streetlight has been non-functional for a week.",
    image_url:
      "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&h=600&fit=crop",
    latitude: 18.5196,
    longitude: 73.8553,
    address: "FC Road, Deccan Gymkhana, Pune",
    status: "pending",
    ai_verified: false,
    priority_score: 15,
    users_reported: 5,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "4",
    created_by: "user-4",
    title: "Water logging on JM Road after rain",
    description: "Drainage system blocked.",
    image_url:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop",
    latitude: 18.5167,
    longitude: 73.8433,
    address: "JM Road, Pune",
    status: "addressed",
    ai_verified: true,
    priority_score: 33,
    users_reported: 12,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    created_by: "user-5",
    title: "Damaged footpath near Koregaon Park",
    description: "Footpath tiles broken and uneven.",
    image_url:
      "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=600&fit=crop",
    latitude: 18.5362,
    longitude: 73.8936,
    address: "North Main Road, Koregaon Park, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 19,
    users_reported: 7,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const role = useUserRole();
  const [issues, setIssues] = useState<Issue[]>(DUMMY_ISSUES);
  const [isLoading, _setIsLoading] = useState(false);
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
  };

  // Handle status change
  const handleStatusChange = useCallback(
    async (issueId: string, newStatus: IssueStatus) => {
      try {
        // Optimistic update
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === issueId
              ? {
                  ...issue,
                  status: newStatus,
                  addressed_at:
                    newStatus === "addressed"
                      ? new Date().toISOString()
                      : issue.addressed_at,
                }
              : issue,
          ),
        );

        toast.success(`Issue marked as ${newStatus}!`);

        // TODO: Update in database
      } catch (_error) {
        toast.error("Failed to update status");
      }
    },
    [],
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
    <div className="container mx-auto max-w-screen-xl px-4 py-6">
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
