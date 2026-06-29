"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import { Select } from "@/src/components/ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { classifyAssetReport } from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

type AdminAssetClassificationPanelProps = {
  reportId: string;
  currentStatus: string;
  currentAssetStatus: string;
  currentAuthorityLevel: string;
  currentFollowUpType: string;
  currentAssignedSectionId: string | null;
  villageSections: VillageSectionOption[];
  agencies: AgencyOption[];
};

type VillageSectionOption = {
  id: string;
  name: string;
};

type AgencyOption = {
  id: string;
  name: string;
};

const initialState: ActionState = {
  status: "idle",
  message: "",
};

export function AdminAssetClassificationPanel({
  reportId,
  currentStatus,
  currentAssetStatus,
  currentAuthorityLevel,
  currentFollowUpType,
  currentAssignedSectionId,
  villageSections,
  agencies,
}: AdminAssetClassificationPanelProps) {
  const router = useRouter();
  const initialFollowUpType =
    currentFollowUpType === "belum_ditentukan" ? "" : currentFollowUpType;
  const [selectedFollowUpType, setSelectedFollowUpType] =
    useState(initialFollowUpType);

  const [state, formAction, isSubmitting] = useActionState(
    classifyAssetReport,
    initialState
  );

  const canClassify = currentStatus === "verified_valid";
  const requiresVillageSection = [
    "ditangani_desa",
    "diusulkan_musrenbang",
    "menunggu_anggaran",
  ].includes(selectedFollowUpType);
  const requiresAgency = selectedFollowUpType === "diteruskan_ke_dinas";
  const sectionOptionsAvailable = villageSections.length > 0;
  const agencyOptionsAvailable = agencies.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Success", {
        description: state.message,
      });

      setTimeout(() => {
        router.push(`/dashboard/admin/reports/${reportId}`);
        router.refresh();
      }, 700);
    }

    if (state.status === "error") {
      toast.error("Failed", {
        description: state.message,
      });
    }
  }, [state, router, reportId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Classification</CardTitle>
        <CardDescription>
          Decide whether the report is a village asset issue and determine its
          authority and follow-up type.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!canClassify && (
          <div className="rounded-2xl border border-success-100 bg-success-50 p-4 text-sm leading-6 text-success-700">
            This report has already been classified.
          </div>
        )}

        {canClassify && (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="report_id" value={reportId} />

            <Select
              label="Asset status"
              name="asset_status"
              required
              defaultValue={
                currentAssetStatus === "belum_diketahui"
                  ? ""
                  : currentAssetStatus
              }
              disabled={isSubmitting}
            >
              <option value="" disabled>
                Select asset status
              </option>
              <option value="aset_desa">Aset Desa</option>
              <option value="bukan_aset_desa">Bukan Aset Desa</option>
              <option value="belum_diketahui">Belum Diketahui</option>
            </Select>

            <Select
              label="Authority level"
              name="authority_level"
              required
              defaultValue={
                currentAuthorityLevel === "belum_diketahui"
                  ? ""
                  : currentAuthorityLevel
              }
              disabled={isSubmitting}
            >
              <option value="" disabled>
                Select authority level
              </option>
              <option value="desa">Desa</option>
              <option value="kabupaten_kota">Kabupaten/Kota</option>
              <option value="provinsi">Provinsi</option>
              <option value="nasional">Nasional</option>
              <option value="belum_diketahui">Belum Diketahui</option>
            </Select>

            <Select
              label="Follow-up type"
              name="follow_up_type"
              required
              value={selectedFollowUpType}
              onChange={(event) => setSelectedFollowUpType(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="" disabled>
                Select follow-up type
              </option>
              <option value="ditangani_desa">Ditangani Desa</option>
              <option value="diteruskan_ke_dinas">Diteruskan ke Dinas</option>
              <option value="diusulkan_musrenbang">Diusulkan Musrenbang</option>
              <option value="menunggu_anggaran">Menunggu Anggaran</option>
            </Select>

            {requiresVillageSection ? (
              <Select
                label="Assigned village section"
                name="assigned_section_id"
                required
                defaultValue={currentAssignedSectionId ?? ""}
                disabled={!sectionOptionsAvailable || isSubmitting}
                helperText="The selected section determines which Kasi dashboard receives this report."
              >
                <option value="" disabled>
                  Select village section
                </option>

                {villageSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            ) : (
              <input type="hidden" name="assigned_section_id" value="" />
            )}

            {requiresAgency ? (
              <Select
                label="Target agency"
                name="agency_id"
                required
                defaultValue=""
                disabled={!agencyOptionsAvailable || isSubmitting}
                helperText="The selected agency will be used for official letter generation."
              >
                <option value="" disabled>
                  Select target agency
                </option>

                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </Select>
            ) : (
              <input type="hidden" name="agency_id" value="" />
            )}

            {requiresVillageSection && !sectionOptionsAvailable ? (
              <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700">
                No active village section is available. Please activate or add
                a section in Master Data before classifying this report.
              </div>
            ) : null}

            {requiresAgency && !agencyOptionsAvailable ? (
              <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700">
                No active agency is available. Please add or activate an agency
                in Master Data before forwarding this report.
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                (requiresVillageSection && !sectionOptionsAvailable) ||
                (requiresAgency && !agencyOptionsAvailable)
              }
              className="w-full"
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {isSubmitting ? "Classifying..." : "Save classification"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
