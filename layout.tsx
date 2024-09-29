import type { Metadata } from "next";
import localFont from "next/font/local";
import "./src/app/globals.css";
import { Toaster } from "react-hot-toast";
// Remove or comment out the Dialog import if it's not being used in this file
// import { Dialog } from "@/components/ui/dialog";

const geistSans = localFont({
  src: "./src/app/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./src/app/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Unlock the Power of AI Voice Agents with InvocalizeAI.",
  description: "InvcocalizeAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
