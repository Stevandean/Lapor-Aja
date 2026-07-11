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
          <p className="text-sm font-semibold text-primary">Data Master</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Data Instansi
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola instansi luar yang digunakan saat laporan perlu diteruskan
            ke luar kewenangan desa.
          </p>
        </div>

        <AgencyCreateModal />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Instansi
          </CardTitle>

          <CardDescription>
            Data instansi membantu admin menentukan tujuan laporan yang bukan
            kewenangan desa.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AgencyTable agencies={agencies} />
        </CardContent>
      </Card>
    </div>
  );
}
