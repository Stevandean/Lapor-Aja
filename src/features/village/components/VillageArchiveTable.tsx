"use client";

import { useMemo, useState } from "react";
import { Archive, Search, X, Eye } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import Link from "next/link";
import {
  REPORT_PRIORITY_LABELS,
} from "@/src/lib/constants/reportPriority";

type RelationName = {
  name: string;
};

type Reporter = {
  full_name: string | null;
  email: string | null;
};

export type ArchivedReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: keyof typeof REPORT_PRIORITY_LABELS;
  asset_status: string | null;
  authority_level: string | null;
  follow_up_type: string | null;
  resolved_at: string | null;
  updated_at: string;
  created_at: string;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
  reporter: Reporter[] | Reporter | null;
};

type VillageArchiveTableProps = {
  reports: ArchivedReport[];
};

export function VillageArchiveTable({ reports }: VillageArchiveTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) => {
      const categoryName = getRelationName(report.category).toLowerCase();
      const hamletName = getRelationName(report.hamlet).toLowerCase();
      const reporterName = getReporterName(report.reporter).toLowerCase();

      return (
        report.title.toLowerCase().includes(query) ||
        report.report_number.toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        hamletName.includes(query) ||
        reporterName.includes(query)
      );
    });
  }, [reports, searchQuery]);

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Archive className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan arsip
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan akan muncul di sini setelah laporan selesai dipindahkan ke arsip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-end">
        <div className="w-full max-w-xl">
          <label className="form-label" htmlFor="archive-search">
            Cari Arsip
          </label>

          <div className="relative">
            <Input
              id="archive-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nomor laporan, judul, dusun, kategori, atau pelapor"
              className="pl-10"
            />

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            Menampilkan{" "}
            <strong className="font-semibold text-foreground">
              {filteredReports.length}
            </strong>{" "}
            dari{" "}
            <strong className="font-semibold text-foreground">
              {reports.length}
            </strong>
          </div>

          {searchQuery && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Tidak ada laporan arsip yang cocok
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Coba gunakan kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Laporan</th>
                  <th className="px-5 py-4 font-semibold">Pelapor</th>
                  <th className="px-5 py-4 font-semibold">Kategori</th>
                  <th className="px-5 py-4 font-semibold">Dusun</th>
                  <th className="px-5 py-4 font-semibold">Prioritas</th>
                  <th className="px-5 py-4 font-semibold">Tindak Lanjut</th>
                  <th className="px-5 py-4 font-semibold">Diarsipkan</th>
                  <th className="px-5 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {report.title}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {report.report_number}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {getReporterName(report.reporter)}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {getRelationName(report.category)}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {getRelationName(report.hamlet)}
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={report.priority} />
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatEnum(report.follow_up_type)}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(report.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                        <div className="flex justify-end">
                            <Link
                            href={`/dashboard/village/archive/${report.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                            >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat Detail
                            </Link>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.report_number}
                    </p>
                  </div>

                  <PriorityBadge priority={report.priority} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoItem
                    label="Pelapor"
                    value={getReporterName(report.reporter)}
                  />
                  <InfoItem
                    label="Kategori"
                    value={getRelationName(report.category)}
                  />
                  <InfoItem
                    label="Dusun"
                    value={getRelationName(report.hamlet)}
                  />
                  <InfoItem
                    label="Diarsipkan"
                    value={formatDate(report.updated_at)}
                  />
                </div>

                <div className="mt-4 rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Tindak Lanjut</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatEnum(report.follow_up_type)}
                  </p>
                </div>
                <div className="mt-4">
                    <Link
                        href={`/dashboard/village/archive/${report.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Lihat Detail
                    </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: keyof typeof REPORT_PRIORITY_LABELS;
}) {
  if (priority === "darurat") {
    return <Badge className="bg-danger-50 text-danger-700">Darurat</Badge>;
  }

  if (priority === "tinggi") {
    return <Badge className="bg-warning-50 text-warning-700">Tinggi</Badge>;
  }

  if (priority === "sedang") {
    return <Badge className="bg-primary-50 text-primary-700">Sedang</Badge>;
  }

  return <Badge variant="muted">Rendah</Badge>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReporterName(reporter: Reporter[] | Reporter | null) {
  if (!reporter) return "-";
  if (Array.isArray(reporter)) return reporter[0]?.full_name ?? "-";
  return reporter.full_name ?? "-";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatEnum(value: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    aset_desa: "Aset Desa",
    bukan_aset_desa: "Bukan Aset Desa",
    belum_diketahui: "Belum Diketahui",
    desa: "Desa",
    kabupaten_kota: "Kabupaten/Kota",
    provinsi: "Provinsi",
    nasional: "Nasional",
    ditangani_desa: "Ditangani Desa",
    diteruskan_ke_dinas: "Diteruskan ke Dinas",
    diusulkan_musrenbang: "Diusulkan Musrenbang",
    menunggu_anggaran: "Menunggu Anggaran",
    belum_ditentukan: "Belum Ditentukan",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
