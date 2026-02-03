"use client";

import { IssueCard } from "@/components/issues/issue-card";
import type { Issue, VoteType } from "@/types/database";

interface IssueListProps {
  issues: Issue[];
  userVotes: Record<string, VoteType | null>;
  onVote: (issueId: string, voteType: VoteType) => void;
  showStatus?: boolean;
  emptyMessage?: string;
}

export function IssueList({
  issues,
  userVotes,
  onVote,
  showStatus = false,
  emptyMessage = "No issues found",
}: IssueListProps) {
  if (issues.length === 0) {
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
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          userVote={userVotes[issue.id] ?? null}
          onVote={onVote}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
