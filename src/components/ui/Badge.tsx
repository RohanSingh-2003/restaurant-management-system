interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-neutral-100 text-neutral-600',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error: 'bg-error-light text-error',
  info: 'bg-info-light text-info',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'completed' | 'running' | 'failed' | 'pending';
  className?: string;
}

const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  running: { variant: 'info', label: 'Running' },
  failed: { variant: 'error', label: 'Failed' },
  pending: { variant: 'warning', label: 'Pending' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { variant, label } = statusMap[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
