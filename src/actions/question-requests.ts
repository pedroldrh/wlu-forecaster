"use server";

import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitQuestionRequest(title: string, description: string, category: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 5) throw new Error("Title must be at least 5 characters");
  if (trimmedTitle.length > 200) throw new Error("Title must be 200 characters or less");

  const trimmedDesc = description.trim();
  if (trimmedDesc.length > 500) throw new Error("Description must be 500 characters or less");

  const { error } = await supabase.from("question_requests").insert({
    user_id: user.id,
    title: trimmedTitle,
    description: trimmedDesc || null,
    category,
  });

  if (error) throw new Error("Failed to submit request");

  revalidatePath("/questions");
  return { success: true };
}

export async function approveQuestionRequest(requestId: string, seasonId: string, closeTime: string, resolveTime: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Not authorized");

  // Get the request
  const { data: request } = await supabase
    .from("question_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (!request) throw new Error("Request not found");

  const cookieStore = await cookies();
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );

  // Create the question
  const { error: qError } = await admin.from("questions").insert({
    season_id: seasonId,
    title: request.title,
    description: request.description || "",
    category: request.category,
    close_time: closeTime,
    resolve_time: resolveTime,
    status: "OPEN",
  });
  if (qError) throw new Error("Failed to create question");

  // Mark request as approved
  await admin
    .from("question_requests")
    .update({ status: "APPROVED" })
    .eq("id", requestId);

  revalidatePath("/admin/requests");
  revalidatePath("/questions");
  return { success: true };
}

export async function denyQuestionRequest(requestId: string, note?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("Not authorized");

  const cookieStore = await cookies();
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
      },
    }
  );

  await admin
    .from("question_requests")
    .update({ status: "DENIED", admin_note: note || null })
    .eq("id", requestId);

  revalidatePath("/admin/requests");
  return { success: true };
}
