"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Separator } from "@radix-ui/react-dropdown-menu";

const Signin = () => {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current === false && session.data?.user) {
      const redirectUrl = localStorage.getItem("loginRedirectUrl") || searchParams.get("redirectUrl");
      localStorage.removeItem("loginRedirectUrl");
      router.replace(redirectUrl || "/design");
      redirected.current = true;
    }
  }, [redirected, session, router]);

  return (
    <div className="flex  items-center justify-center h-screen">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut", type: "spring", damping: 10 }}
        className="flex flex-col gap-12 justify-between bg-primary/5 p-8 rounded-2xl border border-primary/10 shadow-xl shadow-primary/5 min-w-[30vw]"
      >
        <div className="flex flex-col gap-12">
          <div className="flex flex-col text-center">
            <h2 className="font-semibold text-3xl md:text-4xl tracking-tighter">
              Welcome to{" "}
              <span className="font-bold bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tighter">
                same dev
              </span>
            </h2>
            <p className="text-primary/75 font-medium tracking-tighter text-lg md:text-xl">
              Log in to access !
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className="w-full flex gap-2 p-4 font-medium md:text-lg rounded-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer bg-gradient-to-b from-blue-400 to-blue-700 text-white justify-center items-center"
              onClick={async () => {
                await signIn("google", { callbackUrl: "/design" });
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 30 30"
                fill="currentColor"
                className="size-6 md:size-8 text-white"
              >
                <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
              </svg>
              Continue with Google
            </div>
            
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Separator className="w-full my-2" />
          <Link href={"/"} className="flex items-center gap-2 cursor-pointer mx-auto">
            
            <div className="flex flex-col">
              <span className="font-bold bg-gradient-to-b from-blue-400 to-blue-700 bg-clip-text text-transparent text-4xl tracking-tighter">
                same dev
              </span>
              <p className="text-primary tracking-tight text-lg leading-none">Make Beautiful UI</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signin;