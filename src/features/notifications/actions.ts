"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";

export async function markNavbarNotificationsAsRead() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("Failed to mark notifications as read:", error.message);
  }

  revalidatePath("/dashboard");
}
