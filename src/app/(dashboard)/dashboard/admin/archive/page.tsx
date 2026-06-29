import { AdminFollowUpTable } from "@/src/features/admin/components/AdminFollowUpTable";
import { getAdminArchivedReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminArchivePage() {
  const reports = await getAdminArchivedReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Archive</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Archived Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          View reports that have been closed and moved into the archive.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Archived Report List</CardTitle>
          <CardDescription>
            Showing reports that are no longer active in the handling workflow.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminFollowUpTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}