"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { sendSlaAlertNotifications } from "@/src/features/reports/slaAlertNotifications";
import type { ActionState } from "@/src/types/action";

export async function sendVillageSlaAlerts(
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  void _prevState;
  void _formData;

  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (!["admin", "kepala_desa", "sekdes"].includes(profile.role)) {
    redirect(getDashboardRouteByRole(profile.role));
  }

  const result = await sendSlaAlertNotifications({
    triggeredBy: profile.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/village/sla");

  return {
    status: result.status,
    message: result.message,
  };
}
