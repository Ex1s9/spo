import { BarChart3 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { UserMenu } from "@/features/auth/user-menu";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="size-5" />
            SPO
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
