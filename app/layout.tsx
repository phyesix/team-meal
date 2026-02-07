import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Takım Yemeği - Team Meal Rotation",
  description: "Takım yemeği rotasyon yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
