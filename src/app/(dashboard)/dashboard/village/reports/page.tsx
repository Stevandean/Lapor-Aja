import {
  ArrowRightCircle,
  CheckCircle2,
  ClipboardList,
  Gauge,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { VillageReportsTable } from "@/src/features/village/components/VillageReportsTable";
import { getVillageReportsData } from "@/src/features/village/queries";

export default async function VillageReportsPage() {
  const { stats, reports, sections } = await getVillageReportsData();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Village Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Monitor every citizen report across verification, classification,
          village handling, agency forwarding, budgeting, and completion.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <CompactStatCard
          title="Total"
          value={stats.totalReports}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <CompactStatCard
          title="Active"
          value={stats.activeReports}
          icon={<Gauge className="h-5 w-5" />}
        />
        <CompactStatCard
          title="Waiting Budget"
          value={stats.waitingBudgetReports}
          icon={<Wallet className="h-5 w-5" />}
        />
        <CompactStatCard
          title="Village Handled"
          value={stats.villageHandledReports}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <CompactStatCard
          title="Forwarded"
          value={stats.forwardedReports}
          icon={<ArrowRightCircle className="h-5 w-5" />}
        />
        <CompactStatCard
          title="Resolved"
          value={stats.resolvedReports}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <VillageReportsTable reports={reports} sections={sections} />
        </CardContent>
      </Card>
    </div>
  );
}

function CompactStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
