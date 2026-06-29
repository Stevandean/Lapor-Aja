import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Gauge,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { StatCard } from "@/src/features/dashboard/components/StatCard";
import {
  getAdminDashboardStats,
  getRecentReports,
} from "@/src/features/dashboard/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type ReportStatus = keyof typeof REPORT_STATUS_LABELS;
type ReportPriority = keyof typeof REPORT_PRIORITY_LABELS;

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const recentReports = await getRecentReports();

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Admin Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Report Management Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor public reports, approval process, field verification, SLA
            status, and village follow-up activities.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/reports"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            View reports
          </Link>

          <Link
            href="/dashboard/admin/approval"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700"
          >
            Review pending reports
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          description="All reports submitted by citizens."
          icon={<ClipboardList className="h-5 w-5" />}
        />

        <StatCard
          title="Pending"
          value={stats.pendingReports}
          description="Reports waiting for admin review."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          title="Need Verification"
          value={stats.needVerificationReports}
          description="Reports requiring field verification."
          icon={<ShieldCheck className="h-5 w-5" />}
        />

        <StatCard
          title="In Progress"
          value={stats.inProgressReports}
          description="Reports currently being processed."
          icon={<Gauge className="h-5 w-5" />}
        />

        <StatCard
          title="Resolved"
          value={stats.resolvedReports}
          description="Reports that have been completed."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          title="SLA Overdue"
          value={stats.overdueReports}
          description="Reports that exceed SLA limits."
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Latest public reports submitted to the village reporting system.
              </CardDescription>
            </div>

            <Link
              href="/dashboard/admin/reports"
              className="hidden text-sm font-semibold text-primary hover:text-primary-700 sm:inline-flex"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent>
            {recentReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                <p className="text-sm font-medium text-foreground">
                  No reports yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Citizen reports will appear here after they submit a report.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((report) => {
                  const status = report.status as ReportStatus;
                  const priority = report.priority as ReportPriority;

                  return (
                    <div
                      key={report.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {report.title}
                          </p>

                          <Badge
                            className={
                              REPORT_STATUS_BADGE_CLASSES[status] ??
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {REPORT_STATUS_LABELS[status] ?? report.status}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.report_number} •{" "}
                          {formatDate(report.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="muted">
                          {REPORT_PRIORITY_LABELS[priority] ?? report.priority}
                        </Badge>

                        <Link
                          href={`/dashboard/admin/reports/${report.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                        >
                          Detail
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative actions for managing reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <QuickAction
              title="Review pending reports"
              description="Approve or reject newly submitted reports."
              href="/dashboard/admin/approval"
              icon={<ShieldCheck className="h-5 w-5" />}
            />

            <QuickAction
              title="Manage report data"
              description="Open the full report management table."
              href="/dashboard/admin/reports"
              icon={<ClipboardList className="h-5 w-5" />}
            />

            <QuickAction
              title="Generate letters"
              description="Prepare official letters for verified reports."
              href="/dashboard/admin/letters"
              icon={<FileText className="h-5 w-5" />}
            />

            <QuickAction
              title="Master data"
              description="Manage categories, hamlets, agencies, and SLA rules."
              href="/dashboard/admin/master-data"
              icon={<PlusCircle className="h-5 w-5" />}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}