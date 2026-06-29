import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/src/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Lapor Aja",
  description: "Village public reporting system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}