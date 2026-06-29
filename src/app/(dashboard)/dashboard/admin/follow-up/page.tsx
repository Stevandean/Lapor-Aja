import { AdminFollowUpTable } from "@/src/features/admin/components/AdminFollowUpTable";
import { getAdminFollowUpReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminFollowUpPage() {
  const reports = await getAdminFollowUpReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Follow-up</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Follow-up Management
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Monitor reports that have already been classified and processed into
          the follow-up stage.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Active Follow-up Reports</CardTitle>
          <CardDescription>
            Showing classified reports and reports that are handled by the
            village, forwarded to an agency, waiting for budget, or currently
            in progress.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminFollowUpTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
