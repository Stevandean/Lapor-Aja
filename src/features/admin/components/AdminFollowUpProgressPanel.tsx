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
      toast.success("Berhasil", {
        description: startState.message,
      });

      router.refresh();
    }

    if (startState.status === "error") {
      toast.error("Gagal", {
        description: startState.message,
      });
    }
  }, [startState, router]);

  useEffect(() => {
    if (resolveState.status === "success") {
      toast.success("Berhasil", {
        description: resolveState.message,
      });

      router.refresh();
    }

    if (resolveState.status === "error") {
      toast.error("Gagal", {
        description: resolveState.message,
      });
    }
  }, [resolveState, router]);

  if (!canStartProgress && !canResolve) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Tindak Lanjut</CardTitle>
          <CardDescription>
            Kelola progress laporan setelah proses tindak lanjut dimulai.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Aksi progress admin hanya tersedia untuk laporan yang diteruskan ke
            instansi luar. Laporan yang ditangani desa dikelola oleh Kasi yang
            ditugaskan.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Tindak Lanjut</CardTitle>
        <CardDescription>
          Perbarui laporan ini setelah proses tindak lanjut dimulai.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {canStartProgress && (
          <form action={startAction}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <PlayCircle className="mr-2 h-4 w-4" />
              {isStarting ? "Memulai..." : "Tandai sedang diproses"}
            </Button>
          </form>
        )}

        {canResolve && (
          <form action={resolveAction}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isResolving ? "Menyelesaikan..." : "Tandai selesai"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
