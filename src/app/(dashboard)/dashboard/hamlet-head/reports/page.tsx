import { HamletAssignedReportsTable } from "@/src/features/hamlet-head/components/HamletAssignedReportsTable";
import { getHamletHeadAssignedReports } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadReportsPage() {
  const { reports, missingHamlet } = await getHamletHeadAssignedReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Reports</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Assigned Hamlet Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          View all reports that have been assigned to your hamlet, including
          reports waiting for verification and reports that have already moved
          to the next workflow stages.
        </p>
      </section>

      {missingHamlet && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Your account has not been assigned to a hamlet yet. Please ask the
          admin to set your hamlet in the profile data.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assigned Report List</CardTitle>
          <CardDescription>
            Showing all reports connected to your hamlet.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletAssignedReportsTable reports={reports as any} />
        </CardContent>
      </Card>
    </div>
  );
}