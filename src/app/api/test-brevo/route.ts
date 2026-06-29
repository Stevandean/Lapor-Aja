import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/src/lib/email/brevo";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Test route tidak aktif di production" },
        { status: 403 }
      );
    }

    const testReceiver = process.env.BREVO_TEST_RECEIVER_EMAIL;

    if (!testReceiver) {
      return NextResponse.json(
        { error: "BREVO_TEST_RECEIVER_EMAIL belum diatur di .env.local" },
        { status: 400 }
      );
    }

    const result = await sendBrevoEmail({
      to: testReceiver,
      subject: "Test Email dari Lapor Aja",
      htmlContent: `
        <h2>Test Email Lapor Aja</h2>
        <p>Jika email ini masuk, berarti integrasi Brevo sudah berhasil.</p>
        <p>Setelah ini kita bisa sambungkan ke fitur pengiriman surat otomatis.</p>
      `,
      textContent:
        "Jika email ini masuk, berarti integrasi Brevo sudah berhasil.",
    });

    return NextResponse.json({
      success: true,
      message: "Email test berhasil dikirim",
      result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan",
      },
      { status: 500 }
    );
  }
}