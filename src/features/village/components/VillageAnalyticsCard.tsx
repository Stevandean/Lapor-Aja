import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/Card";

type AnalyticsItem = {
  label: string;
  count: number;
};

type VillageAnalyticsCardProps = {
  title: string;
  description: string;
  items: AnalyticsItem[];
  total: number;
  formatLabel?: (label: string) => string;
};

export function VillageAnalyticsCard({
  title,
  description,
  items,
  total,
  formatLabel = defaultFormatLabel,
}: VillageAnalyticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Belum ada data
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Analitik akan muncul setelah laporan dikirim.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const percentage =
                total > 0 ? Math.round((item.count / total) * 100) : 0;

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <p className="font-medium text-foreground">
                      {formatLabel(item.label)}
                    </p>

                    <p className="text-muted-foreground">
                      {item.count} laporan -{" "}
                      {percentage}%
                    </p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function defaultFormatLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
