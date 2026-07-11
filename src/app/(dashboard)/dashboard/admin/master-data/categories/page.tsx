import { Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { CategoryCreateModal } from "@/src/features/master-data/components/CategoryCreateModal";
import { CategoryTable } from "@/src/features/master-data/components/CategoryTable";
import { getCategoryMasterData } from "@/src/features/master-data/queries";

export default async function AdminCategoryMasterDataPage() {
  const categories = await getCategoryMasterData();

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Data Master</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Kategori Laporan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Kelola kategori laporan yang digunakan admin untuk
            mengklasifikasi laporan masyarakat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CategoryCreateModal />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Kategori
          </CardTitle>

          <CardDescription>
            Kategori membantu admin mengelompokkan laporan sebelum verifikasi
            dan tindak lanjut.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <CategoryTable categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
