"use client";

import { IconCamera, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { SocialFeedCard } from "@/components/issues/social-feed-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/providers/auth-provider";
import type { Issue, VoteType } from "@/types/database";

// Dummy data for development
const DUMMY_ISSUES: Issue[] = [
  {
    id: "1",
    created_by: "user-1",
    title: "Large pothole on MG Road near railway station",
    description:
      "There's a dangerous pothole that's been here for weeks. Multiple vehicles have been damaged. Needs immediate attention.",
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&h=600&fit=crop",
    latitude: 18.5204,
    longitude: 73.8567,
    address: "MG Road, Near Railway Station, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 42,
    users_reported: 15,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "2",
    created_by: "user-2",
    title: "Overflowing garbage bin near Shivaji Nagar",
    description:
      "Garbage has been piling up for days. Creating health hazard in the area.",
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=600&fit=crop",
    latitude: 18.5308,
    longitude: 73.8474,
    address: "Shivaji Nagar, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 28,
    users_reported: 8,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "6",
    created_by: "user-6",
    title: "Missing manhole cover near Swargate",
    description:
      "Extremely dangerous! Manhole cover is missing. Someone could fall in.",
    image_url:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop",
    latitude: 18.501,
    longitude: 73.8572,
    address: "Swargate, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 56,
    users_reported: 23,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
  {
    id: "3",
    created_by: "user-3",
    title: "Broken streetlight on FC Road",
    description:
      "Streetlight has been non-functional for a week. Area becomes very dark at night, safety concern.",
    image_url:
      "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&h=600&fit=crop",
    latitude: 18.5196,
    longitude: 73.8553,
    address: "FC Road, Deccan Gymkhana, Pune",
    status: "verified",
    ai_verified: true,
    priority_score: 15,
    users_reported: 5,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    addressed_at: null,
  },
];

export default function HomePage() {
  const { user } = useUser();
  const [issues, setIssues] = useState<Issue[]>(DUMMY_ISSUES);
  const [userVotes, setUserVotes] = useState<Record<string, VoteType | null>>(
    {},
  );

  const handleVote = useCallback(
    (issueId: string, voteType: VoteType) => {
      const currentVote = userVotes[issueId];
      let newVote: VoteType | null = voteType;
      let scoreDelta = 0;

      if (currentVote === voteType) {
        newVote = null;
        scoreDelta = voteType === "upvote" ? -1 : 1;
      } else if (currentVote) {
        scoreDelta = voteType === "upvote" ? 2 : -2;
      } else {
        scoreDelta = voteType === "upvote" ? 1 : -1;
      }

      setUserVotes((prev) => ({
        ...prev,
        [issueId]: newVote,
      }));

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, priority_score: issue.priority_score + scoreDelta }
            : issue,
        ),
      );

      if (newVote === "upvote") toast.success("Upvoted!");
      else if (newVote === "downvote") toast.success("Downvoted");
    },
    [userVotes],
  );

  const sortedIssues = [...issues].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container max-w-xl mx-auto px-0 sm:px-4 py-4 space-y-4">
        {/* Create Post Widget */}
        <div className="px-4 sm:px-0">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link href="/report" className="flex-1">
              <div className="h-10 w-full rounded-full bg-muted px-4 flex items-center text-sm text-muted-foreground hover:bg-muted/80 transition-colors">
                Report an issue...
              </div>
            </Link>
            <Link href="/report">
              <Button
                size="icon"
                variant="ghost"
                className="text-primary rounded-full"
              >
                <IconCamera className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stories/Status Placeholder (Optional Enhancement) */}
        {/* <div className="flex gap-4 overflow-x-auto pb-2 px-4 sm:px-0 no-scrollbar"> ... </div> */}

        {/* Feed */}
        <div className="space-y-4 sm:space-y-6">
          {sortedIssues.map((issue) => (
            <SocialFeedCard
              key={issue.id}
              issue={issue}
              userVote={userVotes[issue.id] ?? null}
              onVote={handleVote}
            />
          ))}

          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>You're all caught up!</p>
          </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <Link href="/report" className="fixed bottom-20 right-4 md:hidden z-40">
          <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
            <IconPlus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
