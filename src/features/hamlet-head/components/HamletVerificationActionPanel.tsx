"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { verifyReport } from "@/src/features/hamlet-head/actions";
import type { ActionState } from "@/src/types/action";

type HamletVerificationActionPanelProps = {
  reportId: string;
  currentStatus: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function HamletVerificationActionPanel({
  reportId,
  currentStatus,
}: HamletVerificationActionPanelProps) {
  const router = useRouter();

  const [state, formAction, isSubmitting] = useActionState(
    verifyReport,
    initialState
  );

  const canVerify = currentStatus === "need_verification";

  useEffect(() => {
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
        <CardTitle>Verification Action</CardTitle>
        <CardDescription>
          Upload field evidence and mark this report as valid or invalid.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!canVerify && (
          <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-sm leading-6 text-warning-700">
            This report has already been verified or is no longer available for
            field verification.
          </div>
        )}

        {canVerify && (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="report_id" value={reportId} />

            <Textarea
              label="Verification note"
              name="verification_note"
              placeholder="Describe the field condition and explain your verification result."
              required
              disabled={isSubmitting}
            />

            <div className="space-y-2">
              <label className="form-label">Verification photos</label>

              <div className="rounded-2xl border border-dashed border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <ImagePlus className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      name="verification_photos"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      required
                      disabled={isSubmitting}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload 1–5 field photos. Supported formats: JPG, PNG,
                      WEBP. Maximum 10MB per photo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="submit"
                name="result"
                value="valid"
                disabled={isSubmitting}
                className="w-full"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Mark as valid"}
              </Button>

              <Button
                type="submit"
                name="result"
                value="invalid"
                variant="outline"
                disabled={isSubmitting}
                className="w-full border-danger-200 text-danger-700 hover:bg-danger-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Mark as invalid"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}