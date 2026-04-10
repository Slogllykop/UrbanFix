"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { SocialFeedCard } from "@/components/issues/social-feed-card";
import { Button } from "@/components/ui/button";
import { useIssues, useUserVotes } from "@/hooks/use-issues";
import { useUser } from "@/providers/auth-provider";
import type { VoteType } from "@/types/database";

export default function HomePage() {
  const { user } = useUser();
  const { issues, isLoading, error, refetch } = useIssues({ status: "feed" });
  const { votes: userVotes, castVote } = useUserVotes(user?.id);

  const handleVote = useCallback(
    async (issueId: string, voteType: VoteType) => {
      const result = await castVote(issueId, voteType);
      if (result.success) {
        refetch();
      } else {
        toast.error("Failed to cast vote");
      }
    },
    [castVote, refetch],
  );

  const sortedIssues = [...issues].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container max-w-xl mx-auto px-0 sm:px-4 pb-4">
        {/* Feed */}
        <div className="flex flex-col divide-y-8 divide-muted sm:divide-y-0 sm:space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-destructive">
              <p>Failed to load issues. Please try again.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && sortedIssues.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p className="text-lg font-medium mb-1">No issues reported yet</p>
              <p>Be the first to report an issue in your area!</p>
            </div>
          )}

          {sortedIssues.map((issue) => (
            <SocialFeedCard
              key={issue.id}
              issue={issue}
              userVote={userVotes[issue.id] ?? null}
              onVote={handleVote}
            />
          ))}

          {!isLoading && sortedIssues.length > 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
