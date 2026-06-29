"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  approveBudgetRequest,
  rejectBudgetRequest,
} from "@/src/features/village/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

type VillageBudgetReviewActionsProps = {
  requestId: string;
  requestStatus: string;
  reviewSchemaReady: boolean;
};

export function VillageBudgetReviewActions({
  requestId,
  requestStatus,
  reviewSchemaReady,
}: VillageBudgetReviewActionsProps) {
  const router = useRouter();
  const [approveState, approveAction, isApproving] = useActionState(
    approveBudgetRequest,
    initialState
  );
  const [rejectState, rejectAction, isRejecting] = useActionState(
    rejectBudgetRequest,
    initialState
  );
  const isSubmitting = isApproving || isRejecting;
  const canReview = requestStatus === "submitted" && reviewSchemaReady;

  useEffect(() => {
    if (approveState.status === "success") {
      toast.success("Budget approved", {
        description: approveState.message,
      });

      router.refresh();
    }

    if (approveState.status === "error") {
      toast.error("Approval failed", {
        description: approveState.message,
      });
    }
  }, [approveState, router]);

  useEffect(() => {
    if (rejectState.status === "success") {
      toast.success("Budget rejected", {
        description: rejectState.message,
      });

      router.refresh();
    }

    if (rejectState.status === "error") {
      toast.error("Rejection failed", {
        description: rejectState.message,
      });
    }
  }, [rejectState, router]);

  if (!reviewSchemaReady) {
    return (
      <p className="max-w-xs text-xs leading-5 text-warning-700">
        Review migration is required before approving or rejecting this request.
      </p>
    );
  }

  if (!canReview) {
    return (
      <p className="text-xs font-medium text-muted-foreground">
        Review completed
      </p>
    );
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <form action={approveAction} className="space-y-2">
        <input type="hidden" name="budget_request_id" value={requestId} />

        <Textarea
          name="review_note"
          placeholder="Approval note"
          className="min-h-20 resize-none"
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="w-full gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isApproving ? "Approving..." : "Approve"}
        </Button>
      </form>

      <form action={rejectAction} className="space-y-2 border-t border-border pt-3">
        <input type="hidden" name="budget_request_id" value={requestId} />

        <Textarea
          name="review_note"
          placeholder="Rejection reason"
          className="min-h-20 resize-none"
          required
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          className="w-full gap-2 border-danger-200 text-danger-700 hover:bg-danger-50"
        >
          <XCircle className="h-4 w-4" />
          {isRejecting ? "Rejecting..." : "Reject"}
        </Button>
      </form>
    </div>
  );
}
