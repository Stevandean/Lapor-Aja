import { sendBrevoEmail } from "@/src/lib/email/brevo";
import { buildOfficialLetterEmailTemplate, buildReportStatusEmailTemplate } from "@/src/lib/email/templates";

type SendOfficialLetterViaBrevoParams = {
  agencyEmail: string;
  agencyName: string;
  letterNumber?: string | null;
  letterSubject: string;
  letterBody?: string | null;
  reportNumber?: string | null;
  reportTitle?: string | null;
  reportDescription?: string | null;
  reportAddress?: string | null;
};

export async function sendOfficialLetterViaBrevo({
  agencyEmail,
  agencyName,
  letterNumber,
  letterSubject,
  letterBody,
  reportNumber,
  reportTitle,
  reportDescription,
  reportAddress,
}: SendOfficialLetterViaBrevoParams) {
  const template = buildOfficialLetterEmailTemplate({
    agencyName,
    letterNumber,
    letterSubject,
    letterBody,
    reportNumber,
    reportTitle,
    reportDescription,
    reportAddress,
  });

  return sendBrevoEmail({
    to: agencyEmail,
    toName: agencyName,
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  });
}

type SendReportStatusNotificationViaBrevoParams = {
  reporterEmail: string;
  reporterName: string;
  reportNumber: string;
  reportTitle: string;
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  reportAddress?: string | null;
};

export async function sendReportStatusNotificationViaBrevo({
  reporterEmail,
  reporterName,
  reportNumber,
  reportTitle,
  oldStatus,
  newStatus,
  note,
  reportAddress,
}: SendReportStatusNotificationViaBrevoParams) {
  const template = buildReportStatusEmailTemplate({
    reporterName,
    reportNumber,
    reportTitle,
    oldStatus,
    newStatus,
    note,
    reportAddress,
  });

  return sendBrevoEmail({
    to: reporterEmail,
    toName: reporterName,
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent,
  });
}