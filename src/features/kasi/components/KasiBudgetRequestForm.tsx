"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import { submitKasiBudgetRequest } from "@/src/features/kasi/actions";
import type { ActionState } from "@/src/types/action";

type EligibleReport = {
  id: string;
  report_number: string;
  title: string;
};

type KasiBudgetRequestFormProps = {
  reports: EligibleReport[];
  defaultReportId?: string;
};

type BudgetItemDraft = {
  id: string;
  itemName: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

function createEmptyItem(): BudgetItemDraft {
  return {
    id: crypto.randomUUID(),
    itemName: "",
    description: "",
    quantity: "1",
    unit: "unit",
    unitPrice: "",
  };
}

export function KasiBudgetRequestForm({
  reports,
  defaultReportId = "",
}: KasiBudgetRequestFormProps) {
  const router = useRouter();
  const [state, action, isSubmitting] = useActionState(
    submitKasiBudgetRequest,
    initialState
  );
  const [items, setItems] = useState<BudgetItemDraft[]>([createEmptyItem()]);

  const totalEstimate = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
          return sum;
        }

        return sum + quantity * unitPrice;
      }, 0),
    [items]
  );

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

  function updateItem(
    itemId: string,
    field: keyof Omit<BudgetItemDraft, "id">,
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, createEmptyItem()]);
  }

  function removeItem(itemId: string) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.id !== itemId)
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          No reports available for budget request
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Reports can be proposed for budgeting after they are assigned to your
          section and enter village handling or in-progress status.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Select
        name="report_id"
        label="Assigned report"
        defaultValue={defaultReportId}
        required
        disabled={isSubmitting}
      >
        <option value="" disabled>
          Select assigned report
        </option>
        {reports.map((report) => (
          <option key={report.id} value={report.id}>
            {report.report_number} - {report.title}
          </option>
        ))}
      </Select>

      <Textarea
        name="summary_note"
        label="Budget need summary"
        placeholder="Explain why this report needs a budget and what will be purchased or done."
        required
        disabled={isSubmitting}
      />

      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Estimate Items
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add materials, labor, transport, or service items.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add item
          </Button>
        </div>

        {items.map((item, index) => {
          const subtotal =
            Number(item.quantity || 0) * Number(item.unitPrice || 0);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Item {index + 1}
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={isSubmitting || items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Input
                  name="item_name"
                  label="Item name"
                  placeholder="Example: Cement"
                  value={item.itemName}
                  onChange={(event) =>
                    updateItem(item.id, "itemName", event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />

                <Input
                  name="item_description"
                  label="Description"
                  placeholder="Optional item detail"
                  value={item.description}
                  onChange={(event) =>
                    updateItem(item.id, "description", event.target.value)
                  }
                  disabled={isSubmitting}
                />

                <Input
                  name="item_quantity"
                  label="Quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(item.id, "quantity", event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />

                <Input
                  name="item_unit"
                  label="Unit"
                  placeholder="sak, meter, hari"
                  value={item.unit}
                  onChange={(event) =>
                    updateItem(item.id, "unit", event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />

                <Input
                  name="item_unit_price"
                  label="Unit price"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Example: 75000"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateItem(item.id, "unitPrice", event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />

                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Subtotal
                  </p>
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {formatCurrency(Number.isFinite(subtotal) ? subtotal : 0)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-primary-700">
            Total estimated budget
          </p>
          <p className="mt-1 text-2xl font-bold text-primary-700">
            {formatCurrency(totalEstimate)}
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          <Wallet className="mr-2 h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit budget request"}
        </Button>
      </div>
    </form>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
