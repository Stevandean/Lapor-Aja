"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { getDashboardRouteByRole } from "@/src/lib/constants/routes";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import type { UserRole } from "@/src/types/profile";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      toast.error("Login gagal", {
        description: translateAuthError(error.message),
      });
      return;
    }

    const user = authData.user;

    if (!user) {
      await supabase.auth.signOut();

      setLoading(false);
      toast.error("Login gagal", {
        description: "Sesi pengguna tidak dapat dibuat.",
      });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();

      setLoading(false);
      toast.error("Login gagal", {
        description:
          "Profil Anda tidak ditemukan. Silakan hubungi administrator.",
      });
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();

      setLoading(false);
      toast.error("Akun dinonaktifkan", {
        description:
          "Akun Anda telah dinonaktifkan. Silakan hubungi administrator.",
      });
      return;
    }

    toast.success("Login berhasil", {
      description: "Mengalihkan ke dashboard Anda.",
    });

    const redirectParam = searchParams.get("redirect");
    const safeRedirect =
      redirectParam && redirectParam.startsWith("/") ? redirectParam : null;

    if (safeRedirect) {
      router.replace(safeRedirect);
      router.refresh();
      return;
    }

    router.replace(getDashboardRouteByRole(profile.role as UserRole));
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="relative">
        <Input
          label="Alamat email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="pl-10"
        />
        <Mail className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Kata sandi"
          type={showPassword ? "text" : "password"}
          placeholder="Masukkan kata sandi"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="pl-10 pr-10"
        />

        <Lock className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-[34px] rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={
            showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={loading}>
        Masuk
      </Button>
    </form>
  );
}

function translateAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login credentials")) {
    return "Email atau kata sandi salah.";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "Email Anda belum dikonfirmasi.";
  }

  return message;
}
