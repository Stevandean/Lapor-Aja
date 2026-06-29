import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileX2,
  MapPinned,
} from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { HamletHeadStatCard } from "@/src/features/hamlet-head/components/HamletHeadStatCard";
import { getHamletHeadDashboardData } from "@/src/features/hamlet-head/queries";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type RecentReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
};

export default async function HamletHeadDashboardPage() {
  const { stats, recentReports, missingHamlet } =
    await getHamletHeadDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Hamlet Head Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Verification Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor reports assigned to your hamlet and manage field
            verification activities.
          </p>
        </div>

        <Link href="/dashboard/hamlet-head/verification">
          <Button>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Open verification list
          </Button>
        </Link>
      </section>

      {missingHamlet && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Your account has not been assigned to a hamlet yet. Please ask the
          admin to set your hamlet in the profile data.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <HamletHeadStatCard
          title="Assigned Reports"
          value={stats.totalAssignedReports}
          description="Total reports assigned to your hamlet."
          icon={<ClipboardList className="h-5 w-5" />}
        />

        <HamletHeadStatCard
          title="Need Verification"
          value={stats.needVerificationReports}
          description="Reports waiting for field verification."
          icon={<MapPinned className="h-5 w-5" />}
        />

        <HamletHeadStatCard
          title="Verified Valid"
          value={stats.verifiedValidReports}
          description="Reports confirmed as valid."
          icon={<FileCheck2 className="h-5 w-5" />}
        />

        <HamletHeadStatCard
          title="Verified Invalid"
          value={stats.verifiedInvalidReports}
          description="Reports marked as invalid."
          icon={<FileX2 className="h-5 w-5" />}
        />

        <HamletHeadStatCard
          title="Resolved"
          value={stats.resolvedReports}
          description="Reports completed by the workflow."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assigned Reports</CardTitle>
          <CardDescription>
            Latest reports assigned to your hamlet based on recent updates.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <RecentReportList reports={recentReports as RecentReport[]} />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentReportList({ reports }: { reports: RecentReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          No assigned reports yet
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Reports will appear here after admin assigns them to your hamlet.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {report.title}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {report.report_number} • {getRelationName(report.category)} •{" "}
              {formatDate(report.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">
              {REPORT_PRIORITY_LABELS[report.priority] ?? report.priority}
            </Badge>

            <Badge
              className={
                REPORT_STATUS_BADGE_CLASSES[report.status] ??
                "bg-muted text-muted-foreground"
              }
            >
              {REPORT_STATUS_LABELS[report.status] ?? report.status}
            </Badge>

            {report.status === "need_verification" && (
              <Link
                href={`/dashboard/hamlet-head/verification/${report.id}`}
                className="text-sm font-semibold text-primary hover:text-primary-700"
              >
                Verify
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}