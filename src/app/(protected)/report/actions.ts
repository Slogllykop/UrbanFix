"use server";

import {
  DUPLICATE_RADIUS_METERS,
  DUPLICATE_WINDOW_DAYS,
  REPORT_COOLDOWN_HOURS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { IssueCategory } from "@/types/database";

interface SubmitIssueInput {
  title: string;
  description?: string;
  category: IssueCategory;
  latitude: number;
  longitude: number;
  address?: string;
  imageBlob: string; // base64 encoded
  imageMimeType: string;
}

interface SubmitIssueResult {
  success: boolean;
  error?: string;
  issueId?: string;
  duplicateIssueId?: string;
}

export async function submitIssue(
  input: SubmitIssueInput,
): Promise<SubmitIssueResult> {
  const supabase = await createClient();

  // 1. Verify the user is authenticated
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: "You must be logged in to report issues." };
  }

  // 2. Check 3-hour cooldown
  const { data: userProfile } = (await supabase
    .from("users")
    .select("last_issue_at")
    .eq("id", authUser.id)
    .single()) as { data: any; error: any };

  if (userProfile?.last_issue_at) {
    const lastIssueTime = new Date(userProfile.last_issue_at).getTime();
    const cooldownMs = REPORT_COOLDOWN_HOURS * 60 * 60 * 1000;
    const timeSince = Date.now() - lastIssueTime;

    if (timeSince < cooldownMs) {
      const minutesLeft = Math.ceil((cooldownMs - timeSince) / 60000);
      return {
        success: false,
        error: `You can report again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}. There is a ${REPORT_COOLDOWN_HOURS}-hour cooldown between reports.`,
      };
    }
  }

  // 3. Check for duplicate issues within 50m and 24h
  const { data: nearbyIssues } = await supabase.rpc("find_nearby_issues", {
    lat: input.latitude,
    lng: input.longitude,
    radius_meters: DUPLICATE_RADIUS_METERS,
    days_back: DUPLICATE_WINDOW_DAYS,
    issue_category: input.category,
  } as any);

  const nearby = nearbyIssues as unknown as any[];
  if (nearby && nearby.length > 0) {
    const existingId = nearby[0].issue_id;

    // Increment users_reported on the existing issue
    const { data: existingIssue } = await supabase
      .from("issues")
      .select("users_reported")
      .eq("id", existingId)
      .single();

    if (existingIssue) {
      await supabase
        .from("issues")
        // @ts-expect-error: TS issues type update
        .update({ users_reported: existingIssue.users_reported + 1 })
        .eq("id", existingId);
    }

    // Create an issue_report entry for tracking
    await supabase
      .from("issue_reports")
      // @ts-expect-error: TS issue_reports type insert
      .insert({
        issue_id: existingId,
        user_id: authUser.id,
      });

    return {
      success: true,
      duplicateIssueId: existingId,
    };
  }

  // 4. Upload image to Supabase Storage
  const imageBytes = Uint8Array.from(atob(input.imageBlob), (c) =>
    c.charCodeAt(0),
  );
  const extension = input.imageMimeType.split("/")[1] || "jpeg";
  const filePath = `${authUser.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("issue-images")
    .upload(filePath, imageBytes, {
      contentType: input.imageMimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      error: `Image upload failed: ${uploadError.message}`,
    };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("issue-images").getPublicUrl(filePath);

  // 5. Create the issue in the database
  const { data: newIssue, error: insertError } = await supabase
    .from("issues")
    // @ts-expect-error: TS issues type insert
    .insert({
      created_by: authUser.id,
      title: input.title,
      description: input.description || null,
      image_url: publicUrl,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      users_reported: 1,
      upvotes_count: 0,
      priority_score: 0,
    })
    .select("id")
    .single();

  const createdId = (newIssue as any)?.id;

  if (insertError || !createdId) {
    return {
      success: false,
      error: `Failed to create issue: ${insertError?.message || "Unknown error"}`,
    };
  }

  // 6. Update user's last_issue_at
  await supabase
    .from("users")
    // @ts-expect-error: TS users type update
    .update({ last_issue_at: new Date().toISOString() })
    .eq("id", authUser.id);

  // 7. POST to backend for AI processing
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    try {
      // biome-ignore lint/correctness/noUnusedVariables: not used
      const response = await fetch(`${backendUrl}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdId,
          image_url: publicUrl,
          category: input.category,
        }),
      });
    } catch (err) {
      // Don't fail the entire submission if backend is unreachable
      console.error("Backend POST failed:", err);
    }
  }

  return {
    success: true,
    issueId: createdId,
  };
}
