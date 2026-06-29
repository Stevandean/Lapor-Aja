"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import {
  REPORT_PRIORITY_BADGE_CLASSES,
  REPORT_PRIORITY_LABELS,
} from "@/src/lib/constants/reportPriority";
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
} from "@/src/lib/constants/reportStatus";

type RelationName = {
  name: string | null;
};

type Reporter = {
  full_name: string | null;
  email: string | null;
};

type Section = {
  id: string;
  name: string;
};

type VillageReport = {
  id: string;
  report_number: string;
  title: string;
  status: string;
  priority: string;
  asset_status: string | null;
  authority_level: string | null;
  follow_up_type: string | null;
  assigned_section_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  category: RelationName[] | RelationName | null;
  hamlet: RelationName[] | RelationName | null;
  reporter: Reporter[] | Reporter | null;
  section: Section | null;
  relation_summary?: RelationSummary;
};

type VillageReportsTableProps = {
  reports: VillageReport[];
  sections: Section[];
};

type RelationSummary = {
  duplicateAsSource: number;
  duplicateAsTarget: number;
  recurrenceAsSource: number;
  recurrenceAsTarget: number;
};

export function VillageReportsTable({
  reports,
  sections,
}: VillageReportsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [relationFilter, setRelationFilter] = useState("all");

  const statusOptions = useMemo(
    () => uniqueValues(reports.map((report) => report.status)),
    [reports]
  );
  const followUpOptions = useMemo(
    () =>
      uniqueValues(
        reports
          .map((report) => report.follow_up_type)
          .filter((value): value is string => Boolean(value))
      ),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const categoryName = getRelationName(report.category).toLowerCase();
      const hamletName = getRelationName(report.hamlet).toLowerCase();
      const reporterName = getReporterName(report.reporter).toLowerCase();
      const sectionName = report.section?.name.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        report.title.toLowerCase().includes(query) ||
        report.report_number.toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        hamletName.includes(query) ||
        reporterName.includes(query) ||
        sectionName.includes(query);

      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || report.priority === priorityFilter;
      const matchesFollowUp =
        followUpFilter === "all" || report.follow_up_type === followUpFilter;
      const matchesSection =
        sectionFilter === "all" || report.assigned_section_id === sectionFilter;
      const matchesRelation = matchesRelationFilter(
        report.relation_summary,
        relationFilter
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesFollowUp &&
        matchesSection &&
        matchesRelation
      );
    });
  }, [
    followUpFilter,
    priorityFilter,
    relationFilter,
    reports,
    searchQuery,
    sectionFilter,
    statusFilter,
  ]);

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    followUpFilter !== "all" ||
    sectionFilter !== "all" ||
    relationFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setFollowUpFilter("all");
    setSectionFilter("all");
    setRelationFilter("all");
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <h3 className="text-sm font-semibold text-foreground">
          No reports yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Reports will appear here after citizens submit them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))]">
          <div>
            <label className="form-label" htmlFor="village-report-search">
              Search Reports
            </label>
            <div className="relative">
              <Input
                id="village-report-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search number, title, hamlet, category, reporter"
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </Select>

          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">All priorities</option>
            {Object.entries(REPORT_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            label="Follow-up"
            value={followUpFilter}
            onChange={(event) => setFollowUpFilter(event.target.value)}
          >
            <option value="all">All follow-up</option>
            {followUpOptions.map((followUp) => (
              <option key={followUp} value={followUp}>
                {formatEnum(followUp)}
              </option>
            ))}
          </Select>

          <Select
            label="Section"
            value={sectionFilter}
            onChange={(event) => setSectionFilter(event.target.value)}
          >
            <option value="all">All sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </Select>

          <Select
            label="Relation"
            value={relationFilter}
            onChange={(event) => setRelationFilter(event.target.value)}
          >
            <option value="all">All relations</option>
            <option value="merged">Merged</option>
            <option value="master">Master</option>
            <option value="recurring">Recurring</option>
            <option value="has_recurrence">Has recurrence</option>
          </Select>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredReports.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {reports.length}
            </span>{" "}
            reports
          </p>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reset Filters
            </Button>
          ) : null}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            No matching reports
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try changing the search keyword or filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Report</th>
                  <th className="px-5 py-4 font-semibold">Reporter</th>
                  <th className="px-5 py-4 font-semibold">Location</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Follow-up</th>
                  <th className="px-5 py-4 font-semibold">Section</th>
                  <th className="px-5 py-4 font-semibold">Updated</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">
                        {report.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {report.report_number}
                      </p>
                      <RelationBadges summary={report.relation_summary} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {getReporterName(report.reporter)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <p>{getRelationName(report.hamlet)}</p>
                      <p className="mt-1 text-xs">
                        {getRelationName(report.category)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatEnum(report.follow_up_type)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {report.section?.name ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(report.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/village/reports/${report.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border xl:hidden">
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
                    <RelationBadges summary={report.relation_summary} />
                  </div>
                  <PriorityBadge priority={report.priority} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={report.status} />
                  <Badge variant="muted">{formatEnum(report.follow_up_type)}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoItem
                    label="Reporter"
                    value={getReporterName(report.reporter)}
                  />
                  <InfoItem
                    label="Hamlet"
                    value={getRelationName(report.hamlet)}
                  />
                  <InfoItem
                    label="Category"
                    value={getRelationName(report.category)}
                  />
                  <InfoItem
                    label="Section"
                    value={report.section?.name ?? "-"}
                  />
                </div>

                <Link
                  href={`/dashboard/village/reports/${report.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Detail
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RelationBadges({ summary }: { summary?: RelationSummary }) {
  if (!summary) {
    return null;
  }

  const badges = [
    summary.duplicateAsSource > 0
      ? { label: "Merged", className: "bg-slate-100 text-slate-700 border-slate-200" }
      : null,
    summary.duplicateAsTarget > 0
      ? { label: "Master", className: "bg-info-50 text-info-700 border-info-100" }
      : null,
    summary.recurrenceAsSource > 0
      ? {
          label: "Recurring",
          className: "bg-warning-50 text-warning-700 border-warning-100",
        }
      : null,
    summary.recurrenceAsTarget > 0
      ? {
          label: "Has Recurrence",
          className: "bg-primary-50 text-primary-700 border-primary-100",
        }
      : null,
  ].filter((badge): badge is { label: string; className: string } =>
    Boolean(badge)
  );

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <Badge key={badge.label} className={badge.className}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

function matchesRelationFilter(
  summary: RelationSummary | undefined,
  filter: string
) {
  if (filter === "all") {
    return true;
  }

  if (!summary) {
    return false;
  }

  if (filter === "merged") {
    return summary.duplicateAsSource > 0;
  }

  if (filter === "master") {
    return summary.duplicateAsTarget > 0;
  }

  if (filter === "recurring") {
    return summary.recurrenceAsSource > 0;
  }

  if (filter === "has_recurrence") {
    return summary.recurrenceAsTarget > 0;
  }

  return true;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={getStatusBadgeClass(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const key = priority as keyof typeof REPORT_PRIORITY_LABELS;

  return (
    <Badge
      className={
        REPORT_PRIORITY_BADGE_CLASSES[
          key as keyof typeof REPORT_PRIORITY_BADGE_CLASSES
        ] ?? "border-border bg-muted text-muted-foreground"
      }
    >
      {REPORT_PRIORITY_LABELS[key] ?? formatEnum(priority)}
    </Badge>
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

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

type ReportStatusKey = keyof typeof REPORT_STATUS_LABELS;

function getStatusBadgeClass(status: string) {
  return (
    REPORT_STATUS_BADGE_CLASSES[status as ReportStatusKey] ??
    "border-border bg-muted text-muted-foreground"
  );
}

function getStatusLabel(status: string) {
  return REPORT_STATUS_LABELS[status as ReportStatusKey] ?? formatEnum(status);
}
