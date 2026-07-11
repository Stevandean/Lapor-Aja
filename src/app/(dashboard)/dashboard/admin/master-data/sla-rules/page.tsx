import { Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { SlaRuleTable } from "@/src/features/master-data/components/SlaRuleTable";
import { getSlaRuleMasterData } from "@/src/features/master-data/queries";

export default async function AdminSlaRulesMasterDataPage() {
  const rules = await getSlaRuleMasterData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Data Master</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Aturan SLA
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola batas waktu verifikasi dan penyelesaian berdasarkan
            prioritas laporan.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Aturan SLA Berdasarkan Prioritas
          </CardTitle>

          <CardDescription>
            Aturan ini digunakan untuk menghitung tenggat verifikasi dan
            penyelesaian setelah laporan disetujui.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SlaRuleTable rules={rules} />
        </CardContent>
      </Card>
    </div>
  );
}
