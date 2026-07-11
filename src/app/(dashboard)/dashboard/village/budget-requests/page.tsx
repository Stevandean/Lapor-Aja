import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowLeft, Clock3, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { VillageBudgetRequestsTable } from "@/src/features/village/components/VillageBudgetRequestsTable";
import { getVillageBudgetRequestsData } from "@/src/features/village/queries";

type BudgetRequestRows = ComponentProps<
  typeof VillageBudgetRequestsTable
>["requests"];

export default async function VillageBudgetRequestsPage() {
  const { budgetSchemaReady, reviewSchemaReady, stats, requests } =
    await getVillageBudgetRequestsData();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard desa
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">
            Pengajuan Anggaran
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Monitoring Pengajuan Anggaran Kasi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau kebutuhan anggaran yang diajukan Kasi dari laporan yang
            ditugaskan ke tiap seksi desa.
          </p>
        </div>
      </section>

      {!budgetSchemaReady ? <BudgetSchemaNotice /> : null}
      {budgetSchemaReady && !reviewSchemaReady ? <ReviewSchemaNotice /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <VillageStatCard
          title="Pengajuan"
          value={stats.totalRequests}
          description="Pengajuan anggaran yang dikirim oleh Kasi."
          icon={<Wallet className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Total Estimasi"
          value={formatCurrency(stats.totalEstimatedBudget)}
          description="Akumulasi nilai estimasi anggaran."
          icon={<Wallet className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Menunggu Anggaran"
          value={stats.waitingBudgetReports}
          description="Laporan terkait yang sedang menunggu anggaran."
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pengajuan Anggaran Terkirim</CardTitle>
          <CardDescription>
            Menampilkan pengajuan anggaran terbaru dari penanganan tingkat
            seksi.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {budgetSchemaReady ? (
            <VillageBudgetRequestsTable
              requests={requests as BudgetRequestRows}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">
                Tabel pengajuan anggaran belum siap
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Jalankan migration anggaran di Supabase sebelum meninjau
                pengajuan anggaran Kasi.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSchemaNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Kolom review anggaran belum tersedia. Jalankan migration{" "}
      <span className="font-semibold">
        supabase/migrations/202606240002_budget_request_review.sql
      </span>{" "}
      di Supabase sebelum menyetujui atau menolak pengajuan.
    </div>
  );
}

function BudgetSchemaNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Tabel pengajuan anggaran belum tersedia. Jalankan migration{" "}
      <span className="font-semibold">
        supabase/migrations/202606240001_kasi_progress_workflow.sql
      </span>{" "}
      di Supabase, lalu muat ulang halaman ini.
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
