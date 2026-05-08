"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/folders", label: "Folders" },
  { href: "/admin/files", label: "Files" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-border bg-card px-4 py-4 lg:w-56 lg:border-b-0 lg:border-r">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
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
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-surface hover:text-foreground"
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
