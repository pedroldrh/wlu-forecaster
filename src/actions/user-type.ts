"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setUserType(userType: "UNDERGRAD" | "LAW") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ user_type: userType })
    .eq("id", user.id);

  if (error) throw new Error("Failed to update user type");

  revalidatePath("/");
  revalidatePath(`/u/${user.id}`);
  return { success: true };
}
