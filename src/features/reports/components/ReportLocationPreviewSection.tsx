"use client";

import dynamic from "next/dynamic";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

const ReportLocationPreviewMap = dynamic(
  () =>
    import("@/src/features/reports/components/ReportLocationPreviewMap").then(
      (module) => module.ReportLocationPreviewMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading location map...</p>
      </div>
    ),
  }
);

type ReportLocationPreviewSectionProps = {
  latitude: number | string | null;
  longitude: number | string | null;
  title?: string;
  address?: string | null;
};

export function ReportLocationPreviewSection({
  latitude,
  longitude,
  title = "Report Location",
  address,
}: ReportLocationPreviewSectionProps) {
  if (!latitude || !longitude) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Location data is not available.
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="space-y-4 pt-8">
      <ReportLocationPreviewMap
        latitude={latitude}
        longitude={longitude}
        title={title}
        address={address}
      />

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              {address || "Location coordinates"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Latitude: {latitude}, Longitude: {longitude}
            </p>
          </div>
        </div>

        <a href={googleMapsUrl} target="_blank" rel="noreferrer">
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Google Maps
          </Button>
        </a>
      </div>
    </div>
  );
}