"use client";

import {
  IconArrowLeft,
  IconClipboardList,
  IconClock,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ISSUE_CATEGORIES, ISSUE_STATUS_CONFIG } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useUser } from "@/providers/auth-provider";
import type { Issue } from "@/types/database";

export default function MyReportsPage() {
  const { user } = useUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyReports() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("issues")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        setIssues(data || []);
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMyReports();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container max-w-screen-md mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <IconArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <IconClipboardList className="h-5 w-5 text-primary" />
            My Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            History of issues you have reported
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <IconClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">No reports yet</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              You haven't reported any issues yet. Help improve your
              neighborhood by reporting infrastructure problems.
            </p>
            <Button asChild>
              <Link href="/report">Report an Issue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const statusConfig = ISSUE_STATUS_CONFIG[issue.status];
            const categoryLabel =
              ISSUE_CATEGORIES.find((c) => c.value === issue.category)?.label ||
              issue.category;

            return (
              <Link
                key={issue.id}
                href={`/issue/${issue.id}`}
                className="block"
              >
                <Card className="hover:border-primary/50 transition-colors overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-video sm:w-48 sm:aspect-auto">
                      <Image
                        src={issue.image_url}
                        alt={issue.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 200px"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex flex-col gap-1.5">
                          {categoryLabel && (
                            <Badge
                              variant="outline"
                              className="w-fit text-[10px] px-1.5 py-0"
                            >
                              {categoryLabel}
                            </Badge>
                          )}
                          <h3 className="font-medium line-clamp-1">
                            {issue.title}
                          </h3>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "whitespace-nowrap shrink-0",
                            statusConfig.color,
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4">
                        <div className="flex items-center gap-1">
                          <IconClock className="h-3.5 w-3.5" />
                          <span>{formatRelativeTime(issue.created_at)}</span>
                        </div>
                        <span className="font-medium">
                          {issue.upvotes_count > 0 &&
                            `+${issue.upvotes_count} votes`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
