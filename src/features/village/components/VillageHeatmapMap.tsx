"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

export type HeatmapReport = {
  id: string;
  report_number: string;
  title: string;
  status: keyof typeof REPORT_STATUS_LABELS;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

type VillageHeatmapMapProps = {
  reports: HeatmapReport[];
};

const priorityFilters = [
  {
    label: "Semua",
    value: "all",
  },
  {
    label: "Darurat",
    value: "darurat",
  },
  {
    label: "Tinggi",
    value: "tinggi",
  },
  {
    label: "Sedang",
    value: "sedang",
  },
  {
    label: "Rendah",
    value: "rendah",
  },
];

export function VillageHeatmapMap({ reports }: VillageHeatmapMapProps) {
  const [selectedPriority, setSelectedPriority] = useState("all");

  const filteredReports = useMemo(() => {
    if (selectedPriority === "all") {
      return reports;
    }

    return reports.filter((report) => report.priority === selectedPriority);
  }, [reports, selectedPriority]);

  const center = getMapCenter(filteredReports.length > 0 ? filteredReports : reports);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Filter Peta
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Filter titik laporan berdasarkan prioritas untuk fokus pada area
            masalah yang mendesak.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {priorityFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={selectedPriority === filter.value ? undefined : "outline"}
              onClick={() => setSelectedPriority(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <PriorityLegend />

      <div className="h-[620px] overflow-hidden rounded-2xl border border-border bg-muted">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredReports.map((report) => {
            const markerStyle = getMarkerStyleByPriority(report.priority);

            return (
              <CircleMarker
                key={report.id}
                center={[Number(report.latitude), Number(report.longitude)]}
                radius={markerStyle.radius}
                pathOptions={{
                  color: markerStyle.color,
                  fillColor: markerStyle.color,
                  fillOpacity: 0.45,
                  opacity: 0.95,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="w-64 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {report.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {report.report_number}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>
                        <strong>Kategori:</strong>{" "}
                        {getRelationName(report.category)}
                      </p>

                      <p>
                        <strong>Dusun:</strong>{" "}
                        {getRelationName(report.hamlet)}
                      </p>

                      <p>
                        <strong>Prioritas:</strong>{" "}
                        {REPORT_PRIORITY_LABELS[report.priority] ??
                          report.priority}
                      </p>

                      <p>
                        <strong>Diperbarui:</strong>{" "}
                        {formatDate(report.updated_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={
                          REPORT_STATUS_BADGE_CLASSES[report.status] ??
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {REPORT_STATUS_LABELS[report.status] ?? report.status}
                      </Badge>

                      <Badge variant="muted">
                        {REPORT_PRIORITY_LABELS[report.priority] ??
                          report.priority}
                      </Badge>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-xs font-semibold text-primary hover:text-primary-700"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {filteredReports.length === 0 && (
        <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
          Tidak ada laporan untuk filter prioritas yang dipilih.
        </div>
      )}
    </div>
  );
}

function PriorityLegend() {
  const items = [
    {
      label: "Darurat",
      description: "Laporan darurat yang perlu segera ditangani.",
      priority: "darurat",
    },
    {
      label: "Tinggi",
      description: "Laporan prioritas tinggi yang perlu dipantau ketat.",
      priority: "tinggi",
    },
    {
      label: "Sedang",
      description: "Laporan standar dengan prioritas penanganan normal.",
      priority: "sedang",
    },
    {
      label: "Rendah",
      description: "Laporan prioritas rendah dengan urgensi lebih rendah.",
      priority: "rendah",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const markerStyle = getMarkerStyleByPriority(item.priority);

        return (
          <div
            key={item.priority}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <span
              className="mt-1 rounded-full"
              style={{
                width: markerStyle.radius,
                height: markerStyle.radius,
                backgroundColor: markerStyle.color,
              }}
            />

            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getMarkerStyleByPriority(priority: string) {
  if (priority === "darurat") {
    return {
      radius: 18,
      color: "var(--danger-600)",
    };
  }

  if (priority === "tinggi") {
    return {
      radius: 15,
      color: "var(--warning-600)",
    };
  }

  if (priority === "sedang") {
    return {
      radius: 12,
      color: "var(--primary)",
    };
  }

  return {
    radius: 9,
    color: "var(--success-600)",
  };
}

function getMapCenter(reports: HeatmapReport[]): [number, number] {
  if (reports.length === 0) {
    return [-7.9666, 112.6326];
  }

  const total = reports.reduce(
    (acc, report) => {
      acc.lat += Number(report.latitude);
      acc.lng += Number(report.longitude);
      return acc;
    },
    {
      lat: 0,
      lng: 0,
    }
  );

  return [total.lat / reports.length, total.lng / reports.length];
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
