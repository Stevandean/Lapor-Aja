import type { ComponentProps } from "react";
import { KasiReportTable } from "@/src/features/kasi/components/KasiReportTable";
import { getKasiAssignedReports } from "@/src/features/kasi/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

type KasiReportTableReports = ComponentProps<typeof KasiReportTable>["reports"];

export default async function KasiReportsPage() {
  const { missingSection, reports } = await getKasiAssignedReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Assigned Reports</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Section Report List
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          View reports assigned to your village section. Action controls will
          be added after the read-only workflow is stable.
        </p>
      </section>

      {missingSection ? <MissingSectionNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Assigned Report List</CardTitle>
          <CardDescription>
            Showing reports whose assigned section matches your Kasi profile.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <KasiReportTable
            reports={reports as KasiReportTableReports}
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
      Your account has not been assigned to a village section yet. Section
      assignment is required before reports can appear here.
    </div>
  );
}
