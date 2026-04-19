import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Milestone calculator",
  description: "Calculate project milestone dates for exhibition and AV builds, working backwards from the truck leave date.",
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
