import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  GitMerge,
  PauseCircle,
  Timer,
} from "lucide-react";
import { VillageSlaTable } from "@/src/features/village/components/VillageSlaTable";
import { VillageSlaAlertButton } from "@/src/features/village/components/VillageSlaAlertButton";
import { VillageStatCard } from "@/src/features/village/components/VillageStatCard";
import { getVillageSlaMonitoringData } from "@/src/features/village/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageSlaPage() {
  const { totalReports, slaStats, reports } = await getVillageSlaMonitoringData();

  const onTimeCount = getCount(slaStats, "on_time");
  const atRiskCount = getCount(slaStats, "at_risk");
  const overdueCount = getCount(slaStats, "overdue");
  const completedCount = getCount(slaStats, "completed");
  const pausedBudgetCount = getCount(slaStats, "paused_budget");
  const mergedCount = getCount(slaStats, "merged");
  const notSetCount = getCount(slaStats, "not_set");

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/dashboard/village"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to village dashboard
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">SLA Monitoring</p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Service Level Monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Monitor effective report SLA status, including active deadlines,
              budget pauses, merged duplicates, and completed workflows.
            </p>
          </div>

          <VillageSlaAlertButton />
        </div>
      </section>

      {notSetCount > 0 && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Some reports do not have SLA deadlines yet. This is expected for
          reports still waiting for admin review or reports that have not
          entered the timed workflow.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <VillageStatCard
          title="Total Reports"
          value={totalReports}
          description="All reports in monitoring."
          icon={<Timer className="h-5 w-5" />}
        />

        <VillageStatCard
          title="On Time"
          value={onTimeCount}
          description="Reports still within SLA."
          icon={<Clock3 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="At Risk"
          value={atRiskCount}
          description="Reports close to SLA deadline."
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Overdue"
          value={overdueCount}
          description="Reports that exceeded SLA."
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Completed"
          value={completedCount}
          description="Terminal workflows."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Paused Budget"
          value={pausedBudgetCount}
          description="SLA paused for budget."
          icon={<PauseCircle className="h-5 w-5" />}
        />

        <VillageStatCard
          title="Merged"
          value={mergedCount}
          description="Follows master report."
          icon={<GitMerge className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>SLA Report List</CardTitle>
          <CardDescription>
            Showing report SLA status, verification deadline, and resolution
            deadline.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <VillageSlaTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}

function getCount(items: { label: string; count: number }[], label: string) {
  return items.find((item) => item.label === label)?.count ?? 0;
}
