type ReportStatusWhatsAppTemplateParams = {
  reporterName: string;
  reportNumber: string;
  reportTitle: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
};

export function buildReportStatusWhatsAppMessage({
  reporterName,
  reportNumber,
  reportTitle,
  oldStatus,
  newStatus,
  note,
}: ReportStatusWhatsAppTemplateParams) {
  const oldStatusLabel = oldStatus ? getReportStatusLabel(oldStatus) : "-";
  const newStatusLabel = getReportStatusLabel(newStatus);

  return [
    `Halo ${reporterName},`,
    "",
    "Status laporan Anda di *Lapor Aja* telah diperbarui.",
    "",
    `*Nomor Laporan:* ${reportNumber}`,
    `*Judul:* ${reportTitle}`,
    `*Status Sebelumnya:* ${oldStatusLabel}`,
    `*Status Baru:* ${newStatusLabel}`,
    note ? `*Catatan:* ${note}` : "",
    "",
    "Terima kasih telah menggunakan Sistem Lapor Aja.",
  ]
    .filter(Boolean)
    .join("\n");
}

function getReportStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu Review",
    need_verification: "Menunggu Verifikasi Kepala Dusun",
    verified_valid: "Terverifikasi Valid",
    verified_invalid: "Terverifikasi Tidak Valid",
    classified: "Sudah Diklasifikasikan",
    handled_by_village: "Ditangani Desa",
    forwarded_to_agency: "Diteruskan ke Dinas",
    waiting_budget: "Menunggu Anggaran",
    in_progress: "Sedang Diproses",
    resolved: "Selesai",
    rejected: "Ditolak",
    archived: "Diarsipkan",
    merged: "Digabungkan",
  };

  return labels[status] ?? status;
}
