import type { AgeIndicator } from '../types';

interface AgeBadgeProps {
  ageIndicator: AgeIndicator;
}

const ageConfig: Record<AgeIndicator, { label: string; classes: string; icon: string }> = {
  NEW: { label: 'Age: NEW', classes: 'bg-surface-container-high text-on-surface-variant', icon: 'schedule' },
  AGING: { label: 'Age: AGING', classes: 'bg-amber-100 text-amber-700', icon: 'schedule' },
  OVERDUE: { label: 'Age: OVERDUE', classes: 'bg-red-100 text-red-700', icon: 'warning' },
};

export function AgeBadge({ ageIndicator }: AgeBadgeProps) {
  const { label, classes, icon } = ageConfig[ageIndicator];

  return (
    <span
      data-testid="age-badge"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded text-label-md font-bold uppercase tracking-wider ${classes}`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </span>
  );
}
