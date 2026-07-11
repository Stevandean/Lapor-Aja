import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/Card";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Dasbor</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Halaman dalam pengembangan</CardTitle>
          <CardDescription>
            Halaman ini sudah disiapkan sebagai bagian dari struktur dasbor
            dan akan dilengkapi pada tahap pengembangan berikutnya.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Fitur segera hadir
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Layout dan kontrol akses sudah siap. Konten fitur akan
              ditambahkan nanti.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
