"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { processReportFollowUp } from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type AgencyOption = {
  id: string;
  name: string;
};

type AdminFollowUpPanelProps = {
  reportId: string;
  currentStatus: string;
  followUpType: string;
  agencies: AgencyOption[];
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AdminFollowUpPanel({
  reportId,
  currentStatus,
  followUpType,
  agencies,
}: AdminFollowUpPanelProps) {
  const router = useRouter();

  const [state, formAction, isSubmitting] = useActionState(
    processReportFollowUp,
    initialState
  );

  const canProcess = currentStatus === "classified";
  const requiresAgency = followUpType === "diteruskan_ke_dinas";
  const agencyOptionsAvailable = agencies.length > 0;

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
        <CardTitle>Aksi Tindak Lanjut</CardTitle>
        <CardDescription>
          Proses laporan yang sudah diklasifikasi berdasarkan jenis tindak
          lanjut yang dipilih.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!canProcess && (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Aksi tindak lanjut hanya tersedia untuk laporan dengan status sudah
            diklasifikasi.
          </div>
        )}

        {canProcess && (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="report_id" value={reportId} />

            <div className="rounded-2xl border border-info-100 bg-info-50 p-4 text-sm leading-6 text-info-700">
              Jenis tindak lanjut saat ini:{" "}
              <span className="font-semibold">{formatEnum(followUpType)}</span>
            </div>

            {requiresAgency ? (
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <label
                      className="form-label"
                      htmlFor={`agency-${reportId}`}
                    >
                      Instansi Tujuan
                    </label>

                    <select
                      id={`agency-${reportId}`}
                      name="agency_id"
                      className="form-input"
                      defaultValue=""
                      required
                      disabled={!agencyOptionsAvailable || isSubmitting}
                    >
                      <option value="">Pilih instansi tujuan</option>

                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Field ini wajib diisi karena laporan akan diteruskan ke
                      instansi luar.
                    </p>

                    {!agencyOptionsAvailable ? (
                      <p className="mt-2 text-xs font-medium text-danger-700">
                        Belum ada instansi aktif. Tambahkan instansi aktif di
                        Data Master terlebih dahulu.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={
                isSubmitting || (requiresAgency && !agencyOptionsAvailable)
              }
              className="w-full"
            >
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? "Memproses..." : "Proses tindak lanjut"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    ditangani_desa: "Ditangani Desa",
    diteruskan_ke_dinas: "Diteruskan ke Dinas",
    diusulkan_musrenbang: "Diusulkan Musrenbang",
    menunggu_anggaran: "Menunggu Anggaran",
    belum_ditentukan: "Belum Ditentukan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
