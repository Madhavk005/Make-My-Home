"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconPackage,
  IconCategory,
  IconTags,
  IconInbox,
  IconBrowser,
  IconSettings,
} from "@tabler/icons-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: IconLayoutDashboard },
  { label: "Products", href: "/admin/products", icon: IconPackage },
  { label: "Categories", href: "/admin/categories", icon: IconCategory },
  { label: "Brands", href: "/admin/brands", icon: IconTags },
  { label: "Enquiries", href: "/admin/enquiries", icon: IconInbox },
  { label: "Website CMS", href: "/admin/cms", icon: IconBrowser },
  { label: "Settings", href: "/admin/settings", icon: IconSettings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Need useState import
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
              {navigation.map(({ label, href, icon: Icon }) => {
                const active =
                  href === "/admin" ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href} className={`nav-item ${active ? "active" : ""}`}>
                    <Link href={href} className="nav-link" onClick={() => setOpen(false)}>
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        <Icon size={20} stroke={1.8} />
                      </span>
                      <span className="nav-link-title">{label}</span>
                    </Link>
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