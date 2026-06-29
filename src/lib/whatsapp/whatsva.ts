type SendWhatsvaMessageParams = {
  phoneNumber: string;
  message: string;
};

export async function sendWhatsvaMessage({
  phoneNumber,
  message,
}: SendWhatsvaMessageParams) {
  const sendMessageUrl = process.env.WHATSVA_SEND_MESSAGE_URL;
  const apiKey = process.env.WHATSVA_API_KEY;

  if (!sendMessageUrl) {
    throw new Error("WHATSVA_SEND_MESSAGE_URL belum diatur di .env.local");
  }

  if (!apiKey) {
    throw new Error("WHATSVA_API_KEY belum diatur di .env.local");
  }

  const jid = normalizeIndonesianPhoneNumber(phoneNumber);

  const response = await fetch(sendMessageUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: apiKey,
      jid,
      message,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("WhatsVA error:", data);

    throw new Error(
      data?.message ||
        data?.error ||
        `Gagal mengirim WhatsApp. Status: ${response.status}`
    );
  }

  return data;
}

export function normalizeIndonesianPhoneNumber(phoneNumber: string) {
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+62")) {
    return cleaned.replace("+", "");
  }

  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }

  return cleaned;
}