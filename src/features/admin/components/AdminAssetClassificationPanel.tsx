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
      toast.success("Berhasil", {
        description: state.message,
      });

      setTimeout(() => {
        router.push(`/dashboard/admin/reports/${reportId}`);
        router.refresh();
      }, 700);
    }

    if (state.status === "error") {
      toast.error("Gagal", {
        description: state.message,
      });
    }
  }, [state, router, reportId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Klasifikasi Aset</CardTitle>
        <CardDescription>
          Tentukan apakah laporan berkaitan dengan aset desa, level kewenangan,
          dan jenis tindak lanjutnya.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!canClassify && (
          <div className="rounded-2xl border border-success-100 bg-success-50 p-4 text-sm leading-6 text-success-700">
            Laporan ini sudah diklasifikasi.
          </div>
        )}

        {canClassify && (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="report_id" value={reportId} />

            <Select
              label="Status aset"
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
                Pilih status aset
              </option>
              <option value="aset_desa">Aset Desa</option>
              <option value="bukan_aset_desa">Bukan Aset Desa</option>
              <option value="belum_diketahui">Belum Diketahui</option>
            </Select>

            <Select
              label="Level kewenangan"
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
                Pilih level kewenangan
              </option>
              <option value="desa">Desa</option>
              <option value="kabupaten_kota">Kabupaten/Kota</option>
              <option value="provinsi">Provinsi</option>
              <option value="nasional">Nasional</option>
              <option value="belum_diketahui">Belum Diketahui</option>
            </Select>

            <Select
              label="Jenis tindak lanjut"
              name="follow_up_type"
              required
              value={selectedFollowUpType}
              onChange={(event) => setSelectedFollowUpType(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="" disabled>
                Pilih jenis tindak lanjut
              </option>
              <option value="ditangani_desa">Ditangani Desa</option>
              <option value="diteruskan_ke_dinas">Diteruskan ke Dinas</option>
              <option value="diusulkan_musrenbang">Diusulkan Musrenbang</option>
              <option value="menunggu_anggaran">Menunggu Anggaran</option>
            </Select>

            {requiresVillageSection ? (
              <Select
                label="Seksi desa tujuan"
                name="assigned_section_id"
                required
                defaultValue={currentAssignedSectionId ?? ""}
                disabled={!sectionOptionsAvailable || isSubmitting}
                helperText="Seksi yang dipilih menentukan dashboard Kasi yang menerima laporan ini."
              >
                <option value="" disabled>
                  Pilih seksi desa
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
                label="Instansi tujuan"
                name="agency_id"
                required
                defaultValue=""
                disabled={!agencyOptionsAvailable || isSubmitting}
                helperText="Instansi yang dipilih akan digunakan untuk pembuatan surat resmi."
              >
                <option value="" disabled>
                  Pilih instansi tujuan
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
                Belum ada seksi desa yang aktif. Aktifkan atau tambahkan seksi
                di Data Master sebelum mengklasifikasi laporan ini.
              </div>
            ) : null}

            {requiresAgency && !agencyOptionsAvailable ? (
              <div className="rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm leading-6 text-danger-700">
                Belum ada instansi yang aktif. Tambahkan atau aktifkan instansi
                di Data Master sebelum meneruskan laporan ini.
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
              {isSubmitting ? "Mengklasifikasi..." : "Simpan klasifikasi"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
