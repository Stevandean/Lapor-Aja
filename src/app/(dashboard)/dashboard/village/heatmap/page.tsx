import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { VillageHeatmapSection } from "@/src/features/village/components/VillageHeatmapSection";
import { getVillageHeatmapReports } from "@/src/features/village/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function VillageHeatmapPage() {
  const reports = await getVillageHeatmapReports();

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
          <p className="text-sm font-semibold text-primary">Heatmap</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Report Location Map
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View the geographic distribution of citizen reports across the
            village area to identify recurring problem locations.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            Report Distribution Map
          </CardTitle>

          <CardDescription>
            Showing {reports.length} report location
            {reports.length > 1 ? "s" : ""} with available coordinates.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No location data available
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Reports will appear on this map after citizens submit reports
                with location data.
              </p>
            </div>
          ) : (
            <VillageHeatmapSection reports={reports as any} />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MapInfoCard
          title="Total Points"
          value={reports.length}
          description="Reports with latitude and longitude."
        />

        <MapInfoCard
          title="Map Usage"
          value="Monitoring"
          description="Used for village-level spatial analysis."
        />

        <MapInfoCard
          title="Decision Support"
          value="Location"
          description="Helps identify recurring issue areas."
        />

        <MapInfoCard
          title="Next Upgrade"
          value="Heat Layer"
          description="Can be upgraded to density-based heatmap."
        />
      </section>
    </div>
  );
}

function MapInfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}