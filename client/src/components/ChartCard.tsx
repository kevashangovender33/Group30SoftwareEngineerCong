interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div
      className="bg-surface-container-lowest rounded-lg border border-outline-variant p-6"
      data-testid={`chart-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <h3 className="text-body-lg font-normal text-on-surface mb-4">{title}</h3>
      {children}
    </div>
  );
}
