"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Issue, VoteType } from "@/types/database";

interface UseIssuesOptions {
  status?: "all" | "pending" | "verified" | "addressed";
  limit?: number;
}

export function useIssues(options: UseIssuesOptions = {}) {
  const { status = "verified", limit = 50 } = options;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("issues")
        .select("*")
        .order("priority_score", { ascending: false })
        .limit(limit);

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setIssues(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch issues"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [status, limit, supabase]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    isLoading,
    error,
    refetch: fetchIssues,
  };
}

export function useIssue(id: string) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchIssue = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("issues")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setIssue(data);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch issue"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssue();
  }, [id, supabase]);

  const updateIssue = useCallback(
    async (updates: Partial<Issue>) => {
      if (!issue) return;

      try {
        const { error: updateError } = await supabase
          .from("issues")
          .update(updates)
          .eq("id", id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setIssue((prev) => (prev ? { ...prev, ...updates } : prev));
        return { success: true };
      } catch (err) {
        return { success: false, error: err };
      }
    },
    [id, issue, supabase],
  );

  return {
    issue,
    isLoading,
    error,
    updateIssue,
  };
}

export function useUserVotes(userId: string | undefined) {
  const [votes, setVotes] = useState<Record<string, VoteType>>({});
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetchVotes = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("issue_votes")
          .select("issue_id, vote_type")
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to fetch votes:", error);
          return;
        }

        const voteMap: Record<string, VoteType> = {};
        for (const vote of data || []) {
          voteMap[vote.issue_id] = vote.vote_type;
        }
        setVotes(voteMap);
      } catch (err) {
        console.error("Failed to fetch votes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
  }, [userId, supabase]);

  const castVote = useCallback(
    async (issueId: string, voteType: VoteType) => {
      if (!userId) return { success: false };

      const currentVote = votes[issueId];

      try {
        if (currentVote === voteType) {
          // Remove vote
          await supabase
            .from("issue_votes")
            .delete()
            .eq("issue_id", issueId)
            .eq("user_id", userId);

          setVotes((prev) => {
            const next = { ...prev };
            delete next[issueId];
            return next;
          });
        } else if (currentVote) {
          // Update vote
          await supabase
            .from("issue_votes")
            .update({ vote_type: voteType })
            .eq("issue_id", issueId)
            .eq("user_id", userId);

          setVotes((prev) => ({ ...prev, [issueId]: voteType }));
        } else {
          // Insert new vote
          await supabase.from("issue_votes").insert({
            issue_id: issueId,
            user_id: userId,
            vote_type: voteType,
          });

          setVotes((prev) => ({ ...prev, [issueId]: voteType }));
        }

        return { success: true };
      } catch (err) {
        console.error("Failed to cast vote:", err);
        return { success: false, error: err };
      }
    },
    [userId, votes, supabase],
  );

  return {
    votes,
    isLoading,
    castVote,
  };
}
