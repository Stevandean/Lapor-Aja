"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Search, Wallet, X } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  REPORT_PRIORITY_BADGE_CLASSES,
  REPORT_PRIORITY_LABELS,
} from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type RelationName = {
  name: string;
};

type BudgetRequest = {
  id: string;
  note: string;
  estimated_budget: number;
  status: "submitted" | "approved" | "rejected" | string;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  report: {
    id: string;
    report_number: string;
    title: string;
    status: keyof typeof REPORT_STATUS_LABELS;
    priority: keyof typeof REPORT_PRIORITY_LABELS;
    follow_up_type: string | null;
    updated_at: string;
    category: RelationName[] | RelationName | null;
    hamlet: RelationName[] | RelationName | null;
  } | null;
  requester: {
    full_name: string | null;
    email: string | null;
  } | null;
  reviewer: {
    full_name: string | null;
    email: string | null;
  } | null;
  section: {
    name: string;
  } | null;
  itemCount: number;
};

type VillageBudgetRequestsTableProps = {
  requests: BudgetRequest[];
};

export function VillageBudgetRequestsTable({
  requests,
}: VillageBudgetRequestsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return requests;
    }

    return requests.filter((request) => {
      const report = request.report;
      const haystack = [
        report?.title,
        report?.report_number,
        getRelationName(report?.category ?? null),
        getRelationName(report?.hamlet ?? null),
        request.requester?.full_name,
        request.reviewer?.full_name,
        request.section?.name,
        request.status,
        request.note,
        request.review_note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [requests, searchQuery]);

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Wallet className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Belum ada pengajuan anggaran
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Pengajuan dari Kasi akan muncul di sini setelah mereka mengusulkan
          anggaran dari laporan yang ditugaskan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-end">
        <div className="w-full max-w-xl">
          <label className="form-label" htmlFor="budget-request-search">
            Cari Pengajuan Anggaran
          </label>

          <div className="relative">
            <Input
              id="budget-request-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari laporan, seksi, pengaju, peninjau, atau catatan"
              className="pl-10"
            />

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            Menampilkan{" "}
            <strong className="font-semibold text-foreground">
              {filteredRequests.length}
            </strong>{" "}
            dari{" "}
            <strong className="font-semibold text-foreground">
              {requests.length}
            </strong>
          </div>

          {searchQuery ? (
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
          ) : null}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            Tidak ada pengajuan anggaran yang cocok
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba gunakan kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1450px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Laporan</th>
                  <th className="px-5 py-4 font-semibold">Seksi</th>
                  <th className="px-5 py-4 font-semibold">Pengaju</th>
                  <th className="px-5 py-4 font-semibold">Estimasi</th>
                  <th className="px-5 py-4 font-semibold">Prioritas</th>
                  <th className="px-5 py-4 font-semibold">Status Anggaran</th>
                  <th className="px-5 py-4 font-semibold">Status Laporan</th>
                  <th className="px-5 py-4 font-semibold">Diajukan</th>
                  <th className="px-5 py-4 font-semibold">Peninjauan</th>
                  <th className="px-5 py-4 font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="align-top transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-4">
                      <div className="max-w-sm">
                        <p className="font-semibold text-foreground">
                          {request.report?.title ?? "Laporan tidak diketahui"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.report?.report_number ?? "-"} -{" "}
                          {getRelationName(request.report?.hamlet ?? null)}
                        </p>
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {request.note}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {request.section?.name ?? "-"}
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {request.requester?.full_name ?? "-"}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(request.estimated_budget)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.itemCount} item
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={request.report?.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <BudgetStatusBadge status={request.status} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={request.report?.status} />
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateTime(request.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <ReviewSummary request={request} />
                    </td>

                    <td className="px-5 py-4">
                      <Link href={`/dashboard/village/budget-requests/${request.id}`}>
                        <Button type="button" variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Lihat detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border xl:hidden">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {request.report?.title ?? "Laporan tidak diketahui"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.report?.report_number ?? "-"} -{" "}
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>

                  <BudgetStatusBadge status={request.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoItem label="Seksi" value={request.section?.name ?? "-"} />
                  <InfoItem
                    label="Pengaju"
                    value={request.requester?.full_name ?? "-"}
                  />
                  <InfoItem
                    label="Dusun"
                    value={getRelationName(request.report?.hamlet ?? null)}
                  />
                  <InfoItem
                    label="Estimasi"
                    value={formatCurrency(request.estimated_budget)}
                  />
                  <InfoItem
                    label="Status Laporan"
                    value={getReportStatusLabel(request.report?.status)}
                  />
                  <InfoItem label="Item" value={String(request.itemCount)} />
                </div>

                <div className="mt-4 rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Alasan anggaran</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">
                    {request.note}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-border p-3">
                  <ReviewSummary request={request} />
                </div>

                <div className="mt-4">
                  <Link href={`/dashboard/village/budget-requests/${request.id}`}>
                    <Button type="button" variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Lihat detail
                    </Button>
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

function BudgetStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "warning" | "success" | "danger" | "muted"> = {
    submitted: "warning",
    approved: "success",
    rejected: "danger",
  };
  const labels: Record<string, string> = {
    submitted: "Menunggu Peninjauan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <Badge variant={variants[status] ?? "muted"}>
      {labels[status] ?? status}
    </Badge>
  );
}

function PriorityBadge({
  priority,
}: {
  priority?: keyof typeof REPORT_PRIORITY_LABELS;
}) {
  if (!priority) {
    return <Badge variant="muted">-</Badge>;
  }

  return (
    <Badge
      className={
        REPORT_PRIORITY_BADGE_CLASSES[priority] ??
        "bg-muted text-muted-foreground"
      }
    >
      {REPORT_PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  );
}

function StatusBadge({
  status,
}: {
  status?: keyof typeof REPORT_STATUS_LABELS;
}) {
  if (!status) {
    return <Badge variant="muted">-</Badge>;
  }

  return (
    <Badge
      className={
        REPORT_STATUS_BADGE_CLASSES[status] ?? "bg-muted text-muted-foreground"
      }
    >
      {REPORT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function ReviewSummary({ request }: { request: BudgetRequest }) {
  if (request.status === "submitted") {
    return (
      <div className="text-xs leading-5 text-muted-foreground">
        Menunggu peninjauan Kepala Desa atau Sekdes.
      </div>
    );
  }

  return (
    <div className="max-w-xs text-xs leading-5 text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground">
          {request.reviewer?.full_name ?? "Peninjau"}
        </span>
        {request.reviewed_at ? ` - ${formatDateTime(request.reviewed_at)}` : ""}
      </p>

      {request.review_note ? (
        <p className="mt-1 whitespace-pre-line">{request.review_note}</p>
      ) : (
        <p className="mt-1">Tidak ada catatan peninjauan.</p>
      )}
    </div>
  );
}

function getRelationName(relation: RelationName[] | RelationName | null) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReportStatusLabel(status?: keyof typeof REPORT_STATUS_LABELS) {
  if (!status) {
    return "-";
  }

  return REPORT_STATUS_LABELS[status] ?? status;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
