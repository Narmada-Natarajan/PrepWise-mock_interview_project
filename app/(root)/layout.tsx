import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { UserAvatar } from "@/components/UserAvatar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isOnboarded) redirect("/onboarding");

  return (
    <div className="root-layout">
      <nav className="glassmorphism-nav flex items-center justify-between px-6 py-4 rounded-3xl mt-4">
        <Link href="/" className="flex items-center gap-3 group transition-all">
          <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Image src="/logo.svg" alt="PrepWise Logo" width={32} height={28} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight gradient-text">PrepWise</h2>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-foreground leading-none">{user.name}</span>
            {/* <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Free Plan</span> */}
          </div>
          <UserAvatar user={user} />
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
