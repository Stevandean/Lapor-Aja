import RegisterForm from "@/src/features/auth/components/RegisterForm";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
        title="Create your account"
        description="Join the reporting platform to submit public issues with photos, location, and transparent progress tracking."
        footerText="Already have an account?"
        footerLinkText="Sign in"
        footerHref="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}