interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>
        )}
      </div>
      {children && <div className="mt-3 sm:mt-0 flex items-center gap-2">{children}</div>}
    </div>
  );
}
