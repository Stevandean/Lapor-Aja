"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/Button";
import {
  finalizeOfficialLetter,
  sendOfficialLetterEmail,
} from "@/src/features/admin/actions";
import type { ActionState } from "@/src/types/action";

const initialState: ActionState = {
  status: "idle",
  message: "",
};

type OfficialLetterPrimaryActionButtonProps = {
  letterId: string;
  status: string;
};

export function OfficialLetterPrimaryActionButton({
  letterId,
  status,
}: OfficialLetterPrimaryActionButtonProps) {
  const router = useRouter();

  const selectedAction =
    status === "draft" ? finalizeOfficialLetter : sendOfficialLetterEmail;

  const [state, action, isPending] = useActionState(
    selectedAction,
    initialState
  );

  const buttonConfig = getButtonConfig(status, isPending);

  useEffect(() => {
    if (!state.message) return;

    if (state.status === "success") {
      toast.success("Berhasil", {
        description: state.message,
      });

      router.refresh();
    }

    if (state.status === "error") {
      toast.error("Gagal", {
        description: state.message,
      });
    }
  }, [state, router]);

  return (
    <form action={action}>
      <input type="hidden" name="letter_id" value={letterId} />

      <Button type="submit" disabled={buttonConfig.disabled}>
        {buttonConfig.icon}
        {buttonConfig.label}
      </Button>
    </form>
  );
}

function getButtonConfig(status: string, isPending: boolean) {
  if (status === "draft") {
    return {
      label: isPending ? "Memfinalisasi..." : "Tandai Final",
      disabled: isPending,
      icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
    };
  }

  if (status === "final") {
    return {
      label: isPending ? "Mengirim..." : "Kirim Email",
      disabled: isPending,
      icon: isPending ? (
        <Send className="mr-2 h-4 w-4" />
      ) : (
        <Mail className="mr-2 h-4 w-4" />
      ),
    };
  }

  if (status === "sent") {
    return {
      label: "Sudah Terkirim",
      disabled: true,
      icon: <ShieldCheck className="mr-2 h-4 w-4" />,
    };
  }

  return {
    label: "Aksi Tidak Tersedia",
    disabled: true,
    icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
  };
}
