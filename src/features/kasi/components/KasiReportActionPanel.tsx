"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardEdit,
  PlayCircle,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  resolveKasiReport,
  returnKasiReportAssignment,
  startKasiReportProgress,
  submitKasiProgressUpdate,
} from "@/src/features/kasi/actions";
import type { ActionState } from "@/src/types/action";

type KasiReportActionPanelProps = {
  reportId: string;
  currentStatus: string;
  hasProgressStarted: boolean;
  hasBudgetRequests: boolean;
  hasPendingBudgetRequest: boolean;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function KasiReportActionPanel({
  reportId,
  currentStatus,
  hasProgressStarted,
  hasBudgetRequests,
  hasPendingBudgetRequest,
}: KasiReportActionPanelProps) {
  const router = useRouter();
  const [startState, startAction, isStarting] = useActionState(
    startKasiReportProgress,
    initialState
  );
  const [progressState, progressAction, isSavingProgress] = useActionState(
    submitKasiProgressUpdate,
    initialState
  );
  const [resolveState, resolveAction, isResolving] = useActionState(
    resolveKasiReport,
    initialState
  );
  const [returnState, returnAction, isReturning] = useActionState(
    returnKasiReportAssignment,
    initialState
  );

  useActionToast(startState, router);
  useActionToast(progressState, router);
  useActionToast(resolveState, router);
  useActionToast(returnState, router);

  const localStatus =
    (startState.status === "success" || hasProgressStarted) &&
    currentStatus === "handled_by_village"
      ? "in_progress"
      : currentStatus;
  const canStart = localStatus === "handled_by_village";
  const canUpdateProgress = localStatus === "in_progress";
  const canRequestBudget =
    localStatus === "handled_by_village" && !hasPendingBudgetRequest;
  const canResolve = localStatus === "in_progress";
  const canReturnAssignment =
    ["handled_by_village", "waiting_budget"].includes(localStatus) &&
    !hasProgressStarted &&
    !hasBudgetRequests;
  const isSubmitting =
    isStarting || isSavingProgress || isResolving || isReturning;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kasi Actions</CardTitle>
        <CardDescription>
          Update handling progress, request budget, or resolve this assigned
          report.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {canStart ? (
          <form action={startAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              name="note"
              label="Start note"
              placeholder="Briefly describe the first handling step."
              required
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <PlayCircle className="mr-2 h-4 w-4" />
              {isStarting ? "Starting..." : "Mark as in progress"}
            </Button>
          </form>
        ) : null}

        {localStatus === "waiting_budget" ? (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            This report is waiting for budget review. Progress actions will be
            available after the budget request is reviewed.
          </div>
        ) : null}

        {hasPendingBudgetRequest && localStatus !== "waiting_budget" ? (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            This report already has a budget request waiting for review. You can
            submit a revision after the current request is approved or rejected.
          </div>
        ) : null}

        {canUpdateProgress ? (
          <form action={progressAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              name="note"
              label="Progress update"
              placeholder="Write the latest field handling progress."
              required
              disabled={isSubmitting}
            />
            <Input
              name="progress_photos"
              label="Progress photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting}
              helperText="Optional, maximum 5 photos. JPG, PNG, or WEBP only."
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <ClipboardEdit className="mr-2 h-4 w-4" />
              {isSavingProgress ? "Saving..." : "Save progress update"}
            </Button>
          </form>
        ) : null}

        {canRequestBudget ? (
          <Link href={`/dashboard/kasi/budget?reportId=${reportId}`}>
            <Button type="button" variant="outline" className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Prepare itemized budget
            </Button>
          </Link>
        ) : null}

        {canReturnAssignment ? (
          <form action={returnAction} className="space-y-3 border-t border-border pt-5">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              name="note"
              label="Return assignment note"
              placeholder="Explain why this report is not suitable for your section."
              required
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="w-full border-warning-200 text-warning-700 hover:bg-warning-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isReturning ? "Returning..." : "Return to admin"}
            </Button>
          </form>
        ) : null}

        {canResolve ? (
          <form action={resolveAction} className="space-y-3">
            <input type="hidden" name="report_id" value={reportId} />
            <Textarea
              name="note"
              label="Resolution note"
              placeholder="Summarize the completed handling result."
              required
              disabled={isSubmitting}
            />
            <Input
              name="progress_photos"
              label="Completion photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={isSubmitting}
              helperText="Optional final evidence before resolving."
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isResolving ? "Resolving..." : "Mark as resolved"}
            </Button>
          </form>
        ) : null}

        {!canStart &&
        !canUpdateProgress &&
        !canRequestBudget &&
        !canReturnAssignment &&
        !canResolve ? (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Actions are available only for active reports assigned to your
            section.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function useActionToast(state: ActionState, router: ReturnType<typeof useRouter>) {
  useEffect(() => {
    if (state.status === "success") {
      toast.success("Success", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Failed", {
        description: state.message,
      });
    }
  }, [state, router]);
}
