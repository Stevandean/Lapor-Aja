import { HamletVerificationHistoryTable } from "@/src/features/hamlet-head/components/HamletVerificationHistoryTable";
import { getHamletHeadVerificationHistory } from "@/src/features/hamlet-head/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function HamletHeadHistoryPage() {
  const { history, missingHamlet } = await getHamletHeadVerificationHistory();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">
          Verification History
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Verified Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review reports that you have verified, including valid and invalid
          verification results.
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
          <CardTitle>Verification History List</CardTitle>
          <CardDescription>
            Showing reports that have been verified by your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <HamletVerificationHistoryTable history={history as any} />
        </CardContent>
      </Card>
    </div>
  );
}