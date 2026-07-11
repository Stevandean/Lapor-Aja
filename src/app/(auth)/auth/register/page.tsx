import RegisterForm from "@/src/features/auth/components/RegisterForm";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Buat akun Anda"
      description="Daftar untuk mengirim laporan publik lengkap dengan foto, lokasi, dan progress yang transparan."
      footerText="Sudah punya akun?"
      footerLinkText="Masuk"
      footerHref="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
