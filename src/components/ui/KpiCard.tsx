import type { KpiData } from '../../types';
import { Card } from './Card';

export function KpiCard({ label, value, change, changeType, subtext }: KpiData) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold text-neutral-800 tracking-tight">
          {value}
        </p>
      </div>
      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`font-semibold ${
                isPositive
                  ? 'text-success'
                  : isNegative
                  ? 'text-error'
                  : 'text-neutral-500'
              }`}
            >
              {change}
            </span>
          )}
          {subtext && (
            <span className="text-neutral-400">{subtext}</span>
          )}
        </div>
      )}
    </Card>
  );
}
