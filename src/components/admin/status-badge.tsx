const colors: Record<string, string> = {
  new: "bg-blue-lt",
  contacted: "bg-yellow-lt",
  quoted: "bg-purple-lt",
  converted: "bg-green-lt",
  cancelled: "bg-red-lt",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${colors[status] ?? "bg-secondary-lt"}`}>{status}</span>
  );
}