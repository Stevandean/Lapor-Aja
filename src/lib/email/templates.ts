type OfficialLetterEmailTemplateParams = {
  agencyName: string;
  letterNumber?: string | null;
  letterSubject: string;
  letterBody?: string | null;
  reportNumber?: string | null;
  reportTitle?: string | null;
  reportDescription?: string | null;
  reportAddress?: string | null;
};

export function buildOfficialLetterEmailTemplate({
  agencyName,
  letterNumber,
  letterSubject,
  letterBody,
  reportNumber,
  reportTitle,
  reportDescription,
  reportAddress,
}: OfficialLetterEmailTemplateParams) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
      <p>Yth. ${escapeHtml(agencyName)},</p>

      <p>
        Melalui email ini, Pemerintah Desa menyampaikan surat resmi terkait
        laporan masyarakat yang perlu ditindaklanjuti oleh instansi terkait.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p><strong>Nomor Surat:</strong> ${escapeHtml(letterNumber || "-")}</p>
        <p><strong>Perihal:</strong> ${escapeHtml(letterSubject)}</p>
        <p><strong>Nomor Laporan:</strong> ${escapeHtml(reportNumber || "-")}</p>
        <p><strong>Judul Laporan:</strong> ${escapeHtml(reportTitle || "-")}</p>
        <p><strong>Lokasi:</strong> ${escapeHtml(reportAddress || "-")}</p>
        <p><strong>Deskripsi:</strong> ${escapeHtml(reportDescription || "-")}</p>
      </div>

      ${
        letterBody
          ? `
            <div style="margin: 20px 0; padding: 16px; border-left: 4px solid #2563eb; background: #eff6ff;">
              <p><strong>Isi Surat:</strong></p>
              <div style="white-space: pre-line;">${escapeHtml(letterBody)}</div>
            </div>
          `
          : ""
      }

      <p>
        Mohon Bapak/Ibu dapat menindaklanjuti laporan tersebut sesuai dengan
        kewenangan instansi.
      </p>

      <p>
        Hormat kami,<br />
        <strong>Pemerintah Desa</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #6b7280;">
        Email ini dikirim otomatis melalui sistem Lapor Aja.
      </p>
    </div>
  `;

  const textContent = `
Yth. ${agencyName},

Melalui email ini, Pemerintah Desa menyampaikan surat resmi terkait laporan masyarakat yang perlu ditindaklanjuti oleh instansi terkait.

Nomor Surat: ${letterNumber || "-"}
Perihal: ${letterSubject}
Nomor Laporan: ${reportNumber || "-"}
Judul Laporan: ${reportTitle || "-"}
Lokasi: ${reportAddress || "-"}
Deskripsi: ${reportDescription || "-"}

${letterBody ? `Isi Surat:\n${letterBody}\n` : ""}

Mohon Bapak/Ibu dapat menindaklanjuti laporan tersebut sesuai dengan kewenangan instansi.

Hormat kami,
Pemerintah Desa

Email ini dikirim otomatis melalui sistem Lapor Aja.
  `.trim();

  return {
    subject: letterSubject,
    htmlContent,
    textContent,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type ReportStatusEmailTemplateParams = {
  reporterName: string;
  reportNumber: string;
  reportTitle: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  reportAddress?: string | null;
};

export function buildReportStatusEmailTemplate({
  reporterName,
  reportNumber,
  reportTitle,
  oldStatus,
  newStatus,
  note,
  reportAddress,
}: ReportStatusEmailTemplateParams) {
  const statusLabel = getReportStatusLabel(newStatus);
  const oldStatusLabel = oldStatus ? getReportStatusLabel(oldStatus) : "-";

  const subject = `Update Status Laporan ${reportNumber}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
      <p>Halo ${escapeHtml(reporterName)},</p>

      <p>
        Status laporan Anda di Sistem Lapor Aja telah diperbarui.
      </p>

      <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p><strong>Nomor Laporan:</strong> ${escapeHtml(reportNumber)}</p>
        <p><strong>Judul Laporan:</strong> ${escapeHtml(reportTitle)}</p>
        <p><strong>Status Sebelumnya:</strong> ${escapeHtml(oldStatusLabel)}</p>
        <p><strong>Status Baru:</strong> ${escapeHtml(statusLabel)}</p>
        ${
          reportAddress
            ? `<p><strong>Lokasi:</strong> ${escapeHtml(reportAddress)}</p>`
            : ""
        }
      </div>

      ${
        note
          ? `
            <div style="margin: 20px 0; padding: 16px; border-left: 4px solid #2563eb; background: #eff6ff;">
              <p style="margin: 0;"><strong>Catatan:</strong></p>
              <p style="margin: 8px 0 0;">${escapeHtml(note)}</p>
            </div>
          `
          : ""
      }

      <p>
        Terima kasih telah menggunakan Sistem Lapor Aja. Kami akan terus
        memperbarui informasi laporan Anda sesuai proses penanganan.
      </p>

      <p>
        Hormat kami,<br />
        <strong>Tim Lapor Aja</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #6b7280;">
        Email ini dikirim otomatis oleh Sistem Lapor Aja.
      </p>
    </div>
  `;

  const textContent = `
Halo ${reporterName},

Status laporan Anda di Sistem Lapor Aja telah diperbarui.

Nomor Laporan: ${reportNumber}
Judul Laporan: ${reportTitle}
Status Sebelumnya: ${oldStatusLabel}
Status Baru: ${statusLabel}
${reportAddress ? `Lokasi: ${reportAddress}` : ""}

${note ? `Catatan: ${note}` : ""}

Terima kasih telah menggunakan Sistem Lapor Aja.

Hormat kami,
Tim Lapor Aja
  `.trim();

  return {
    subject,
    htmlContent,
    textContent,
  };
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
