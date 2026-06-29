import { Suspense } from "react";
import LoginForm from "@/src/features/auth/components/LoginForm";
import { AuthLayout } from "@/src/features/auth/components/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
        title="Welcome back"
        description="Sign in to continue submitting reports, tracking progress, and supporting transparent village services."
        footerText="Don’t have an account?"
        footerLinkText="Create an account"
        footerHref="/auth/register"
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}