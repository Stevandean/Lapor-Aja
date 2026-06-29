import Link from "next/link";
import { Download, Filter, PlusCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { AdminReportTable } from "@/src/features/admin/components/AdminReportTable";
import { getAdminReports } from "@/src/features/admin/queries";

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Reports</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Report Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review, monitor, classify, and manage public reports submitted by
            citizens.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            Showing the latest 20 reports from the reporting system.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminReportTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}