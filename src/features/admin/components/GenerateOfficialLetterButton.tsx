"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { createOfficialLetter } from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function GenerateOfficialLetterButton({
  reportId,
}: {
  reportId: string;
}) {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    createOfficialLetter,
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
      <input type="hidden" name="report_id" value={reportId} />

      <Button type="submit" disabled={isPending} size="sm">
        <Wand2 className="mr-2 h-4 w-4" />
        {isPending ? "Membuat surat..." : "Buat surat"}
      </Button>
    </form>
  );
}
