"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";
import { ROUTES } from "@/src/lib/constants/routes";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
        },
      },
    });

    if (error) {
      setLoading(false);
      toast.error("Registration failed", {
        description: translateAuthError(error.message),
      });
      return;
    }

    toast.success("Registration successful", {
      description: "Please sign in using your new account.",
    });

    router.replace(`${ROUTES.LOGIN}?registered=1`);
    router.refresh();
  }

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <div className="relative">
        <Input
          label="Full name"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          className="pl-10"
        />
        <User className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="pl-10"
        />
        <Mail className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Phone number"
          type="text"
          placeholder="Example: 08123456789"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          className="pl-10"
        />
        <Phone className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />
      </div>

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
          className="pl-10 pr-10"
        />

        <Lock className="absolute left-3 top-[38px] h-4 w-4 text-muted-foreground" />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-[34px] rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      <Button type="submit" className="w-full" isLoading={loading}>
        Create account
      </Button>
    </form>
  );
}

function translateAuthError(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email rate limit exceeded")) {
    return "Too many registration attempts. Please try again later.";
  }

  if (lowerMessage.includes("user already registered")) {
    return "This email is already registered. Please sign in instead.";
  }

  return message;
}