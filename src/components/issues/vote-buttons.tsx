"use client";

import {
  IconArrowBigDown,
  IconArrowBigDownFilled,
  IconArrowBigUp,
  IconArrowBigUpFilled,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoteType } from "@/types/database";

interface VoteButtonsProps {
  issueId: string;
  upvotes: number;
  downvotes: number;
  userVote?: VoteType | null;
  onVote: (voteType: VoteType) => void;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
}

export function VoteButtons({
  issueId,
  upvotes,
  downvotes,
  userVote,
  onVote,
  size = "md",
  orientation = "vertical",
  disabled = false,
}: VoteButtonsProps) {
  const score = upvotes - downvotes;

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const buttonSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const handleUpvote = () => {
    if (disabled) return;
    onVote("upvote");
  };

  const handleDownvote = () => {
    if (disabled) return;
    onVote("downvote");
  };

  const isUpvoted = userVote === "upvote";
  const isDownvoted = userVote === "downvote";

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      {/* Upvote button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSizes[size],
          "rounded-full transition-all",
          isUpvoted
            ? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
            : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10",
        )}
        onClick={handleUpvote}
        disabled={disabled}
      >
        {isUpvoted ? (
          <IconArrowBigUpFilled className={iconSizes[size]} />
        ) : (
          <IconArrowBigUp className={iconSizes[size]} />
        )}
        <span className="sr-only">Upvote</span>
      </Button>

      {/* Score */}
      <span
        className={cn(
          "font-semibold tabular-nums",
          textSizes[size],
          score > 0 && "text-green-500",
          score < 0 && "text-red-500",
          score === 0 && "text-muted-foreground",
        )}
      >
        {score}
      </span>

      {/* Downvote button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSizes[size],
          "rounded-full transition-all",
          isDownvoted
            ? "text-red-500 hover:text-red-400 hover:bg-red-500/10"
            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10",
        )}
        onClick={handleDownvote}
        disabled={disabled}
      >
        {isDownvoted ? (
          <IconArrowBigDownFilled className={iconSizes[size]} />
        ) : (
          <IconArrowBigDown className={iconSizes[size]} />
        )}
        <span className="sr-only">Downvote</span>
      </Button>
    </div>
  );
}
