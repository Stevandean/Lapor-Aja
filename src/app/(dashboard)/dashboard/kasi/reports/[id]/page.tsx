import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { KasiReportDetail } from "@/src/features/kasi/components/KasiReportDetail";
import { getKasiReportDetail } from "@/src/features/kasi/queries";

type KasiReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function KasiReportDetailPage({
  params,
}: KasiReportDetailPageProps) {
  const { id } = await params;
  const detail = await getKasiReportDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Link
            href="/dashboard/kasi/reports"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assigned reports
          </Link>

          <p className="mt-5 text-sm font-semibold text-primary">
            {detail.report.report_number}
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {detail.report.title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review report context, location, evidence, and status history for
            your section handling workflow.
          </p>
        </div>

        <Link href="/dashboard/kasi/reports">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Reports
          </Button>
        </Link>
      </section>

      <KasiReportDetail detail={detail} />
    </div>
  );
}
