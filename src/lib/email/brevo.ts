type BrevoAttachment = {
  name: string;
  content?: string; // base64
  url?: string; // absolute URL
};

type SendBrevoEmailParams = {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: BrevoAttachment[];
};

export async function sendBrevoEmail({
  to,
  toName,
  subject,
  htmlContent,
  textContent,
  attachments,
}: SendBrevoEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY belum diatur di .env.local");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL belum diatur di .env.local");
  }

  if (!senderName) {
    throw new Error("BREVO_SENDER_NAME belum diatur di .env.local");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: [
        {
          email: to,
          name: toName || to,
        },
      ],
      subject,
      htmlContent,
      textContent,
      ...(attachments && attachments.length > 0
        ? { attachment: attachments }
        : {}),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Brevo error:", data);
    throw new Error(
      data?.message || `Gagal mengirim email. Status: ${response.status}`
    );
  }

  return data;
}