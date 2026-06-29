import { createClient } from "@/src/lib/supabase/server";
import { getUser } from "@/src/lib/auth/getUser";
import type { UserProfile } from "@/src/types/profile";

export async function getProfile(): Promise<UserProfile | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}