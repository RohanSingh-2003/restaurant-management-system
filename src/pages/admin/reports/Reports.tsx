import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui';
import { loadDataset } from '../../../services/tarriDataService';
import {
  generateReport,
  exportReportToCSV,
  triggerPrintReport,
} from '../../../services/reporting/reportService';
import type { TarriRecord } from '../../../types/dataset';
import type { GeneratedReport, ReportType, ReportHistoryItem } from '../../../types/dataset';

const REPORT_TYPE_CONFIG: { type: ReportType; title: string; desc: string }[] = [
  {
    type: 'executive-summary',
    title: 'Executive Performance Summary',
    desc: 'High-level business health, margin realization, fulfillment channels, and category cash flow.',
  },
  {
    type: 'sales-performance',
    title: 'Sales & Revenue Performance Audit',
    desc: 'Chronological monthly sales ledgers, peak trading days, service slots, and delivery velocity.',
  },
  {
    type: 'product-performance',
    title: 'Menu Item & Product Profitability Matrix',
    desc: 'Dish rankings, bestseller volumes, price point elasticity, and gross profit contributions.',
  },
  {
    type: 'data-mining',
    title: 'Data Mining & Machine Learning Model Audit',
    desc: 'Candidate models evaluation, Regression R²/MAE, Classification Macro F1, and Clustering K selection.',
  },
];

export function ReportsPage() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ReportType>('executive-summary');
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setIsLoading(false);
        // Generate default executive report
        const rep = generateReport(data, 'executive-summary');
        setActiveReport(rep);
        setHistory([
          {
            id: rep.id,
            title: rep.title,
            type: rep.type,
            generatedAt: rep.generatedAt,
            recordCount: data.length,
            status: 'Ready',
          },
        ]);
      })
      .catch((err) => {
        console.error('Failed to load dataset for reports', err);
        setIsLoading(false);
      });
  }, []);

  const handleGenerateReport = (typeToGen: ReportType) => {
    if (records.length === 0) return;
    setIsGenerating(true);
    setSelectedType(typeToGen);

    setTimeout(() => {
      try {
        const rep = generateReport(records, typeToGen);
        setActiveReport(rep);
        setHistory((prev) => [
          {
            id: rep.id,
            title: rep.title,
            type: rep.type,
            generatedAt: rep.generatedAt,
            recordCount: records.length,
            status: 'Ready',
          },
          ...prev.slice(0, 4),
        ]);
      } catch (err) {
        console.error('Report generation error', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header with Export Actions */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">Analytical Reports</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Generate formal business reports from restaurant performance and analytical models.
          </p>
        </div>

        {activeReport && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => exportReportToCSV(activeReport)}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={triggerPrintReport}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 active:bg-accent/95 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
            >
              Print / Save PDF
            </button>
          </div>
        )}
      </div>

      {/* 2. Report Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_TYPE_CONFIG.map((cfg) => {
          const isSelected = selectedType === cfg.type;
          return (
            <button
              key={cfg.type}
              type="button"
              disabled={isGenerating || isLoading}
              onClick={() => handleGenerateReport(cfg.type)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              }`}
            >
              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${
                  isSelected ? 'text-accent' : 'text-neutral-400'
                }`}>
                  Report Archetype
                </span>
                <h4 className="font-semibold text-neutral-800 text-xs">{cfg.title}</h4>
                <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {cfg.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <span className={isSelected ? 'text-accent font-semibold' : 'text-neutral-400'}>
                  {isSelected ? 'Active Preview' : 'Click to Generate'}
                </span>
                <span className="font-mono text-neutral-300">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Report Document Preview */}
      {activeReport && (
        <div id="report-print-container" className="space-y-6">
          <Card className="border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
            {/* Report Document Header */}
            <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 font-mono">
                  Official Analytical Document
                </span>
                <h2 className="text-xl font-bold text-neutral-900 mt-0.5">
                  {activeReport.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mt-1">
                  <span>Generated: <strong>{activeReport.generatedAt}</strong></span>
                  <span>·</span>
                  <span>Dataset: <strong>{activeReport.dataset}</strong></span>
                  <span>·</span>
                  <span>Period: <strong>{activeReport.dateRange}</strong></span>
                </div>
              </div>

              <div className="text-right self-start sm:self-auto">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-neutral-100 text-neutral-700">
                  {activeReport.id}
                </span>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Gross Revenue</span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  £{activeReport.summary.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Total Orders</span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  {activeReport.summary.totalOrders.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Estimated Profit</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  £{activeReport.summary.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Profit Margin</span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  {activeReport.summary.profitMargin}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Quantity Sold</span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  {activeReport.summary.quantitySold.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Avg Order Value</span>
                <span className="text-base font-bold text-neutral-900 font-mono">
                  £{activeReport.summary.averageOrderValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Key Business Findings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                Executive Findings & Insights
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {activeReport.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tabular Breakdowns */}
            <div className="space-y-6">
              {activeReport.tables.map((table, tIdx) => (
                <div key={tIdx} className="space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-800">
                    {table.title}
                  </h4>
                  <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                        <tr>
                          {table.headers.map((h) => (
                            <th key={h} className="px-3.5 py-2.5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 font-mono">
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-neutral-50/50">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`px-3.5 py-2 ${
                                  cIdx === 0
                                    ? 'font-sans font-medium text-neutral-800'
                                    : 'text-neutral-700'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Report Footer */}
            <div className="pt-4 border-t border-neutral-100 text-[11px] text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>{activeReport.notes || 'Official Data Warehouse Analytical Export.'}</span>
              <span>Prepared for Restaurant Management Suite</span>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Session Report History */}
      {history.length > 0 && (
        <Card className="border border-neutral-100 bg-white">
          <div className="mb-3 pb-2 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">
              Session Generation History
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {history.length} Reports
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2">Report Token</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Generated Timestamp</th>
                  <th className="px-4 py-2 text-right">Observations</th>
                  <th className="px-4 py-2 text-right">Status</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-2 text-neutral-500 font-semibold">{item.id}</td>
                    <td className="px-4 py-2 font-sans font-medium text-neutral-800">{item.title}</td>
                    <td className="px-4 py-2 text-neutral-600">{item.generatedAt}</td>
                    <td className="px-4 py-2 text-right text-neutral-700">{item.recordCount.toLocaleString('en-GB')}</td>
                    <td className="px-4 py-2 text-right font-sans">
                      <span className="text-emerald-700 font-semibold">{item.status}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleGenerateReport(item.type)}
                        className="text-xs text-blue-600 hover:underline font-sans"
                      >
                        Reload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
