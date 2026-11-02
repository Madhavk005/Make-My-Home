export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center">
          {icon ? <div className="subheader me-3">{icon}</div> : null}
          <div>
            <div className="text-secondary">{label}</div>
            <div className="h1 mb-0">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}