import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowLeft, ClipboardList, Wallet } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { KasiBudgetRequestForm } from "@/src/features/kasi/components/KasiBudgetRequestForm";
import { getKasiBudgetPageData } from "@/src/features/kasi/queries";

type KasiBudgetPageProps = {
  searchParams: Promise<{
    reportId?: string;
  }>;
};

type EligibleReports = ComponentProps<typeof KasiBudgetRequestForm>["reports"];

export default async function KasiBudgetPage({
  searchParams,
}: KasiBudgetPageProps) {
  const [{ reportId }, data] = await Promise.all([
    searchParams,
    getKasiBudgetPageData(),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/kasi"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard Kasi
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">
            Pengajuan Anggaran
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pengajuan Anggaran Per Item
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Siapkan estimasi biaya detail untuk laporan yang membutuhkan
            alokasi anggaran desa sebelum penanganan dapat dilanjutkan.
          </p>
        </div>
      </section>

      {data.missingSection ? <MissingSectionNotice /> : null}
      {!data.budgetSchemaReady ? <BudgetSchemaNotice /> : null}

      {data.budgetSchemaReady ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Pengajuan Anggaran Baru
              </CardTitle>
              <CardDescription>
                Tambahkan tiap item estimasi agar pimpinan dapat meninjau
                pengajuan anggaran dengan jelas.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <KasiBudgetRequestForm
                reports={data.eligibleReports as EligibleReports}
                defaultReportId={reportId}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Pengajuan Terkirim
              </CardTitle>
              <CardDescription>
                Pengajuan anggaran yang dikirim oleh seksi Anda.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <BudgetRequestHistory requests={data.budgetRequests} />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function MissingSectionNotice() {
  return (
    <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
      Akun Anda belum ditautkan ke seksi desa. Silakan minta admin, sekdes,
      atau kepala desa memperbarui profil pengguna Anda.
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

function BudgetRequestHistory({
  requests,
}: {
  requests: {
    id: string;
    summary_note: string;
    total_estimated_budget: number | string;
    status: string;
    created_at: string;
    report: {
      report_number: string;
      title: string;
    } | null;
    items: {
      id: string;
      item_name: string;
      description: string | null;
      quantity: number | string;
      unit: string;
      unit_price: number | string;
      subtotal: number | string;
    }[];
  }[];
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          Belum ada pengajuan anggaran
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Pengajuan yang dikirim akan muncul di sini setelah Anda membuatnya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {request.report?.title ?? "Laporan tidak diketahui"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {request.report?.report_number ?? "-"} -{" "}
                {formatDateTime(request.created_at)}
              </p>
            </div>

            <Badge variant="muted">{formatEnum(request.status)}</Badge>
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground">
            {request.summary_note}
          </p>

          <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 p-3">
            <p className="text-xs font-medium text-primary-700">
              Total estimasi
            </p>
            <p className="mt-1 text-xl font-bold text-primary-700">
              {formatCurrency(request.total_estimated_budget)}
            </p>
          </div>

          {request.items.length > 0 ? (
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {request.items.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.item_name}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Number(item.quantity)} {item.unit} x{" "}
                    {formatCurrency(item.unit_price)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    submitted: "Menunggu Peninjauan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
