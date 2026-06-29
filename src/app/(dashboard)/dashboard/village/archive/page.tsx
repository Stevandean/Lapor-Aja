import Link from "next/link";
import { Archive, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { VillageArchiveTable } from "@/src/features/village/components/VillageArchiveTable";
import { getVillageArchivedReports } from "@/src/features/village/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";

export default async function VillageArchivePage() {
  const reports = await getVillageArchivedReports();

  const resolvedBeforeArchive = reports.filter(
    (report) => report.resolved_at
  ).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
            <p className="text-sm font-semibold text-primary">Archive</p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Archived Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review reports that have been completed and archived in the village
            reporting workflow.
            </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ArchiveInfoCard
          title="Archived Reports"
          value={reports.length}
          description="Reports currently stored in archive."
          icon={<Archive className="h-5 w-5" />}
        />

        <ArchiveInfoCard
          title="Resolved Before Archive"
          value={resolvedBeforeArchive}
          description="Reports completed before being archived."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <ArchiveInfoCard
          title="Archive Purpose"
          value="Read-only"
          description="Used for monitoring, accountability, and record keeping."
          icon={<Clock3 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Archived Report List</CardTitle>

          <CardDescription>
            Showing archived reports with reporter, category, hamlet, priority,
            and follow-up information.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <VillageArchiveTable reports={reports as any} />
        </CardContent>
      </Card>
    </div>
  );
}

function ArchiveInfoCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}