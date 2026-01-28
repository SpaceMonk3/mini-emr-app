import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zealthy Mini-EMR",
  description: "Mini-EMR and Patient Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
