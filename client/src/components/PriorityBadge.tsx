import type { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; classes: string; icon: string }> = {
  HIGH: { label: 'Priority: HIGH', classes: 'bg-red-100 text-red-700', icon: 'priority_high' },
  MEDIUM: { label: 'Priority: MEDIUM', classes: 'bg-amber-100 text-amber-700', icon: 'remove' },
  LOW: { label: 'Priority: LOW', classes: 'bg-green-100 text-green-700', icon: 'check' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, classes, icon } = priorityConfig[priority];

  return (
    <span
      data-testid="priority-badge"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-label-md font-bold uppercase tracking-wider ${classes}`}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      {label}
    </span>
  );
}
