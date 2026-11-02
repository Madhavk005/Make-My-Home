"use client";

import Link from "next/link";

export function AdminHeader({ userName }: { userName?: string | null }) {
  return (
    <header className="navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item">
            <span className="nav-link">{userName ?? "Admin"}</span>
          </div>
          <div className="nav-item">
            <Link href="/api/auth/sign-out" className="nav-link">
              Sign out
            </Link>
          </div>
        </div>
        <div className="collapse navbar-collapse">
          <h2 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            Admin panel
          </h2>
        </div>
      </div>
    </header>
  );
}