import React from 'react';
import type { ModelComparisonRow } from '../../types/mining';

interface ModelComparisonTableProps {
  title?: string;
  subtitle?: string;
  rows: ModelComparisonRow[];
  selectedModelName?: string;
  onSelectModel?: (name: string) => void;
}

export const ModelComparisonTable: React.FC<ModelComparisonTableProps> = ({
  title = 'Model Evaluation & Comparison',
  subtitle = 'Candidate methods evaluated side-by-side on the identical test partition.',
  rows,
  selectedModelName,
  onSelectModel,
}) => {
  if (!rows || rows.length === 0) return null;

  // Derive columns dynamically from the first row's metrics keys
  const metricColumns = Object.keys(rows[0].metrics || {});

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {rows.length} Candidates Evaluated
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs text-gray-500 font-medium uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Candidate Method / Configuration</th>
              {metricColumns.map((col) => (
                <th key={col} className="px-6 py-3 text-right">
                  {col}
                </th>
              ))}
              <th className="px-6 py-3 text-right">Status / Notes</th>
              {onSelectModel && <th className="px-6 py-3 text-center">Inspect</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const isWinning = row.isRecommended;
              const isSelected = selectedModelName === row.modelName;

              return (
                <tr
                  key={row.modelName}
                  className={`transition-colors ${
                    isWinning
                      ? 'bg-blue-50/30 font-medium'
                      : isSelected
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="px-6 py-3.5 text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{row.modelName}</span>
                      {isWinning && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Recommended
                        </span>
                      )}
                    </div>
                  </td>

                  {metricColumns.map((col) => (
                    <td
                      key={col}
                      className={`px-6 py-3.5 text-right font-mono text-xs ${
                        isWinning ? 'text-gray-900 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {row.metrics[col] ?? '—'}
                    </td>
                  ))}

                  <td className="px-6 py-3.5 text-right text-xs text-gray-500">
                    {row.notes || (isWinning ? 'Optimal candidate' : 'Baseline')}
                  </td>

                  {onSelectModel && (
                    <td className="px-6 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectModel(row.modelName)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          isSelected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'View'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
