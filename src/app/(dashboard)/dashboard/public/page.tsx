import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  PlusCircle,
  Send,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { CitizenStatCard } from "@/src/features/citizen/components/CitizenStatCard";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { getCitizenDashboardData } from "@/src/features/citizen/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { Badge } from "@/src/components/ui/Badge";

export default async function PublicDashboardPage() {
  const { reports, stats } = await getCitizenDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Citizen</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Submit public reports and monitor the latest progress of reports
            you have sent to the village.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/public/reports">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              My Reports
            </Button>
          </Link>

          <CreateReportModal />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CitizenStatCard
          title="Total Reports"
          value={stats.totalReports}
          description="All reports you submitted."
          icon={<FileText className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Pending"
          value={stats.pendingReports}
          description="Waiting for admin review."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="In Process"
          value={stats.inProcessReports}
          description="Currently being handled."
          icon={<Send className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Resolved"
          value={stats.resolvedReports}
          description="Reports that have been resolved."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <CitizenStatCard
          title="Archived"
          value={stats.archivedReports}
          description="Reports stored in archive."
          icon={<Archive className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Showing the latest reports you submitted.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
              <p className="text-sm font-semibold text-foreground">
                No recent reports
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first report to start tracking its progress.
              </p>

              <Link href="/reports/create">
                <Button className="mt-5">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number}
                    </p>
                  </div>

                  <StatusBadge status={report.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return (
    <Badge
      className={
        REPORT_STATUS_BADGE_CLASSES[status as StatusKey] ??
        "bg-muted text-muted-foreground border-border"
      }
    >
      {REPORT_STATUS_LABELS[status as StatusKey] ?? status}
    </Badge>
  );
}
