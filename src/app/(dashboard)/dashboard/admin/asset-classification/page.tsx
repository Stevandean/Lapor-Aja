import { AdminAssetClassificationTable } from "@/src/features/admin/components/AdminAssetClassificationTable";
import { getAdminAssetClassificationReports } from "@/src/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";

export default async function AdminAssetClassificationPage() {
  const reports = await getAdminAssetClassificationReports();

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">
          Asset Classification
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Reports Ready for Classification
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review reports that have been verified as valid by the hamlet head,
          then decide the asset status, authority level, and follow-up type.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Verified Reports</CardTitle>
          <CardDescription>
            Showing valid reports that are ready for administrative
            classification.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminAssetClassificationTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}