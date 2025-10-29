"use client";
import dynamic from "next/dynamic";

const AppbarAtPlayGround = dynamic(
  () => import("@/components/AppbarAtPlayGround").then(m => m.AppbarAtPlayGround),
  { ssr: false, loading: () => null }
);
                                                                                                                                                            



export default function RootDesignLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
       <div className="min-h-screen bg-background font-sans antialiased">
          <AppbarAtPlayGround />
          {children}
      </div>
  );
}
