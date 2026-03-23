import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grease & Threads HVAC and Mechanical Services | Carlisle, Indiana",
  description:
    "Simple, honest repair. HVAC, appliance repair, commercial kitchen service, and handyman work for Carlisle, Indiana and a 30-mile radius. $75 diagnostic. Call (812) 564-3719.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
