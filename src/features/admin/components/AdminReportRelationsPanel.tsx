"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitMerge, History, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Select } from "@/src/components/ui/Select";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  bulkMarkRecurringReports,
  bulkMergeDuplicateReports,
  linkRelatedReport,
} from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type RelatedReport = {
  id: string;
  report_number: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string | null;
  resolved_at?: string | null;
  manual_address?: string | null;
  auto_address?: string | null;
  category?: RelationName[] | RelationName | null;
  hamlet?: RelationName[] | RelationName | null;
};

type RelationName = {
  name: string | null;
};

type ReportRelation = {
  id: string;
  relation_type: "duplicate" | "recurrence";
  note: string | null;
  created_at: string;
  source?: RelatedReport[] | RelatedReport | null;
  target?: RelatedReport[] | RelatedReport | null;
};

type ReportRelationsData = {
  schemaReady: boolean;
  outgoing: ReportRelation[];
  incoming: ReportRelation[];
  duplicateCandidates: RelatedReport[];
  recurringSourceCandidates: RelatedReport[];
  recurrenceCandidates: RelatedReport[];
};

type AdminReportRelationsPanelProps = {
  reportId: string;
  currentStatus: string;
  relations: ReportRelationsData;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

const ACTIVE_RELATION_STATUSES = [
  "pending",
  "need_verification",
  "verified_valid",
  "classified",
  "handled_by_village",
  "forwarded_to_agency",
  "waiting_budget",
  "in_progress",
];

const RECURRENCE_REFERENCE_STATUSES = ["resolved", "archived"];

export function AdminReportRelationsPanel({
  reportId,
  currentStatus,
  relations,
}: AdminReportRelationsPanelProps) {
  const router = useRouter();
  const [relationType, setRelationType] = useState<"duplicate" | "recurrence">(
    () =>
      RECURRENCE_REFERENCE_STATUSES.includes(currentStatus)
        ? "recurrence"
        : "duplicate"
  );
  const [state, formAction, isPending] = useActionState(
    linkRelatedReport,
    initialState
  );
  const [bulkState, bulkAction, isBulkPending] = useActionState(
    bulkMergeDuplicateReports,
    initialState
  );
  const [bulkRecurringState, bulkRecurringAction, isBulkRecurringPending] =
    useActionState(bulkMarkRecurringReports, initialState);
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<Set<string>>(
    () => new Set()
  );
  const [hoveredDuplicateCandidateId, setHoveredDuplicateCandidateId] =
    useState<string | null>(null);
  const [hoveredRecurringCandidateId, setHoveredRecurringCandidateId] =
    useState<string | null>(null);
  const duplicateHoveredCandidate = useMemo(
    () =>
      relations.duplicateCandidates.find(
        (candidate) => candidate.id === hoveredDuplicateCandidateId
      ) ??
      relations.duplicateCandidates.find((candidate) =>
        selectedDuplicateIds.has(candidate.id)
      ) ??
      relations.duplicateCandidates[0] ??
      null,
    [
      hoveredDuplicateCandidateId,
      relations.duplicateCandidates,
      selectedDuplicateIds,
    ]
  );
  const recurringHoveredCandidate = useMemo(
    () =>
      relations.recurringSourceCandidates.find(
        (candidate) => candidate.id === hoveredRecurringCandidateId
      ) ??
      relations.recurringSourceCandidates.find((candidate) =>
        selectedRecurringIds.has(candidate.id)
      ) ??
      relations.recurringSourceCandidates[0] ??
      null,
    [
      hoveredRecurringCandidateId,
      relations.recurringSourceCandidates,
      selectedRecurringIds,
    ]
  );
  const isActiveReport = ACTIVE_RELATION_STATUSES.includes(currentStatus);
  const isRecurrenceReferenceReport =
    RECURRENCE_REFERENCE_STATUSES.includes(currentStatus);
  const canCreateRelation = isActiveReport || isRecurrenceReferenceReport;

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Berhasil", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Gagal", {
        description: state.message,
      });
    }
  }, [state, router]);

  useEffect(() => {
    if (bulkState.status === "success") {
      toast.success("Berhasil", {
        description: bulkState.message,
      });

      router.refresh();
    }

    if (bulkState.status === "error") {
      toast.error("Gagal", {
        description: bulkState.message,
      });
    }
  }, [bulkState, router]);

  useEffect(() => {
    if (bulkRecurringState.status === "success") {
      toast.success("Berhasil", {
        description: bulkRecurringState.message,
      });

      router.refresh();
    }

    if (bulkRecurringState.status === "error") {
      toast.error("Gagal", {
        description: bulkRecurringState.message,
      });
    }
  }, [bulkRecurringState, router]);

  function toggleDuplicateCandidate(reportId: string) {
    setSelectedDuplicateIds((current) => {
      const next = new Set(current);

      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }

      return next;
    });
  }

  function toggleRecurringCandidate(reportId: string) {
    setSelectedRecurringIds((current) => {
      const next = new Set(current);

      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }

      return next;
    });
  }

  if (!relations.schemaReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relasi Laporan</CardTitle>
          <CardDescription>
            Gabungkan laporan duplikat atau tandai masalah yang berulang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            Skema relasi laporan belum tersedia. Jalankan migration{" "}
            <span className="font-semibold">
              supabase/migrations/202606250001_report_relations.sql
            </span>{" "}
            sebelum menggunakan fitur merge duplikat atau masalah berulang.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relasi Laporan</CardTitle>
        <CardDescription>
          Tautkan laporan aktif yang duplikat ke laporan master, atau hubungkan
          laporan baru dengan masalah lama yang sudah selesai.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <RelationSummary
          outgoing={relations.outgoing}
          incoming={relations.incoming}
        />

        <div className="space-y-3">
          <RelationList
            title="Laporan ini tertaut ke"
            emptyText="Belum ada relasi keluar dari laporan ini."
            relations={relations.outgoing}
            relationSide="target"
          />

          <RelationList
            title="Laporan yang tertaut ke sini"
            emptyText="Belum ada laporan yang tertaut ke laporan ini."
            relations={relations.incoming}
            relationSide="source"
          />
        </div>

        <div className="border-t border-border pt-5">
          {!canCreateRelation ? (
            <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
              Relasi hanya bisa dibuat dari laporan aktif atau dari laporan
              selesai yang digunakan sebagai referensi masalah berulang.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="form-label">Jenis Relasi</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RelationModeButton
                    active={relationType === "duplicate"}
                    icon={<GitMerge className="h-4 w-4" />}
                    title="Merge Duplikat"
                    description="Masalah yang sama saat laporan master masih aktif."
                    disabled={!isActiveReport}
                    onClick={() => setRelationType("duplicate")}
                  />
                  <RelationModeButton
                    active={relationType === "recurrence"}
                    icon={<History className="h-4 w-4" />}
                    title="Masalah Berulang"
                    description="Masalah yang sama muncul lagi setelah laporan lama selesai."
                    onClick={() => setRelationType("recurrence")}
                  />
                </div>
              </div>

              <div
                className={
                  relationType === "duplicate"
                    ? "rounded-2xl border border-info-100 bg-info-50 p-4 text-sm leading-6 text-info-700"
                    : "rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700"
                }
              >
                {relationType === "duplicate"
                  ? "Merge duplikat menggunakan laporan ini sebagai master. Pilih satu atau beberapa laporan aktif yang duplikat, lalu gabungkan ke laporan ini."
                  : isRecurrenceReferenceReport
                    ? "Bulk recurring menggunakan laporan selesai/arsip ini sebagai masalah lama. Pilih satu atau beberapa laporan aktif yang mengulang masalah ini."
                    : "Masalah berulang digunakan untuk laporan aktif baru yang mengulang masalah dari laporan lama yang sudah selesai atau diarsipkan. Laporan ini tetap aktif dan berjalan melalui alur normal."}
              </div>

              {relationType === "duplicate" ? (
                <form action={bulkAction} className="space-y-4">
                  <input type="hidden" name="master_report_id" value={reportId} />

                  {relations.duplicateCandidates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                      Tidak ada kandidat duplikat aktif yang tersedia.
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-3">
                        {relations.duplicateCandidates.map((candidate) => {
                          const selected = selectedDuplicateIds.has(candidate.id);

                          return (
                            <BulkCandidateOption
                              key={candidate.id}
                              candidate={candidate}
                              selected={selected}
                              onFocus={() =>
                                setHoveredDuplicateCandidateId(candidate.id)
                              }
                              onHover={() =>
                                setHoveredDuplicateCandidateId(candidate.id)
                              }
                              onToggle={() => toggleDuplicateCandidate(candidate.id)}
                            />
                          );
                        })}
                      </div>

                      <CandidatePreview candidate={duplicateHoveredCandidate} />
                    </div>
                  )}

                  <Textarea
                    label="Catatan Merge Bulk"
                    name="bulk_note"
                    required
                    rows={4}
                    placeholder="Jelaskan mengapa laporan-laporan ini merupakan duplikat dari laporan master."
                  />

                  <Button
                    type="submit"
                    disabled={
                      isBulkPending ||
                      selectedDuplicateIds.size === 0 ||
                      relations.duplicateCandidates.length === 0
                    }
                    className="w-full"
                  >
                    <GitMerge className="mr-2 h-4 w-4" />
                    {isBulkPending
                      ? "Menggabungkan..."
                      : `Gabungkan Laporan Terpilih (${selectedDuplicateIds.size})`}
                  </Button>
                </form>
              ) : isRecurrenceReferenceReport ? (
                <form action={bulkRecurringAction} className="space-y-4">
                  <input type="hidden" name="target_report_id" value={reportId} />

                  {relations.recurringSourceCandidates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                      Tidak ada laporan aktif yang tersedia untuk ditandai sebagai masalah berulang.
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-3">
                        {relations.recurringSourceCandidates.map((candidate) => {
                          const selected = selectedRecurringIds.has(candidate.id);

                          return (
                            <BulkCandidateOption
                              key={candidate.id}
                              candidate={candidate}
                              selected={selected}
                              onFocus={() =>
                                setHoveredRecurringCandidateId(candidate.id)
                              }
                              onHover={() =>
                                setHoveredRecurringCandidateId(candidate.id)
                              }
                              onToggle={() => toggleRecurringCandidate(candidate.id)}
                            />
                          );
                        })}
                      </div>

                      <CandidatePreview candidate={recurringHoveredCandidate} />
                    </div>
                  )}

                  <Textarea
                    label="Catatan Masalah Berulang Bulk"
                    name="bulk_note"
                    required
                    rows={4}
                    placeholder="Jelaskan mengapa laporan aktif ini merupakan pengulangan dari masalah yang sudah selesai."
                  />

                  <Button
                    type="submit"
                    disabled={
                      isBulkRecurringPending ||
                      selectedRecurringIds.size === 0 ||
                      relations.recurringSourceCandidates.length === 0
                    }
                    className="w-full"
                  >
                    <History className="mr-2 h-4 w-4" />
                    {isBulkRecurringPending
                      ? "Menyimpan..."
                      : `Tandai Terpilih Sebagai Berulang (${selectedRecurringIds.size})`}
                  </Button>
                </form>
              ) : (
                <form action={formAction} className="space-y-4">
                  <input type="hidden" name="source_report_id" value={reportId} />
                  <input type="hidden" name="relation_type" value="recurrence" />

                  <Select
                    label="Laporan Lama Yang Sudah Selesai"
                    name="target_report_id"
                    required
                  >
                    <option value="">Pilih laporan lama yang sudah selesai</option>
                    {relations.recurrenceCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.report_number} - {candidate.title}
                      </option>
                    ))}
                  </Select>

                  <Textarea
                    label="Catatan Relasi"
                    name="note"
                    required
                    rows={4}
                    placeholder="Jelaskan mengapa laporan ini merupakan pengulangan dari laporan lama yang dipilih."
                  />

                  <Button
                    type="submit"
                    disabled={
                      isPending || relations.recurrenceCandidates.length === 0
                    }
                    className="w-full"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {isPending ? "Menyimpan..." : "Simpan Masalah Berulang"}
                  </Button>

                  {relations.recurrenceCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada laporan selesai atau arsip yang tersedia sebagai referensi pengulangan.
                    </p>
                  ) : null}
                </form>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RelationSummary({
  outgoing,
  incoming,
}: {
  outgoing: ReportRelation[];
  incoming: ReportRelation[];
}) {
  const items = [
    {
      label: "Digabung Ke",
      value: outgoing.filter(
        (relation) => relation.relation_type === "duplicate"
      ).length,
    },
    {
      label: "Duplikat Ke Sini",
      value: incoming.filter(
        (relation) => relation.relation_type === "duplicate"
      ).length,
    },
    {
      label: "Berulang Dari",
      value: outgoing.filter(
        (relation) => relation.relation_type === "recurrence"
      ).length,
    },
    {
      label: "Pengulangan Ke Sini",
      value: incoming.filter(
        (relation) => relation.relation_type === "recurrence"
      ).length,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-muted/30 px-3 py-2"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function BulkCandidateOption({
  candidate,
  selected,
  onFocus,
  onHover,
  onToggle,
}: {
  candidate: RelatedReport;
  selected: boolean;
  onFocus: () => void;
  onHover: () => void;
  onToggle: () => void;
}) {
  return (
    <label
      onMouseEnter={onHover}
      className={
        selected
          ? "flex cursor-pointer gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3 transition"
          : "flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-3 transition hover:bg-muted"
      }
    >
      <input
        type="checkbox"
        name="source_report_ids"
        value={candidate.id}
        checked={selected}
        onFocus={onFocus}
        onChange={onToggle}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {candidate.report_number}
          </p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {formatEnum(candidate.status)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {candidate.title}
        </p>
      </div>
    </label>
  );
}

function CandidatePreview({ candidate }: { candidate: RelatedReport | null }) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Arahkan kursor ke kandidat laporan untuk melihat detail.
      </div>
    );
  }

  return (
    <div className="sticky top-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Pratinjau Kandidat
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {candidate.title}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <PreviewInfo label="Laporan" value={candidate.report_number} />
        <PreviewInfo label="Status" value={formatEnum(candidate.status)} />
        <PreviewInfo label="Prioritas" value={formatEnum(candidate.priority)} />
        <PreviewInfo label="Kategori" value={getRelationName(candidate.category)} />
        <PreviewInfo label="Dusun" value={getRelationName(candidate.hamlet)} />
        <PreviewInfo label="Dibuat" value={formatDate(candidate.created_at)} />
      </div>
      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium text-muted-foreground">Alamat</p>
        <p className="mt-1 text-xs leading-5 text-foreground">
          {getCandidateAddress(candidate)}
        </p>
      </div>
      <p className="mt-4 max-h-36 overflow-y-auto text-xs leading-5 text-muted-foreground">
        {candidate.description || "Tidak ada deskripsi."}
      </p>
    </div>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function RelationModeButton({
  active,
  icon,
  title,
  description,
  disabled = false,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={
        disabled
          ? "rounded-2xl border border-border bg-muted/40 p-4 text-left opacity-60"
          : active
            ? "rounded-2xl border border-primary-200 bg-primary-50 p-4 text-left shadow-sm transition"
            : "rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:bg-muted/40"
      }
    >
      <span
        className={
          disabled
            ? "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            : active
              ? "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              : "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
        }
      >
        {icon}
      </span>
      <span className="mt-3 block text-sm font-semibold text-foreground">
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function RelationList({
  title,
  emptyText,
  relations,
  relationSide,
}: {
  title: string;
  emptyText: string;
  relations: ReportRelation[];
  relationSide: "source" | "target";
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {relations.length === 0 ? (
        <p className="mt-2 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {relations.map((relation) => {
            const report = getSingleRelation(relation[relationSide]);

            return (
              <div
                key={relation.id}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    {relation.relation_type === "duplicate" ? (
                      <GitMerge className="h-4 w-4" />
                    ) : (
                      <History className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {formatRelationType(relation.relation_type)}
                    </p>

                    {report ? (
                      <Link
                        href={`/dashboard/admin/reports/${report.id}`}
                        className="mt-1 block text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {report.report_number} - {report.title}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Laporan terkait tidak tersedia
                      </p>
                    )}

                    {relation.note ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {relation.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getSingleRelation<T>(relation: T[] | T | null | undefined) {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function getRelationName(relation: RelationName[] | RelationName | null | undefined) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getCandidateAddress(candidate: RelatedReport) {
  return candidate.manual_address || candidate.auto_address || "-";
}

function formatEnum(value: string | null | undefined) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    pending: "Menunggu",
    need_verification: "Perlu Verifikasi",
    verified_valid: "Terverifikasi Valid",
    classified: "Diklasifikasikan",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Instansi",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Diproses",
    resolved: "Selesai",
    archived: "Diarsipkan",
    rendah: "Rendah",
    sedang: "Sedang",
    tinggi: "Tinggi",
    darurat: "Darurat",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

function formatRelationType(value: ReportRelation["relation_type"]) {
  return value === "duplicate" ? "Duplikat" : "Masalah Berulang";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
