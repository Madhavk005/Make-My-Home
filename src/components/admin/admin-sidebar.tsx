"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconInbox,
  IconBrowser,
  IconSettings,
  IconFolders,
} from "@tabler/icons-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: IconLayoutDashboard },
  { label: "Enquiries", href: "/admin/enquiries", icon: IconInbox },
  { label: "Categories", href: "/admin/categories", icon: IconFolders },
  { label: "Sanity Studio", href: "/studio", icon: IconBrowser, newTab: true },
  { label: "Settings", href: "/admin/settings", icon: IconSettings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-icon d-lg-none mb-3"
        onClick={() => setOpen((value) => !value)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <aside className={`navbar navbar-vertical navbar-expand-lg ${open ? "" : "collapsed"}`}>
        <div className="container-fluid">
          <div className="navbar-brand navbar-brand-autodark">
            <span className="navbar-brand-text">Make My Home</span>
          </div>
          <div className="collapse navbar-collapse show">
            <ul className="navbar-nav pt-lg-3">
              {navigation.map(({ label, href, icon: Icon, newTab }) => {
                const active =
                  href === "/admin" ? pathname === href : pathname.startsWith(href);
                const className = `nav-link${active ? " active" : ""}`;

                return (
                  <li key={href} className={`nav-item ${active ? "active" : ""}`}>
                    {newTab ? (
                      <a
                        href={href}
                        className={className}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                      >
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <Icon size={20} stroke={1.8} />
                        </span>
                        <span className="nav-link-title">{label}</span>
                      </a>
                    ) : (
                      <Link href={href} className={className} onClick={() => setOpen(false)}>
                        <span className="nav-link-icon d-md-none d-lg-inline-block">
                          <Icon size={20} stroke={1.8} />
                        </span>
                        <span className="nav-link-title">{label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
