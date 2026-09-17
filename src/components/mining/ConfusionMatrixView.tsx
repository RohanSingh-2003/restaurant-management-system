import type { ConfusionMatrixData } from '../../types/mining';

interface ConfusionMatrixViewProps {
  data: ConfusionMatrixData;
  classBreakdown?: {
    className: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }[];
}

export function ConfusionMatrixView({ data, classBreakdown }: ConfusionMatrixViewProps) {
  const { classes, matrix, totalSamples } = data;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
          Confusion Matrix (Actual vs Predicted)
        </h4>
        <p className="text-xs text-neutral-400 mt-0.5">
          Rows represent actual ground-truth classes; columns represent model predictions on {totalSamples} test instances.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-neutral-100 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100 text-neutral-500">
              <th className="px-3 py-2 text-left font-semibold">Actual \ Predicted</th>
              {classes.map((cls) => (
                <th key={cls} className="px-3 py-2 text-center font-semibold">
                  Pred: {cls}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-semibold">Support</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((actualCls, rIdx) => {
              const rowTotal = matrix[rIdx].reduce((a, b) => a + b, 0);
              return (
                <tr key={actualCls} className="border-b border-neutral-50">
                  <td className="px-3 py-2.5 font-semibold text-neutral-800 bg-neutral-25/50">
                    Actual: {actualCls}
                  </td>
                  {classes.map((predCls, cIdx) => {
                    const count = matrix[rIdx][cIdx];
                    const isDiagonal = rIdx === cIdx;
                    const pct = rowTotal > 0 ? ((count / rowTotal) * 100).toFixed(0) : '0';
                    return (
                      <td
                        key={predCls}
                        className={`px-3 py-2.5 text-center font-medium transition-colors ${
                          isDiagonal
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : count > 0
                            ? 'bg-rose-50/70 text-rose-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        <div>{count}</div>
                        <div className="text-[10px] text-neutral-400 font-normal">
                          {pct}%
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-right font-semibold text-neutral-700 bg-neutral-25/50">
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {classBreakdown && (
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 uppercase text-[10px]">
                <th className="py-2 text-left font-medium">Class</th>
                <th className="py-2 text-right font-medium">Precision</th>
                <th className="py-2 text-right font-medium">Recall</th>
                <th className="py-2 text-right font-medium">F1-Score</th>
                <th className="py-2 text-right font-medium">Support</th>
              </tr>
            </thead>
            <tbody>
              {classBreakdown.map((cb) => (
                <tr key={cb.className} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                  <td className="py-2 font-semibold text-neutral-800">{cb.className}</td>
                  <td className="py-2 text-right text-neutral-700">{(cb.precision * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right text-neutral-700">{(cb.recall * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right font-semibold text-accent">{(cb.f1 * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right text-neutral-500">{cb.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
