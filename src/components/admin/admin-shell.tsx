import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <div className="page">
      <AdminSidebar />
      <div className="page-wrapper">
        <AdminHeader userName={user.name ?? user.email} />
        <div className="page-body">
          <div className="container-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}