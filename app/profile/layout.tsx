"use client";

import { Appbar } from "@/components/Appbar";
import ProfileChildren from "@/components/ProfileChildren";
import ProfileSidebar from "@/components/ProfileSidebar";
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
