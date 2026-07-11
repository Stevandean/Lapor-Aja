"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { toggleVillageSectionStatus } from "@/src/features/master-data/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

type VillageSectionStatusButtonProps = {
  sectionId: string;
  isActive: boolean;
};

export function VillageSectionStatusButton({
  sectionId,
  isActive,
}: VillageSectionStatusButtonProps) {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    toggleVillageSectionStatus,
    initialState
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Berhasil", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Gagal", {
        description: state.message,
      });
    }
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="section_id" value={sectionId} />
      <input type="hidden" name="is_active" value={String(isActive)} />

      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        <Power className="mr-2 h-4 w-4" />
        {isPending ? "Memperbarui..." : isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </form>
  );
}
