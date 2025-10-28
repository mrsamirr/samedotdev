import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const font = Host_Grotesk({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "same dev",
  description: "A platform for same devs to showcase their work and connect with others.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${font.className}  bg-neutral-50  antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
