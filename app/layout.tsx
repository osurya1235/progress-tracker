import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PrewarmDB from "@/components/PrewarmDB";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Progress",
  description: "Track your daily progress and goals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrewarmDB />
        {children}
      </body>
    </html>
  );
}
