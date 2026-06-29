import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { AgencyCreateModal } from "@/src/features/master-data/components/AgencyCreateModal";
import { AgencyTable } from "@/src/features/master-data/components/AgencyTable";
import { getAgencyMasterData } from "@/src/features/master-data/queries";

export default async function AdminAgencyMasterDataPage() {
  const agencies = await getAgencyMasterData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Master Data</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Agencies Data
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage external agencies used when reports need to be forwarded
            outside the village authority.
          </p>
        </div>

        <AgencyCreateModal />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Agencies
          </CardTitle>

          <CardDescription>
            Agency data helps admins decide where non-village asset reports
            should be forwarded.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AgencyTable agencies={agencies} />
        </CardContent>
      </Card>
    </div>
  );
}