import { getProfile } from "@/src/lib/auth/getProfile";
import { createAdminClient } from "@/src/lib/supabase/admin";

type SlaEventType =
  | "deadline_started"
  | "paused_budget"
  | "resumed_budget"
  | "completed"
  | "merged";

type RecordSlaEventParams = {
  reportId: string;
  eventType: SlaEventType;
  previousResolutionDueAt?: string | null;
  newResolutionDueAt?: string | null;
  note?: string | null;
};

export async function recordSlaEvent({
  reportId,
  eventType,
  previousResolutionDueAt = null,
  newResolutionDueAt = null,
  note = null,
}: RecordSlaEventParams) {
  const profile = await getProfile();
  const supabase = createAdminClient();

  const { error } = await supabase.from("report_sla_events").insert({
    report_id: reportId,
    event_type: eventType,
    previous_resolution_due_at: previousResolutionDueAt,
    new_resolution_due_at: newResolutionDueAt,
    note,
    created_by: profile?.id ?? null,
  });

  if (error && !isMissingSlaEventsTableError(error.message)) {
    console.error("Failed to record SLA event:", error.message);
  }
}

function isMissingSlaEventsTableError(message: string | null | undefined) {
  return Boolean(
    message?.includes("report_sla_events") &&
      (message.includes("does not exist") ||
        message.includes("Could not find the table"))
  );
}
