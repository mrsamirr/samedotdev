"use client";
import React from "react";
import { Providers, ThemeProvider } from "./Providers";
import { Menu } from "lucide-react";

interface ProfileChildrenProps {
  children: React.ReactNode;
  sidebarToggle: boolean;
  setSidebarToggle: (value: boolean) => void;
}

export default function ProfileChildren({ children, sidebarToggle, setSidebarToggle }: ProfileChildrenProps) {
  return (
    <div
      className={`border-2 h-[88vh] lg:h-auto overflow-y-auto rounded-md ${
        sidebarToggle ? "col-span-8 lg:col-span-6" : "col-span-8 lg:col-span-4"
      } w-full`}
    >
      <div
        onClick={() => setSidebarToggle(!sidebarToggle)}
        className="absolute cursor-pointer top-[7rem] right-[4rem] block lg:hidden"
      >
        <Menu />
      </div>

      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <Providers>{children}</Providers>
      </ThemeProvider>
    </div>
  );
}
