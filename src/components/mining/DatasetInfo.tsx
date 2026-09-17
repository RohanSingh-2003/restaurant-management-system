import { Card } from '../ui';
import type { DatasetMeta } from '../../types/mining';

interface DatasetInfoProps {
  meta: DatasetMeta;
  levelLabel?: string;
}

export function DatasetInfo({ meta, levelLabel = 'Transaction / Line Item' }: DatasetInfoProps) {
  return (
    <Card className="border border-neutral-100 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100">
        <div>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Dataset Source
          </span>
          <h3 className="text-base font-semibold text-neutral-800 mt-0.5">
            {meta.filename}
          </h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 self-start sm:self-auto">
          Analysis uses the complete available dataset
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
        <div className="p-2.5 rounded-lg bg-neutral-50">
          <span className="text-[11px] text-neutral-400 font-medium">Dataset Rows</span>
          <p className="text-sm font-semibold text-neutral-800 mt-0.5">
            {meta.totalRows.toLocaleString('en-GB')}
          </p>
          <span className="text-[10px] text-neutral-400">{levelLabel} level</span>
        </div>
        <div className="p-2.5 rounded-lg bg-neutral-50">
          <span className="text-[11px] text-neutral-400 font-medium">Columns</span>
          <p className="text-sm font-semibold text-neutral-800 mt-0.5">
            {meta.totalColumns} attributes
          </p>
          <span className="text-[10px] text-neutral-400">Structured tabular</span>
        </div>
        <div className="p-2.5 rounded-lg bg-neutral-50">
          <span className="text-[11px] text-neutral-400 font-medium">Date Span</span>
          <p className="text-xs font-semibold text-neutral-800 mt-0.5 truncate">
            {meta.dateRange}
          </p>
          <span className="text-[10px] text-neutral-400">Full 36-month timeline</span>
        </div>
        <div className="p-2.5 rounded-lg bg-neutral-50">
          <span className="text-[11px] text-neutral-400 font-medium">Cancelled Rows</span>
          <p className="text-sm font-semibold text-neutral-800 mt-0.5">
            {meta.cancelledRows}
          </p>
          <span className="text-[10px] text-neutral-400">Handled per ML task</span>
        </div>
      </div>
    </Card>
  );
}
