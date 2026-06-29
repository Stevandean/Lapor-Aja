"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { createOfficialLetter } from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type OfficialLetter = {
  id: string;
  report_id: string;
  letter_type: string;
  letter_number: string;
  subject: string;
  body: string | null;
  recipient_agency_id: string | null;
  status: string;
  generated_at: string | null;
  pdf_url: string | null;
  file_path: string | null;
};

type OfficialLetterPanelProps = {
  reportId: string;
  currentStatus: string;
  agencyId?: string | null;
  letter: OfficialLetter | null;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function OfficialLetterPanel({
  reportId,
  currentStatus,
  agencyId,
  letter,
}: OfficialLetterPanelProps) {
  const router = useRouter();

  const [state, action, isPending] = useActionState(
    createOfficialLetter,
    initialState
  );

  const canGenerate = currentStatus === "forwarded_to_agency" && Boolean(agencyId);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Success", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Failed", {
        description: state.message,
      });
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Official Letter
        </CardTitle>

        <CardDescription>
          Generate a draft letter for reports forwarded to an external agency.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {!canGenerate && !letter ? (
          <div className="rounded-2xl border border-muted bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Official letter is only available for reports with forwarded to
            agency status.
          </div>
        ) : null}

        {letter ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-success-100 bg-success-50 p-4">
              <p className="text-sm font-semibold text-success-700">
                Letter draft has been generated
              </p>

              <div className="mt-3 grid gap-3 text-sm text-success-700 sm:grid-cols-2">
                <InfoItem label="Letter Number" value={letter.letter_number} />
                <InfoItem label="Status" value={formatEnum(letter.status)} />
                <InfoItem label="Subject" value={letter.subject} />
                <InfoItem
                  label="Generated At"
                  value={
                    letter.generated_at
                      ? formatDateTime(letter.generated_at)
                      : "-"
                  }
                />
              </div>
            </div>

            {letter.body ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground">
                  Letter Preview
                </p>

                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-7 text-muted-foreground">
                  {letter.body}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <form action={action}>
            <input type="hidden" name="report_id" value={reportId} />

            <Button
              type="submit"
              disabled={!canGenerate || isPending}
              className="w-full"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {isPending ? "Generating..." : "Generate Official Letter"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-success-700/80">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}