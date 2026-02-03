"use client";

import { IconClock, IconMapPin, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { VoteButtons } from "@/components/issues/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ISSUE_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Issue, VoteType } from "@/types/database";

interface IssueCardProps {
  issue: Issue;
  userVote?: VoteType | null;
  onVote: (issueId: string, voteType: VoteType) => void;
  showStatus?: boolean;
}

export function IssueCard({
  issue,
  userVote,
  onVote,
  showStatus = false,
}: IssueCardProps) {
  const statusConfig = ISSUE_STATUS_CONFIG[issue.status];

  // Calculate upvotes and downvotes from priority score
  // priority_score = upvotes - downvotes
  // For display, we'll show the score directly
  const upvotes = Math.max(0, issue.priority_score);
  const downvotes = Math.max(0, -issue.priority_score);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg group">
      <Link href={`/issue/${issue.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={issue.image_url}
            alt={issue.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Status badge */}
          {showStatus && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={cn("font-medium", statusConfig.color)}
              >
                {statusConfig.label}
              </Badge>
            </div>
          )}
          {/* Users reported count */}
          {issue.users_reported > 1 && (
            <div className="absolute bottom-2 right-2">
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur"
              >
                <IconUsers className="mr-1 h-3 w-3" />
                {issue.users_reported} reported
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex-shrink-0">
            <VoteButtons
              issueId={issue.id}
              upvotes={upvotes}
              downvotes={downvotes}
              userVote={userVote}
              onVote={(voteType) => onVote(issue.id, voteType)}
              size="sm"
              orientation="vertical"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/issue/${issue.id}`}>
              <h3 className="font-semibold text-foreground line-clamp-2 hover:underline">
                {issue.title}
              </h3>
            </Link>

            {issue.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {issue.description}
              </p>
            )}

            {/* Meta info */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {issue.address && (
                <div className="flex items-center gap-1">
                  <IconMapPin className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">
                    {issue.address}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                <span>{formatRelativeTime(issue.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
