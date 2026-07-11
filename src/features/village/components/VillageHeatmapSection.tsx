"use client";

import dynamic from "next/dynamic";
import type { HeatmapReport } from "@/src/features/village/components/VillageHeatmapMap";

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
            Memuat peta...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Menyiapkan data lokasi laporan.
          </p>
        </div>
      </div>
    ),
  }
);

type VillageHeatmapSectionProps = {
  reports: HeatmapReport[];
};

export function VillageHeatmapSection({ reports }: VillageHeatmapSectionProps) {
  return <VillageHeatmapMap reports={reports} />;
}
