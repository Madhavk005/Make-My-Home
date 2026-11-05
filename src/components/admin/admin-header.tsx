"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export function AdminHeader({ userName }: { userName?: string | null }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await signOut();
      if (result.error) {
        setSignOutError(result.error.message || "Could not sign out. Please try again.");
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="navbar navbar-expand-md navbar-light d-print-none">
      <div className="container-xl">
        <div className="navbar-nav flex-row order-md-last">
          <div className="nav-item">
            <span className="nav-link">{userName ?? "Admin"}</span>
          </div>
          {signOutError ? (
            <p role="alert" className="navbar-text text-danger mb-0">{signOutError}</p>
          ) : null}
          <div className="nav-item">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="nav-link btn btn-link"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
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
