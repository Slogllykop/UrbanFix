"use client";

import { IconCheck, IconExternalLink, IconMapPin } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISSUE_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Issue, IssueStatus } from "@/types/database";
import type { IssueFilters } from "./status-filter";

interface IssueTableProps {
  issues: Issue[];
  onStatusChange: (issueId: string, status: IssueStatus) => void;
  filters: IssueFilters;
  isLoading?: boolean;
}

export function IssueTable({
  issues,
  onStatusChange,
  filters,
  isLoading = false,
}: IssueTableProps) {
  // Filter issues based on filters
  const filteredIssues = issues.filter((issue) => {
    // Status filter
    if (filters.status !== "all" && issue.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = issue.title.toLowerCase().includes(searchLower);
      const matchesDescription = issue.description
        ?.toLowerCase()
        .includes(searchLower);
      const matchesAddress = issue.address?.toLowerCase().includes(searchLower);

      if (!matchesTitle && !matchesDescription && !matchesAddress) {
        return false;
      }
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (filteredIssues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">
          No issues found matching your filters
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Issue
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">
                Location
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Status
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">
                Priority
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">
                Reported
              </th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => {
              const statusConfig = ISSUE_STATUS_CONFIG[issue.status];

              return (
                <tr
                  key={issue.id}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  {/* Issue info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={issue.image_url}
                          alt={issue.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">
                          {issue.title}
                        </p>
                        {issue.users_reported > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {issue.users_reported} reports
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconMapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {issue.address ||
                          `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <Badge
                      variant="secondary"
                      className={cn("font-medium", statusConfig.color)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </td>

                  {/* Priority */}
                  <td className="p-4 hidden sm:table-cell">
                    <span
                      className={cn(
                        "font-medium",
                        issue.priority_score > 0 && "text-green-500",
                        issue.priority_score < 0 && "text-red-500",
                        issue.priority_score === 0 && "text-muted-foreground",
                      )}
                    >
                      {issue.priority_score > 0 && "+"}
                      {issue.priority_score}
                    </span>
                  </td>

                  {/* Reported date */}
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(issue.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/issue/${issue.id}`}>
                          <IconExternalLink className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {issue.status === "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusChange(issue.id, "addressed")}
                        >
                          <IconCheck className="h-4 w-4 mr-1" />
                          Mark Done
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
