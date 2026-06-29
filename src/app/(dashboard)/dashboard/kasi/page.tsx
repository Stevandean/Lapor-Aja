import Link from "next/link";
import type { ComponentProps } from "react";
import { CheckCircle2, ClipboardList, Clock3, Gauge, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiDashboardData } from "@/src/features/kasi/queries";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiDashboardPage() {
  const { missingSection, stats, recentReports } = await getKasiDashboardData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Kasi Dashboard</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Internal Report Handling
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor reports assigned to your village section and prepare the
            handling workflow before progress actions are enabled.
          </p>
        </div>

        <Link href="/dashboard/kasi/reports">
          <Button>
            <ClipboardList className="mr-2 h-4 w-4" />
            Assigned Reports
          </Button>
        </Link>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <VillageStatCard
          title="Assigned"
          value={stats.totalAssignedReports}
          description="Reports assigned to your section."
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Active"
          value={stats.activeReports}
          description="Reports still being handled."
          icon={<Gauge className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Waiting Budget"
          value={stats.waitingBudgetReports}
          description="Reports needing budget planning."
          icon={<Wallet className="h-5 w-5" />}
        />
        <VillageStatCard
          title="In Progress"
          value={stats.inProgressReports}
          description="Reports currently in progress."
          icon={<Clock3 className="h-5 w-5" />}
        />
        <VillageStatCard
          title="Resolved"
          value={stats.resolvedReports}
          description="Completed assigned reports."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assigned Reports</CardTitle>
          <CardDescription>
            Latest reports assigned to your section.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={recentReports as KasiReportTableReports}
            emptyTitle={
              missingSection ? "Section assignment required" : undefined
            }
            emptyDescription={
              missingSection
                ? "Ask an admin, sekdes, or kepala desa to assign your account to a village section."
                : undefined
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
      Your account has not been assigned to a village section yet. Please ask
      the admin, sekdes, or kepala desa to update your user profile.
    </div>
  );
}
