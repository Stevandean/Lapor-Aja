import { NextResponse } from "next/server";
import { sendSlaAlertNotifications } from "@/src/features/reports/slaAlertNotifications";

export async function POST(request: Request) {
  const cronSecret = process.env.SLA_ALERT_CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "SLA_ALERT_CRON_SECRET is not configured." },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await sendSlaAlertNotifications();

  return NextResponse.json(result, {
    status: result.status === "error" ? 500 : 200,
  });
}
