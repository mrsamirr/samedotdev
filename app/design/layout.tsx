import { AppbarAtPlayGround } from "@/components/AppbarAtPlayGround";




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
