"use client";

import {
  IconCheck,
  IconClock,
  IconMapPin,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import { VoteButtons } from "@/components/issues/vote-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ISSUE_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Issue, User, VoteType } from "@/types/database";

interface IssueDetailProps {
  issue: Issue;
  creator?: User | null;
  userVote?: VoteType | null;
  onVote: (voteType: VoteType) => void;
  onMarkAddressed?: () => void;
  canMarkAddressed?: boolean;
}

export function IssueDetail({
  issue,
  creator,
  userVote,
  onVote,
  onMarkAddressed,
  canMarkAddressed = false,
}: IssueDetailProps) {
  const statusConfig = ISSUE_STATUS_CONFIG[issue.status];
  const upvotes = Math.max(0, issue.priority_score);
  const downvotes = Math.max(0, -issue.priority_score);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero image */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <Image
          src={issue.image_url}
          alt={issue.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <Badge className={cn("text-sm font-medium", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* Vote section */}
        <div className="flex-shrink-0">
          <VoteButtons
            issueId={issue.id}
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            onVote={onVote}
            size="lg"
            orientation="vertical"
          />
        </div>

        {/* Details */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{issue.title}</h1>

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <IconClock className="h-4 w-4" />
              <span>{formatRelativeTime(issue.created_at)}</span>
            </div>
            {issue.users_reported > 1 && (
              <div className="flex items-center gap-1.5">
                <IconUsers className="h-4 w-4" />
                <span>{issue.users_reported} reports</span>
              </div>
            )}
            {issue.ai_verified && (
              <Badge
                variant="outline"
                className="text-green-500 border-green-500"
              >
                AI Verified
              </Badge>
            )}
          </div>

          {/* Description */}
          {issue.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {issue.description}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Location section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <IconMapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {issue.address && (
            <p className="text-sm text-muted-foreground mb-3">
              {issue.address}
            </p>
          )}
          {/* Static map preview */}
          <div className="aspect-video overflow-hidden rounded-lg bg-muted">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${issue.latitude},${issue.longitude}&zoom=16&size=600x300&markers=color:red%7C${issue.latitude},${issue.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&style=feature:all%7Celement:geometry%7Ccolor:0x1d1d1d&style=feature:all%7Celement:labels.text.fill%7Ccolor:0x8a8a8a&style=feature:water%7Celement:geometry%7Ccolor:0x0e1626`}
                alt="Issue location"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
          {/* Open in maps link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center text-sm text-primary hover:underline"
          >
            Open in Google Maps →
          </a>
        </CardContent>
      </Card>

      {/* Reporter info */}
      {creator && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reported by</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.full_name || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {(creator.full_name || creator.email)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">
                  {creator.full_name || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(issue.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NGO Actions */}
      {canMarkAddressed && issue.status !== "addressed" && (
        <Card>
          <CardContent className="pt-6">
            <Button className="w-full" size="lg" onClick={onMarkAddressed}>
              <IconCheck className="mr-2 h-5 w-5" />
              Mark as Addressed
            </Button>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              This will mark the issue as resolved and notify the reporter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
