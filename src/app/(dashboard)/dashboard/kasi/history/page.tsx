import type { ComponentProps } from "react";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiProgressHistory } from "@/src/features/kasi/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiHistoryPage() {
  const { missingSection, reports } = await getKasiProgressHistory();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Riwayat Progres</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Riwayat Penanganan Seksi
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tinjau laporan yang sudah masuk ke alur penanganan seksi, termasuk
          status aktif, anggaran, progres, dan selesai.
        </p>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penanganan</CardTitle>
          <CardDescription>
            Menampilkan laporan seksi yang sudah masuk tahap penanganan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={reports as KasiReportTableReports}
            emptyTitle={
              missingSection ? "Penugasan seksi diperlukan" : "Belum ada riwayat"
            }
            emptyDescription={
              missingSection
                ? "Minta admin, sekdes, atau kepala desa menautkan akun Anda ke seksi desa."
                : "Laporan akan muncul di sini setelah masuk penanganan seksi."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MissingSectionNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Akun Anda belum ditautkan ke seksi desa. Penugasan seksi diperlukan
      sebelum riwayat penanganan dapat muncul di sini.
    </div>
  );
}
