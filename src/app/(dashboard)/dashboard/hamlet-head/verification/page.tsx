import { HamletVerificationTable } from "@/src/features/hamlet-head/components/HamletVerificationTable";
import { getHamletHeadVerificationReports } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadVerificationPage() {
  const { reports, missingHamlet } = await getHamletHeadVerificationReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Verification</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Report Verification
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review reports assigned to your hamlet and verify whether the reported
          issue is valid in the field.
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
          <CardTitle>Reports Need Verification</CardTitle>
          <CardDescription>
            Showing reports approved by admin and assigned to your hamlet.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletVerificationTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}