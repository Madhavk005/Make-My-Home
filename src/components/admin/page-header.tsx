import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header d-print-none">
      <div className="row align-items-center">
        <div className="col">
          <h2 className="page-title">{title}</h2>
          {description ? <p className="text-secondary mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="col-auto ms-auto">{actions}</div> : null}
      </div>
    </div>
  );
}