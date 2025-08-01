import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortalPro - Client Portal Platform for Freelancers",
  description: "Build beautiful, branded client portals in minutes without code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
