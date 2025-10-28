"use client";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import UserAccountDropDown from "./UserAccountDropDown";
import { CreditsDropdown } from "./CreditsDropdown";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const Appbar = () => {
  const session = useSession();
  const user = session.data?.user;

  return (
    <nav className="sticky mx-auto wrapper top-0 z-50 flex items-center gap-2 py-2 w-full p-2">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", type: "spring", damping: 10 }}
        className="flex w-full justify-between mx-auto bg-secondary/15 shadow-lg shadow-neutral-600/5 backdrop-blur-lg border border-primary/10 p-6 rounded-sm"
      >
        <Link href={"/"} className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-sm flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">UX</span>
          </div>

          <span className="text-lg md:text-2xl font-bold tracking-tight text-foreground hidden md:block">
            same dev
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {!user ? (
            <Button
              size={"lg"}
              onClick={async () => {
                await signIn();
              }}
            >
              Login
            </Button>
          ) : (
            <CreditsDropdown />
          )}

          <UserAccountDropDown />
        </div>
      </motion.div>
    </nav>
  );
};