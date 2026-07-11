"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { archiveReport } from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type AdminArchivePanelProps = {
  reportId: string;
  currentStatus: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AdminArchivePanel({
  reportId,
  currentStatus,
}: AdminArchivePanelProps) {
  const router = useRouter();

  const [state, formAction, isSubmitting] = useActionState(
    archiveReport,
    initialState
  );

  const canArchive = ["resolved", "rejected", "verified_invalid"].includes(
    currentStatus
  );

  const isArchived = currentStatus === "archived";

  useEffect(() => {
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
    <Card>
      <CardHeader>
        <CardTitle>Arsipkan Laporan</CardTitle>
        <CardDescription>
          Pindahkan laporan yang sudah selesai atau ditutup ke arsip.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isArchived && (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Laporan ini sudah diarsipkan.
          </div>
        )}

        {!isArchived && !canArchive && (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Aksi arsip hanya tersedia untuk laporan yang selesai, ditolak, atau
            tidak valid.
          </div>
        )}

        {canArchive && (
          <form action={formAction}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="w-full"
            >
              <Archive className="mr-2 h-4 w-4" />
              {isSubmitting ? "Mengarsipkan..." : "Arsipkan laporan"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
