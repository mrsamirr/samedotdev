"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import UserAccountDropDown from "./UserAccountDropDown";

export const Navbar = () => {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href={"/"} className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">UX</span>
          </div>

          <span className="text-lg md:text-2xl font-bold tracking-tight text-foreground hidden md:block">
            same dev
          </span>
        </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          {/* <Link href="#" className="text-gray-600 hover:text-gray-900">
            Guide: UI + AI
          </Link>
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Frameworks
          </Link> */}
          <Link href="#" className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link href="/plans" className="text-gray-600 hover:text-gray-900 font-medium">
            Pricing
          </Link>
        </div>

        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
            <span className="text-yellow-600 text-sm font-medium">🔥 90/90</span>
          </div>

          {!user ? (
            <Button
              onClick={async () => await signIn()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login
            </Button>
          ) : (
            <UserAccountDropDown />
          )}
        </div>
      </div>
    </nav>
  );
};
