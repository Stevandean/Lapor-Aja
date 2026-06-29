import type { ComponentProps } from "react";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiProgressHistory } from "@/src/features/kasi/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiHistoryPage() {
  const { missingSection, reports } = await getKasiProgressHistory();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Progress History</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Section Handling History
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review reports that have entered the section handling workflow,
          including active, budget, progress, and completed states.
        </p>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Handling History</CardTitle>
          <CardDescription>
            Showing section-assigned reports that have reached a handling stage.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={reports as KasiReportTableReports}
            emptyTitle={
              missingSection ? "Section assignment required" : "No history yet"
            }
            emptyDescription={
              missingSection
                ? "Ask an admin, sekdes, or kepala desa to assign your account to a village section."
                : "Reports will appear here after they enter section handling."
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
      Your account has not been assigned to a village section yet. Section
      assignment is required before handling history can appear here.
    </div>
  );
}
