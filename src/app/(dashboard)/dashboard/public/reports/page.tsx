import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { CitizenReportTable } from "@/src/features/citizen/components/CitizenReportTable";
import { CreateReportModal } from "@/src/features/reports/components/CreateReportModal";
import { getCitizenReports } from "@/src/features/citizen/queries";

export default async function CitizenReportsPage() {
  const reports = await getCitizenReports();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Citizen Reports</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Reports
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track all reports you have submitted and monitor their latest status
            in the village reporting workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CreateReportModal />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report List
          </CardTitle>

          <CardDescription>
            Showing reports submitted using your citizen account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CitizenReportTable reports={reports as any} />
        </CardContent>
      </Card>
    </div>
  );
}