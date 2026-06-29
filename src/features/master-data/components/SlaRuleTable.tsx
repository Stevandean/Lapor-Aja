"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheck, CircleX, Pencil, Timer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  toggleSlaRuleStatus,
  updateSlaRule,
} from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

type Priority = "rendah" | "sedang" | "tinggi" | "darurat";

type SlaRule = {
  id: string;
  priority: Priority;
  verification_hours: number;
  resolution_hours: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SlaRuleTableProps = {
  rules: SlaRule[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  rendah: "Low",
  sedang: "Medium",
  tinggi: "High",
  darurat: "Emergency",
};

export function SlaRuleTable({ rules }: SlaRuleTableProps) {
  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Timer className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-semibold text-foreground">
          No SLA rules found
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Please seed the default SLA rules in Supabase first.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Verification</th>
              <th className="px-5 py-4 font-semibold">Resolution</th>
              <th className="px-5 py-4 font-semibold">Description</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {rules.map((rule) => (
              <tr key={rule.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <p className="font-semibold text-foreground">
                    {PRIORITY_LABELS[rule.priority] ?? rule.priority}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {rule.priority}
                  </p>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatHours(rule.verification_hours)}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatHours(rule.resolution_hours)}
                </td>

                <td className="px-5 py-4">
                  <p className="line-clamp-2 max-w-xs text-muted-foreground">
                    {rule.description || "-"}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <StatusBadge isActive={rule.is_active} />
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <SlaRuleEditModal rule={rule} />
                    <SlaRuleStatusButton rule={rule} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {rules.map((rule) => (
          <div key={rule.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  {PRIORITY_LABELS[rule.priority] ?? rule.priority}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {rule.description || "-"}
                </p>
              </div>

              <StatusBadge isActive={rule.is_active} />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <InfoItem
                label="Verification"
                value={formatHours(rule.verification_hours)}
              />
              <InfoItem
                label="Resolution"
                value={formatHours(rule.resolution_hours)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <SlaRuleEditModal rule={rule} />
              <SlaRuleStatusButton rule={rule} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaRuleEditModal({ rule }: { rule: SlaRule }) {
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState(
    updateSlaRule,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
      setOpen(false);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Edit SLA Rule"
        description="Update verification and resolution time limits for this priority."
      >
        <form action={action} className="space-y-5">
          <input type="hidden" name="rule_id" value={rule.id} />

          <div className="rounded-2xl border border-info-100 bg-info-50 p-4 text-sm text-info-700">
            Priority:{" "}
            <span className="font-semibold">
              {PRIORITY_LABELS[rule.priority] ?? rule.priority}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="form-label"
                htmlFor={`verification-${rule.id}`}
              >
                Verification Hours
              </label>

              <Input
                id={`verification-${rule.id}`}
                name="verification_hours"
                type="number"
                min={1}
                defaultValue={rule.verification_hours}
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor={`resolution-${rule.id}`}>
                Resolution Hours
              </label>

              <Input
                id={`resolution-${rule.id}`}
                name="resolution_hours"
                type="number"
                min={1}
                defaultValue={rule.resolution_hours}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor={`description-${rule.id}`}>
              Description
            </label>

            <Textarea
              id={`description-${rule.id}`}
              name="description"
              defaultValue={rule.description ?? ""}
              rows={4}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SlaRuleStatusButton({ rule }: { rule: SlaRule }) {
  const [state, action, isPending] = useActionState(
    toggleSlaRuleStatus,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success(state.message);
    }

    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={action}>
      <input type="hidden" name="rule_id" value={rule.id} />
      <input
        type="hidden"
        name="action"
        value={rule.is_active ? "deactivate" : "activate"}
      />

      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {rule.is_active ? "Deactivate" : "Activate"}
      </Button>
    </form>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="bg-success-50 text-success-700">
        <CircleCheck className="mr-1 h-3.5 w-3.5" />
        Active
      </Badge>
    );
  }

  return (
    <Badge className="bg-danger-50 text-danger-700">
      <CircleX className="mr-1 h-3.5 w-3.5" />
      Inactive
    </Badge>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatHours(hours: number) {
  if (hours % 24 === 0) {
    return `${hours / 24} day${hours / 24 > 1 ? "s" : ""}`;
  }

  return `${hours} hour${hours > 1 ? "s" : ""}`;
}