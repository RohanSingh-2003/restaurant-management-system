interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-neutral-400">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-md bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1">
        Module under development
      </span>
    </div>
  );
}
