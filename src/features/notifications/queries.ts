import { createClient } from "@/src/lib/supabase/server";

export type NavbarNotification = {
  id: string;
  report_id: string | null;
  subject: string;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  read_at: string | null;
  channel?: string | null;
};

function isMissingNotificationSchemaError(message: string | null | undefined) {
  return Boolean(
    message?.includes("notifications") &&
      (message.includes("schema cache") || message.includes("column"))
  );
}

export async function getNavbarNotifications(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, report_id, subject, message, status, sent_at, created_at, read_at, channel"
    )
    .eq("user_id", userId)
    .eq("channel", "internal")
    .order("created_at", { ascending: false })
    .limit(8);

  if (!error) {
    return (data ?? []) as NavbarNotification[];
  }

  if (!isMissingNotificationSchemaError(error.message)) {
    console.error("Failed to fetch navbar notifications:", error.message);
    return [];
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("notifications")
    .select("id, report_id, subject, message, status, sent_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (fallbackError) {
    console.error(
      "Failed to fetch fallback navbar notifications:",
      fallbackError.message
    );
    return [];
  }

  return (fallbackData ?? []).map((notification) => ({
    ...notification,
    read_at: null,
  })) as NavbarNotification[];
}
