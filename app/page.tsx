import { Landing } from "@/components/Landing";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";


export default async function Page() {
  const session = await getServerSession();

  if (session) {
    redirect("/design");
  }

  return (
    <main>
      <Landing />
    </main>
  );
}