import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { GenerateOfficialLetterButton } from "@/src/features/admin/components/GenerateOfficialLetterButton";
import {
  getGeneratedOfficialLetters,
  getReportsReadyForOfficialLetter,
} from "@/src/features/admin/queries";

export default async function AdminLettersPage() {
  const [readyReports, generatedLetters] = await Promise.all([
    getReportsReadyForOfficialLetter(),
    getGeneratedOfficialLetters(),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">
            Official Letters
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Official Letter Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Generate and manage official letter drafts for reports forwarded to
            external agencies.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Reports Ready for Official Letter
          </CardTitle>

          <CardDescription>
            These reports have been forwarded to an agency and do not have an
            official letter yet.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {readyReports.length === 0 ? (
            <EmptyState message="No reports are ready for official letter generation." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Report</th>
                      <th className="px-5 py-4 font-semibold">Agency</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {readyReports.map((report) => (
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
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {getRelationName(report.agency)}
                        </td>

                        <td className="px-5 py-4">
                          <Badge className="bg-info-50 text-info-700">
                            Forwarded to Agency
                          </Badge>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <GenerateOfficialLetterButton
                              reportId={report.id}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border lg:hidden">
                {readyReports.map((report) => (
                  <div key={report.id} className="space-y-4 p-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {report.title}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {report.report_number}
                      </p>
                    </div>

                    <InfoItem
                      label="Agency"
                      value={getRelationName(report.agency)}
                    />

                    <GenerateOfficialLetterButton reportId={report.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Official Letters</CardTitle>

          <CardDescription>
            Draft letters that have already been generated by the admin.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {generatedLetters.length === 0 ? (
            <EmptyState message="No official letters have been generated yet." />
          ) : (
            <div className="space-y-4">
              {generatedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {letter.letter_number}
                        </p>

                        <Badge className="bg-warning-50 text-warning-700">
                          {formatEnum(letter.status)}
                        </Badge>
                      </div>

                      <p className="mt-2 text-sm font-medium text-foreground">
                        {letter.subject}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Report: {getReportNumber(letter.report)} · Agency:{" "}
                        {getRelationName(letter.agency)}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/admin/letters/${letter.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-700"
                    >
                      View letter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {letter.body ? (
                    <details className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-foreground">
                        View letter preview
                      </summary>

                      <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {letter.body}
                      </pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
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

function getRelationName(
  relation: { name?: string | null } | { name?: string | null }[] | null
) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.name ?? "-";
  return relation.name ?? "-";
}

function getReportNumber(
  relation:
    | { report_number?: string | null }
    | { report_number?: string | null }[]
    | null
) {
  if (!relation) return "-";
  if (Array.isArray(relation)) return relation[0]?.report_number ?? "-";
  return relation.report_number ?? "-";
}

function getReportId(
  relation: { id?: string | null } | { id?: string | null }[] | null
) {
  if (!relation) return "";
  if (Array.isArray(relation)) return relation[0]?.id ?? "";
  return relation.id ?? "";
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}