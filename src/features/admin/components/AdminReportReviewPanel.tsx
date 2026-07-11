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
      toast.success("Berhasil", {
        description: approveState.message,
      });

      router.refresh();
    }

    if (approveState.status === "error") {
      toast.error("Gagal", {
        description: approveState.message,
      });
    }
  }, [approveState, router]);

  useEffect(() => {
    if (rejectState.status === "success") {
      toast.success("Berhasil", {
        description: rejectState.message,
      });

      router.refresh();
    }

    if (rejectState.status === "error") {
      toast.error("Gagal", {
        description: rejectState.message,
      });
    }
  }, [rejectState, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tinjauan Admin</CardTitle>
        <CardDescription>
          Tinjau laporan masyarakat, tentukan kategori dan dusun, lalu kirim ke
          tahap verifikasi.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isPending && (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            Laporan ini sudah ditinjau. Aksi tinjauan hanya tersedia untuk
            laporan dengan status menunggu.
          </div>
        )}

        <form action={approveAction} className="space-y-4">
          <input type="hidden" name="report_id" value={reportId} />

          <Select
            label="Kategori"
            name="category_id"
            required
            defaultValue=""
            disabled={!isPending || isSubmitting}
          >
            <option value="" disabled>
              Pilih kategori
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            label="Dusun"
            name="dusun_id"
            required
            defaultValue=""
            disabled={!isPending || isSubmitting}
          >
            <option value="" disabled>
              Pilih dusun
            </option>

            {hamlets.map((hamlet) => (
              <option key={hamlet.id} value={hamlet.id}>
                {hamlet.name}
              </option>
            ))}
          </Select>

          <Select
            label="Prioritas"
            name="priority"
            required
            defaultValue={defaultPriority}
            disabled={!isPending || isSubmitting || !hasPriorityOptions}
          >
            <option value="" disabled>
              Pilih prioritas
            </option>

            {priorityOptions.map((option) => (
              <option key={option.priority} value={option.priority}>
                {formatPriority(option.priority)} - Verifikasi{" "}
                {formatHours(option.verification_hours)}, Resolusi{" "}
                {formatHours(option.resolution_hours)}
              </option>
            ))}
          </Select>

          {!hasPriorityOptions ? (
            <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700">
              Belum ada prioritas SLA yang aktif. Aktifkan minimal satu aturan
              SLA sebelum menyetujui laporan.
            </div>
          ) : null}

          <Textarea
            label="Catatan admin"
            name="admin_note"
            placeholder="Tambahkan catatan internal untuk laporan ini."
            disabled={!isPending || isSubmitting}
          />

          <Button
            type="submit"
            disabled={!isPending || isSubmitting || !hasPriorityOptions}
            className="w-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {isApproving ? "Menyetujui..." : "Setujui dan kirim verifikasi"}
          </Button>
        </form>

        <div className="border-t border-border pt-6">
          <form action={rejectAction} className="space-y-4">
            <input type="hidden" name="report_id" value={reportId} />

            <Textarea
              label="Alasan penolakan"
              name="rejection_reason"
              placeholder="Jelaskan alasan laporan ini ditolak."
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
              {isRejecting ? "Menolak..." : "Tolak laporan"}
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
    return `${hours / 24} hari`;
  }

  return `${hours} jam`;
}
