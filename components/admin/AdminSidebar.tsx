"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/files", label: "Files" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-[#E5E2DA] bg-white px-4 py-4 lg:w-56 lg:border-b-0 lg:border-r">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">
        Admin
      </p>
      <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {links.map((l) => {
          const active =
            l.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#F7F6F3] text-[#2F3437]"
                  : "text-[#6B6B6B] hover:bg-[#F7F6F3]/80 hover:text-[#2F3437]"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
