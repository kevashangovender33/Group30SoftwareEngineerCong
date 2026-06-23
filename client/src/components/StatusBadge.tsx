interface StatusBadgeProps {
  status: 'OPEN' | 'TRIAGED' | 'CLOSED';
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; classes: string; icon: string }> = {
  OPEN: { label: 'OPEN', classes: 'bg-blue-100 text-blue-700', icon: 'radio_button_checked' },
  TRIAGED: { label: 'TRIAGED', classes: 'bg-amber-100 text-amber-700', icon: 'assignment' },
  CLOSED: { label: 'CLOSED', classes: 'bg-gray-100 text-gray-700', icon: 'check_circle' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes, icon } = statusConfig[status];

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-label-md font-bold uppercase tracking-wider ${classes}`}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      {label}
    </span>
  );
}
