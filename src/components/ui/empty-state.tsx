interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="surface-card p-8 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{description}</p>
    </div>
  );
}
