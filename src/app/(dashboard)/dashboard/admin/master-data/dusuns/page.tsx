import { Map } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { DusunCreateModal } from "@/src/features/master-data/components/DusunCreateModal";
import { DusunTable } from "@/src/features/master-data/components/DusunTable";
import { getDusunMasterData } from "@/src/features/master-data/queries";

export default async function AdminDusunMasterDataPage() {
  const dusuns = await getDusunMasterData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Data Master</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Data Dusun
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola wilayah dusun yang digunakan untuk penugasan laporan dan
            akses kepala dusun.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <DusunCreateModal />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Dusun
          </CardTitle>

          <CardDescription>
            Data dusun digunakan saat admin mengirim laporan ke kepala dusun
            yang sesuai.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DusunTable dusuns={dusuns} />
        </CardContent>
      </Card>
    </div>
  );
}
