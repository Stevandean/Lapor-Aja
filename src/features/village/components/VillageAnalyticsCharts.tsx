"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { REPORT_STATUS_LABELS } from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type AnalyticsItem = {
  label: string;
  count: number;
};

type VillageAnalyticsChartsProps = {
  total: number;
  statusStats: AnalyticsItem[];
  priorityStats: AnalyticsItem[];
  categoryStats: AnalyticsItem[];
  hamletStats: AnalyticsItem[];
};

const CHART_COLORS = [
  "var(--primary)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--info)",
  "var(--muted-foreground)",
];

export function VillageAnalyticsCharts({
  total,
  statusStats,
  priorityStats,
  categoryStats,
  hamletStats,
}: VillageAnalyticsChartsProps) {
  const statusData = statusStats.map((item) => ({
    ...item,
    label:
      REPORT_STATUS_LABELS[item.label as keyof typeof REPORT_STATUS_LABELS] ??
      formatEnum(item.label),
  }));

  const priorityData = priorityStats.map((item) => ({
    ...item,
    label:
      REPORT_PRIORITY_LABELS[
        item.label as keyof typeof REPORT_PRIORITY_LABELS
      ] ?? formatEnum(item.label),
  }));

  const categoryData = categoryStats.map((item) => ({
    ...item,
    label: item.label,
  }));

  const hamletData = hamletStats.map((item) => ({
    ...item,
    label: item.label,
  }));

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ChartCard
        title="Distribusi Status"
        description="Menampilkan sebaran laporan berdasarkan status alur."
      >
        <PieChartBox data={statusData} total={total} />
      </ChartCard>

      <ChartCard
        title="Distribusi Prioritas"
        description="Menampilkan jumlah laporan rendah, sedang, tinggi, atau darurat."
      >
        <PieChartBox data={priorityData} total={total} />
      </ChartCard>

      <ChartCard
        title="Kategori Laporan Teratas"
        description="Menampilkan jenis masalah masyarakat yang paling sering muncul."
      >
        <HorizontalBarChartBox data={categoryData} />
      </ChartCard>

      <ChartCard
        title="Laporan Berdasarkan Dusun"
        description="Menampilkan distribusi laporan di tiap dusun."
      >
        <HorizontalBarChartBox data={hamletData} />
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PieChartBox({
  data,
  total,
}: {
  data: AnalyticsItem[];
  total: number;
}) {
  if (data.length === 0 || total === 0) {
    return <EmptyChart />;
  }

  return (
    <div className="space-y-5">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.label}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip content={<ChartTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ChartLegend data={data} total={total} />
    </div>
  );
}

function HorizontalBarChartBox({ data }: { data: AnalyticsItem[] }) {
  if (data.length === 0) {
    return <EmptyChart />;
  }

  const chartData = data.slice(0, 8);
  const maxLabelLength = Math.max(
    ...chartData.map((item) => item.label.length),
    10
  );

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={Math.min(maxLabelLength * 8, 150)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="var(--primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLegend({
  data,
  total,
}: {
  data: AnalyticsItem[];
  total: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map((item, index) => {
        const percentage =
          total > 0 ? Math.round((item.count / total) * 100) : 0;

        return (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.count} laporan - {percentage}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    payload?: {
      label?: string;
      count?: number;
    };
  }[];
  total?: number;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const label = item.payload?.label ?? item.name ?? "-";
  const count = Number(item.value ?? item.payload?.count ?? 0);
  const percentage =
    total && total > 0 ? ` - ${Math.round((count / total) * 100)}%` : "";

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        {count} laporan
        {percentage}
      </p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">Belum ada data chart</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Chart akan muncul setelah laporan dikirim.
        </p>
      </div>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
