import { redirect } from "next/navigation";
import { ReportForm } from "@/src/features/reports/components/ReportForm";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole } from "@/src/lib/constants/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function CreateReportPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "public") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-primary">Public Report</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Create a New Report
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Submit public issues such as damaged roads, broken street lights,
            waste problems, drainage issues, or other village facilities that
            need attention.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
            <CardDescription>
              Please provide a clear description, photo evidence, and report
              location.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ReportForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}