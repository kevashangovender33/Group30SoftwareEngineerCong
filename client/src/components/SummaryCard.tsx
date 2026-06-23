interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

const VARIANT_STYLES: Record<string, { iconBg: string; iconColor: string }> = {
  default: { iconBg: 'bg-surface-container-low', iconColor: 'text-primary' },
  warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-700' },
  success: { iconBg: 'bg-green-50', iconColor: 'text-green-700' },
  danger: { iconBg: 'bg-red-50', iconColor: 'text-red-700' },
};

/**
 * Formats a number with locale-appropriate thousands separators.
 * e.g., 1234 → "1,234"
 */
export function formatMetricValue(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function SummaryCard({ label, value, icon, variant = 'default' }: SummaryCardProps) {
  const styles = VARIANT_STYLES[variant];
  const formattedValue = formatMetricValue(value);

  return (
    <div
      className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 flex items-center gap-4"
      data-testid={`summary-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      aria-label={`${label}: ${formattedValue}`}
    >
      <div className={`w-10 h-10 rounded-lg ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-xl ${styles.iconColor}`}>{icon}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-label-md text-on-surface-variant truncate">{label}</span>
        <span className="text-headline-md font-bold text-on-surface" data-testid="summary-card-value">
          {formattedValue}
        </span>
      </div>
    </div>
  );
}
