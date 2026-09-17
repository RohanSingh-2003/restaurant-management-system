interface LeakageWarningProps {
  warning: string;
}

export function LeakageWarning({ warning }: LeakageWarningProps) {
  return (
    <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/70 text-amber-900 text-xs leading-relaxed space-y-1">
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Data Leakage Notice
      </div>
      <p className="text-neutral-700">
        {warning}
      </p>
    </div>
  );
}
