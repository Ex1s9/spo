"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardNav() {
  const pathname = usePathname()
  return <nav aria-label="Разделы аналитики" className="flex gap-4 border-b pb-3 text-sm">
    {[{ href: "/dashboard", label: "Трекер вакансий" }, { href: "/dashboard/skills", label: "Радар навыков" }].map((item) => (
      <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={pathname === item.href ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}>{item.label}</Link>
    ))}
  </nav>
}
