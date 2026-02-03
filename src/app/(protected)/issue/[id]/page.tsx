"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useState } from "react";
import { toast } from "sonner";
import { IssueDetail } from "@/components/issues/issue-detail";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/providers/auth-provider";
import type { Issue, User, VoteType } from "@/types/database";

// Dummy issue data - replace with real API call
const getDummyIssue = (id: string): Issue | null => {
  const issues: Record<string, Issue> = {
    "1": {
      id: "1",
      created_by: "user-1",
      title: "Large pothole on MG Road near railway station",
      description:
        "There's a dangerous pothole that's been here for weeks. Multiple vehicles have been damaged. The pothole is approximately 2 feet wide and 6 inches deep. It becomes particularly hazardous during rain as it fills with water and becomes invisible. Several motorcyclists have reported near-accidents. This needs immediate attention from the municipal authorities.",
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
    "2": {
      id: "2",
      created_by: "user-2",
      title: "Overflowing garbage bin near Shivaji Nagar",
      description:
        "Garbage has been piling up for days. Creating health hazard in the area. Foul smell is spreading to nearby shops and residences.",
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
  };

  return issues[id] || null;
};

const getDummyCreator = (): User => ({
  id: "user-1",
  email: "citizen@example.com",
  full_name: "Rahul Sharma",
  avatar_url:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  role: "user",
  auth_type: "oauth",
  last_issue_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function IssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const _router = useRouter();
  const role = useUserRole();
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [issue, setIssue] = useState<Issue | null>(() => getDummyIssue(id));
  const creator = getDummyCreator();

  const handleVote = useCallback(
    (voteType: VoteType) => {
      if (!issue) return;

      const currentVote = userVote;
      let newVote: VoteType | null = voteType;
      let scoreDelta = 0;

      // Toggle logic
      if (currentVote === voteType) {
        newVote = null;
        scoreDelta = voteType === "upvote" ? -1 : 1;
      } else if (currentVote) {
        scoreDelta = voteType === "upvote" ? 2 : -2;
      } else {
        scoreDelta = voteType === "upvote" ? 1 : -1;
      }

      // Optimistic update
      setUserVote(newVote);
      setIssue((prev) =>
        prev
          ? { ...prev, priority_score: prev.priority_score + scoreDelta }
          : prev,
      );

      // Show feedback
      if (newVote === "upvote") {
        toast.success("Upvoted!");
      } else if (newVote === "downvote") {
        toast.success("Downvoted");
      } else {
        toast.info("Vote removed");
      }

      // TODO: Sync with server
    },
    [userVote, issue],
  );

  const handleMarkAddressed = useCallback(async () => {
    if (!issue) return;

    try {
      // TODO: Update issue status in database

      setIssue((prev) =>
        prev
          ? {
              ...prev,
              status: "addressed",
              addressed_at: new Date().toISOString(),
            }
          : prev,
      );

      toast.success("Issue marked as addressed!", {
        description: "The reporter will be notified.",
      });
    } catch (_error) {
      toast.error("Failed to update status");
    }
  }, [issue]);

  if (!issue) {
    return (
      <div className="container mx-auto max-w-screen-md px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-xl font-bold mb-2">Issue Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The issue you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const canMarkAddressed = role === "ngo" || role === "admin";

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-6">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Issues
          </Link>
        </Button>
      </div>

      {/* Issue detail */}
      <IssueDetail
        issue={issue}
        creator={creator}
        userVote={userVote}
        onVote={handleVote}
        onMarkAddressed={handleMarkAddressed}
        canMarkAddressed={canMarkAddressed}
      />
    </div>
  );
}
