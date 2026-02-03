"use client";

import { IconDots, IconMapPin, IconShare } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { VoteButtons } from "@/components/issues/vote-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ISSUE_STATUS_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Issue, VoteType } from "@/types/database";

interface SocialFeedCardProps {
  issue: Issue;
  userVote?: VoteType | null;
  onVote: (issueId: string, voteType: VoteType) => void;
}

export function SocialFeedCard({
  issue,
  userVote,
  onVote,
}: SocialFeedCardProps) {
  const statusConfig = ISSUE_STATUS_CONFIG[issue.status];

  // Dummy user data since we don't have it in the issue object fully yet
  // In a real app, you'd fetch this or include it in the join
  const creatorId = issue.created_by || "anonymous";
  const userInitial = creatorId.charAt(0).toUpperCase();
  const userName = issue.created_by
    ? `User ${issue.created_by.substring(0, 4)}`
    : "Anonymous User";

  const upvotes = Math.max(0, issue.priority_score);
  const downvotes = Math.max(0, -issue.priority_score);

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-row items-center space-y-0 p-4">
        <div className="flex items-center gap-3">
          {/* User Avatar - Placeholder since we don't have user profiles joined yet */}
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`}
            />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-semibold">{userName}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              {issue.address && (
                <span className="flex items-center gap-1 max-w-[200px] truncate mr-2">
                  <IconMapPin className="h-3 w-3" />
                  {issue.address}
                </span>
              )}
              <span>• {formatRelativeTime(issue.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Report</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Image */}
      <div className="relative aspect-square w-full bg-muted sm:aspect-4/3">
        <Image
          src={issue.image_url}
          alt={issue.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
          priority
        />
        {/* Status Badge Overlay */}
        <div className="absolute top-4 right-4">
          <Badge
            className={cn(
              "border-0 text-white shadow-sm font-medium",
              statusConfig.color,
            )}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <VoteButtons
            issueId={issue.id}
            upvotes={upvotes}
            downvotes={downvotes}
            userVote={userVote}
            onVote={(voteType) => onVote(issue.id, voteType)}
            size="md"
            orientation="horizontal"
          />
        </div>
        <Button variant="ghost" size="icon">
          <IconShare className="h-5 w-5" />
        </Button>
      </div>

      {/* Caption & Content */}
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <div>
            <p className="font-semibold text-sm inline mr-2">{userName}</p>
            <span className="text-sm">{issue.title}</span>
          </div>
          {issue.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {issue.description}
            </p>
          )}

          {/* View Details Link */}
          <Link
            href={`/issue/${issue.id}`}
            className="block mt-2 text-sm text-muted-foreground hover:text-primary"
          >
            View all details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
