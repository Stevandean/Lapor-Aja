import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { VillageAnalyticsCard } from "@/src/features/village/components/VillageAnalyticsCard";
import { VillageAnalyticsCharts } from "@/src/features/village/components/VillageAnalyticsCharts";
import { getVillageAnalyticsData } from "@/src/features/village/queries";
import {
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageAnalyticsPage() {
  const {
    totalReports,
    statusStats,
    priorityStats,
    categoryStats,
    hamletStats,
  } = await getVillageAnalyticsData();

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

        <div className="mt-5">
          <p className="text-sm font-semibold text-primary">Analytics</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Report Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Analyze report distribution by status, priority, category, and
            hamlet to support village-level decision making.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics Summary
          </CardTitle>
          <CardDescription>
            Total reports currently recorded in the village reporting system.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Reports
            </p>

            <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              {totalReports}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              This number includes active, resolved, rejected, and archived
              reports.
            </p>
          </div>
        </CardContent>
      </Card>

      <VillageAnalyticsCharts
        total={totalReports}
        statusStats={statusStats}
        priorityStats={priorityStats}
        categoryStats={categoryStats}
        hamletStats={hamletStats}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <VillageAnalyticsCard
          title="Reports by Status"
          description="Distribution of reports based on the current workflow status."
          items={statusStats}
          total={totalReports}
          formatLabel={(label) =>
            REPORT_STATUS_LABELS[
              label as keyof typeof REPORT_STATUS_LABELS
            ] ?? formatEnum(label)
          }
        />

        <VillageAnalyticsCard
          title="Reports by Priority"
          description="Distribution of reports based on assigned priority level."
          items={priorityStats}
          total={totalReports}
          formatLabel={(label) =>
            REPORT_PRIORITY_LABELS[
              label as keyof typeof REPORT_PRIORITY_LABELS
            ] ?? formatEnum(label)
          }
        />

        <VillageAnalyticsCard
          title="Reports by Category"
          description="Most frequent issue categories submitted by citizens."
          items={categoryStats}
          total={totalReports}
        />

        <VillageAnalyticsCard
          title="Reports by Hamlet"
          description="Report distribution across hamlets in the village."
          items={hamletStats}
          total={totalReports}
        />
      </section>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}