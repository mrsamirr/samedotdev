"use client";
import dynamic from "next/dynamic";

const Appbar = dynamic(
  () => import("@/components/Appbar").then(m => m.Appbar),
  { ssr: false, loading: () => null }
);

const ProfileChildren = dynamic(
  () => import("@/components/ProfileChildren"),
  { ssr: false, loading: () => null }
);
const ProfileSidebar = dynamic(
  () => import("@/components/ProfileSidebar"),
  { ssr: false, loading: () => null }
);
import React, { JSX, useState } from "react";

export default function ProfileLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const [sidebarToggle, setSidebarToggle] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Appbar />
      <div className="max-w-screen-xl flex p-4 m-auto">
        <div className="p-2 w-full grid grid-cols-8 gap-2">
          <ProfileSidebar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} />
          <ProfileChildren sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle}>
            {children}
          </ProfileChildren>
        </div>
      </div>
    </div>
  );
}
