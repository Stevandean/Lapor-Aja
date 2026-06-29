import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";

const SETTINGS_PROFILE_BASE_SELECT = `
  id,
  full_name,
  email,
  phone_number,
  role,
  dusun_id,
  section_id,
  avatar_url,
  is_active,
  created_at,
  updated_at,
  dusun:dusuns!profiles_dusun_id_fkey(id, name),
  section:village_sections!profiles_section_id_fkey(id, name)
`;

const SETTINGS_PROFILE_WITH_NOTIFICATION_SELECT = `
  ${SETTINGS_PROFILE_BASE_SELECT},
  notification_internal_enabled,
  notification_email_enabled,
  notification_whatsapp_enabled
`;

export async function getSettingsProfile() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(SETTINGS_PROFILE_WITH_NOTIFICATION_SELECT)
    .eq("id", profile.id)
    .single();

  let settingsProfile = data;
  let notificationSettingsAvailable = true;

  if (isMissingNotificationSettingsColumn(error)) {
    notificationSettingsAvailable = false;

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("profiles")
      .select(SETTINGS_PROFILE_BASE_SELECT)
      .eq("id", profile.id)
      .single();

    if (fallbackError || !fallbackData) {
      console.error("Failed to fetch settings profile:", fallbackError?.message);
      redirect(ROUTES.LOGIN);
    }

    settingsProfile = {
      ...fallbackData,
      notification_internal_enabled: true,
      notification_email_enabled: true,
      notification_whatsapp_enabled: true,
    };
  }

  if (error && !isMissingNotificationSettingsColumn(error)) {
    console.error("Failed to fetch settings profile:", error.message);
    redirect(ROUTES.LOGIN);
  }

  if (!settingsProfile) {
    console.error("Failed to fetch settings profile: profile not found");
    redirect(ROUTES.LOGIN);
  }

  let avatarSignedUrl: string | null = null;

  if (settingsProfile.avatar_url) {
    const { data: signedUrlData } = await supabase.storage
      .from("profile-avatars")
      .createSignedUrl(settingsProfile.avatar_url, 60 * 60);

    avatarSignedUrl = signedUrlData?.signedUrl ?? null;
  }

  return {
    ...settingsProfile,
    avatar_signed_url: avatarSignedUrl,
    notification_settings_available: notificationSettingsAvailable,
  };
}

function isMissingNotificationSettingsColumn(error: { message?: string } | null) {
  if (!error?.message) return false;

  return (
    error.message.includes("notification_internal_enabled") ||
    error.message.includes("notification_email_enabled") ||
    error.message.includes("notification_whatsapp_enabled")
  );
}
