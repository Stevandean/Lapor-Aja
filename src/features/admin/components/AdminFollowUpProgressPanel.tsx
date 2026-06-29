"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import {
  resolveReport,
  startReportProgress,
} from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type AdminFollowUpProgressPanelProps = {
  reportId: string;
  currentStatus: string;
  followUpType: string | null;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AdminFollowUpProgressPanel({
  reportId,
  currentStatus,
  followUpType,
}: AdminFollowUpProgressPanelProps) {
  const router = useRouter();

  const [startState, startAction, isStarting] = useActionState(
    startReportProgress,
    initialState
  );

  const [resolveState, resolveAction, isResolving] = useActionState(
    resolveReport,
    initialState
  );

  const isAgencyFollowUp = followUpType === "diteruskan_ke_dinas";

  const canStartProgress =
    currentStatus === "forwarded_to_agency" && isAgencyFollowUp;

  const canResolve = currentStatus === "in_progress" && isAgencyFollowUp;

  const isSubmitting = isStarting || isResolving;

  useEffect(() => {
    if (startState.status === "success") {
      toast.success("Success", {
        description: startState.message,
      });

      router.refresh();
    }

    if (startState.status === "error") {
      toast.error("Failed", {
        description: startState.message,
      });
    }
  }, [startState, router]);

  useEffect(() => {
    if (resolveState.status === "success") {
      toast.success("Success", {
        description: resolveState.message,
      });

      router.refresh();
    }

    if (resolveState.status === "error") {
      toast.error("Failed", {
        description: resolveState.message,
      });
    }
  }, [resolveState, router]);

  if (!canStartProgress && !canResolve) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Progress</CardTitle>
          <CardDescription>
            Manage the progress of a report after follow-up processing.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Admin progress actions are only available for reports forwarded to
            an external agency. Village-handled reports are managed by the
            assigned Kasi.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Progress</CardTitle>
        <CardDescription>
          Update this report after the follow-up process has started.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {canStartProgress && (
          <form action={startAction}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <PlayCircle className="mr-2 h-4 w-4" />
              {isStarting ? "Starting..." : "Mark as in progress"}
            </Button>
          </form>
        )}

        {canResolve && (
          <form action={resolveAction}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isResolving ? "Resolving..." : "Mark as resolved"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
