"use client";

import dynamic from "next/dynamic";

const VillageHeatmapMap = dynamic(
  () =>
    import("@/src/features/village/components/VillageHeatmapMap").then(
      (module) => module.VillageHeatmapMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Loading map...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Preparing report location data.
          </p>
        </div>
      </div>
    ),
  }
);

type RelationName = {
  name: string;
};

type HeatmapReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

type VillageHeatmapSectionProps = {
  reports: HeatmapReport[];
};

export function VillageHeatmapSection({ reports }: VillageHeatmapSectionProps) {
  return <VillageHeatmapMap reports={reports as any} />;
}