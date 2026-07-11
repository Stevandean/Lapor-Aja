"use client";

import { Printer } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export function PrintLetterButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      Cetak / Simpan PDF
    </Button>
  );
}
