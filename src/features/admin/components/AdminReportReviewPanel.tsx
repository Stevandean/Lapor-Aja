"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  approveReportForVerification,
  rejectReport,
} from "@/src/features/admin/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import type { ActionState } from "@/src/types/action";

type OptionItem = {
  id: string;
  name: string;
};

type PriorityOption = {
  priority: "rendah" | "sedang" | "tinggi" | "darurat";
  verification_hours: number;
  resolution_hours: number;
};

type AdminReportReviewPanelProps = {
  reportId: string;
  currentStatus: string;
  categories: OptionItem[];
  hamlets: OptionItem[];
  priorityOptions: PriorityOption[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AdminReportReviewPanel({
  reportId,
  currentStatus,
  categories,
  hamlets,
  priorityOptions,
}: AdminReportReviewPanelProps) {
  const router = useRouter();

  const [approveState, approveAction, isApproving] = useActionState(
    approveReportForVerification,
    initialState
  );

  const [rejectState, rejectAction, isRejecting] = useActionState(
    rejectReport,
    initialState
  );

  const isPending = currentStatus === "pending";
  const isSubmitting = isApproving || isRejecting;

  const hasPriorityOptions = priorityOptions.length > 0;
  const defaultPriority = priorityOptions.some(
    (option) => option.priority === "sedang"
  )
    ? "sedang"
    : priorityOptions[0]?.priority ?? "";

  useEffect(() => {
    if (approveState.status === "success") {
      toast.success("Success", {
        description: approveState.message,
      });

      router.refresh();
    }

    if (approveState.status === "error") {
      toast.error("Failed", {
        description: approveState.message,
      });
    }
  }, [approveState, router]);

  useEffect(() => {
    if (rejectState.status === "success") {
      toast.success("Success", {
        description: rejectState.message,
      });

      router.refresh();
    }

    if (rejectState.status === "error") {
      toast.error("Failed", {
        description: rejectState.message,
      });
    }
  }, [rejectState, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Review</CardTitle>
        <CardDescription>
          Review the citizen report, assign category and hamlet, then send it to
          verification.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isPending && (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            This report has already been reviewed. Review actions are only
            available for reports with pending status.
          </div>
        )}

        <form action={approveAction} className="space-y-4">
          <input type="hidden" name="report_id" value={reportId} />

          <Select
            label="Category"
            name="category_id"
            required
            defaultValue=""
            disabled={!isPending || isSubmitting}
          >
            <option value="" disabled>
              Select category
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            label="Hamlet"
            name="dusun_id"
            required
            defaultValue=""
            disabled={!isPending || isSubmitting}
          >
            <option value="" disabled>
              Select hamlet
            </option>

            {hamlets.map((hamlet) => (
              <option key={hamlet.id} value={hamlet.id}>
                {hamlet.name}
              </option>
            ))}
          </Select>

          <Select
            label="Priority"
            name="priority"
            required
            defaultValue={defaultPriority}
            disabled={!isPending || isSubmitting || !hasPriorityOptions}
          >
            <option value="" disabled>
              Select priority
            </option>

            {priorityOptions.map((option) => (
              <option key={option.priority} value={option.priority}>
                {formatPriority(option.priority)} — Verification{" "}
                {formatHours(option.verification_hours)}, Resolution{" "}
                {formatHours(option.resolution_hours)}
              </option>
            ))}
          </Select>

          {!hasPriorityOptions ? (
            <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700">
              No active SLA priority is available. Please activate at least one SLA rule
              before approving reports.
            </div>
          ) : null}

          <Textarea
            label="Admin note"
            name="admin_note"
            placeholder="Add an internal note for this report."
            disabled={!isPending || isSubmitting}
          />

          <Button
            type="submit"
            disabled={!isPending || isSubmitting || !hasPriorityOptions}
            className="w-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isApproving ? "Approving..." : "Approve and send to verification"}
          </Button>
        </form>

        <div className="border-t border-border pt-6">
          <form action={rejectAction} className="space-y-4">
            <input type="hidden" name="report_id" value={reportId} />

            <Textarea
              label="Rejection reason"
              name="rejection_reason"
              placeholder="Explain why this report is rejected."
              required
              disabled={!isPending || isSubmitting}
            />

            <Button
              type="submit"
              variant="outline"
              disabled={!isPending || isSubmitting}
              className="w-full border-danger-200 text-danger-700 hover:bg-danger-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isRejecting ? "Rejecting..." : "Reject report"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function formatPriority(priority: string) {
  const labels: Record<string, string> = {
    rendah: "Rendah",
    sedang: "Sedang",
    tinggi: "Tinggi",
    darurat: "Darurat",
  };

  return labels[priority] ?? priority;
}

function formatHours(hours: number) {
  if (hours % 24 === 0) {
    return `${hours / 24} day${hours / 24 > 1 ? "s" : ""}`;
  }

  return `${hours} hour${hours > 1 ? "s" : ""}`;
}