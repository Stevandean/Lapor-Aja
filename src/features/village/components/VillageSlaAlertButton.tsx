"use client";

import { useActionState, useEffect } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { sendVillageSlaAlerts } from "@/src/features/village/slaActions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function VillageSlaAlertButton() {
  const [state, action, isPending] = useActionState(
    sendVillageSlaAlerts,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("SLA alerts processed", {
        description: state.message,
      });
    }

    if (state.status === "error") {
      toast.error("SLA alerts failed", {
        description: state.message,
      });
    }
  }, [state]);

  return (
    <form action={action}>
      <Button type="submit" variant="outline" disabled={isPending}>
        <BellRing className="mr-2 h-4 w-4" />
        {isPending ? "Sending alerts..." : "Send SLA Alerts"}
      </Button>
    </form>
  );
}
