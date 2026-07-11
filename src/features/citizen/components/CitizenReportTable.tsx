"use client";

import { useMemo, useState } from "react";
import { FileText, Search, X, Eye } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { REPORT_PRIORITY_LABELS } from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";
import Link from "next/link";

type RelationName = {
  name: string;
};

export type CitizenReport = {
  id: string;
  report_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
};

type CitizenReportTableProps = {
  reports: CitizenReport[];
};

const statusFilters = [
  { label: "Semua Status", value: "all" },
  { label: "Menunggu", value: "pending" },
  { label: "Diproses", value: "in_process" },
  { label: "Selesai", value: "resolved" },
  { label: "Diarsipkan", value: "archived" },
  { label: "Ditolak", value: "rejected" },
];

const inProcessStatuses = [
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

export function CitizenReportTable({ reports }: CitizenReportTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const categoryName = getRelationName(report.category).toLowerCase();
      const hamletName = getRelationName(report.hamlet).toLowerCase();

      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.report_number.toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        hamletName.includes(query);

      const matchesStatus =
        selectedStatus === "all" ||
        report.status === selectedStatus ||
        (selectedStatus === "in_process" &&
          inProcessStatuses.includes(report.status));

      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, selectedStatus]);

  const hasActiveFilter = searchQuery.trim() !== "" || selectedStatus !== "all";

  function resetFilters() {
    setSearchQuery("");
    setSelectedStatus("all");
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <FileText className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada laporan
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Laporan yang Anda kirim akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-4 md:grid-cols-[1.5fr_1fr]">
          <div>
            <label className="form-label" htmlFor="report-search">
              Cari laporan
            </label>

            <div className="relative">
              <Input
                id="report-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari berdasarkan nomor laporan, judul, kategori, atau dusun"
                className="pl-10"
              />

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="status-filter">
              Status
            </label>

            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="form-input"
            >
              {statusFilters.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
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

          {hasActiveFilter && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Atur Ulang
            </Button>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Tidak ada laporan yang cocok
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Coba gunakan kata kunci atau filter status lain.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Laporan</th>
                  <th className="px-5 py-4 font-semibold">Kategori</th>
                  <th className="px-5 py-4 font-semibold">Dusun</th>
                  <th className="px-5 py-4 font-semibold">Prioritas</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Diperbarui</th>
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
                      {getRelationName(report.category)}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {getRelationName(report.hamlet)}
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={report.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(report.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                        <div className="flex justify-end">
                            <Link
                            href={`/dashboard/public/reports/${report.id}`}
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

                  <StatusBadge status={report.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PriorityBadge priority={report.priority} />
                  <Badge variant="muted">{getRelationName(report.category)}</Badge>
                  <Badge variant="muted">{getRelationName(report.hamlet)}</Badge>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  Diperbarui {formatDate(report.updated_at)}
                </div>
                <div className="mt-4">
                    <Link
                        href={`/dashboard/public/reports/${report.id}`}
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

function PriorityBadge({ priority }: { priority: string }) {
  const label =
    REPORT_PRIORITY_LABELS[
      priority as keyof typeof REPORT_PRIORITY_LABELS
    ] ?? priority;

  if (priority === "darurat") {
    return <Badge className="bg-danger-50 text-danger-700">{label}</Badge>;
  }

  if (priority === "tinggi") {
    return <Badge className="bg-warning-50 text-warning-700">{label}</Badge>;
  }

  if (priority === "sedang") {
    return <Badge className="bg-primary-50 text-primary-700">{label}</Badge>;
  }

  return <Badge variant="muted">{label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  type StatusKey = keyof typeof REPORT_STATUS_LABELS;

  return (
    <Badge
      className={
        REPORT_STATUS_BADGE_CLASSES[status as StatusKey] ??
        "bg-muted text-muted-foreground border-border"
      }
    >
      {REPORT_STATUS_LABELS[status as StatusKey] ?? formatEnum(status)}
    </Badge>
  );
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

function formatEnum(value: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    need_verification: "Perlu Verifikasi",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Diklasifikasi",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Instansi",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
    archived: "Diarsipkan",
    rejected: "Ditolak",
    merged: "Digabung",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}
