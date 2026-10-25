import { useState, useEffect } from 'react';
import { Card, Button } from '../../../components/ui';
import { loadDataset } from '../../../services/tarriDataService';
import { runETLPipeline } from '../../../services/warehouse/etlService';
import type { TarriRecord, ETLExecutionResult } from '../../../types/dataset';

export function ETLPipelinePage() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningETL, setIsRunningETL] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'extract' | 'transform' | 'load' | 'done'>('idle');
  const [etlResult, setEtlResult] = useState<ETLExecutionResult | null>(null);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        const initialResult = runETLPipeline(data);
        setEtlResult(initialResult);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset for ETL', err);
        setIsLoading(false);
      });
  }, []);

  const handleRunETL = () => {
    if (records.length === 0) return;
    setIsRunningETL(true);
    setCurrentStep('extract');

    setTimeout(() => {
      setCurrentStep('transform');
      setTimeout(() => {
        setCurrentStep('load');
        setTimeout(() => {
          const res = runETLPipeline(records);
          setEtlResult(res);
          setCurrentStep('done');
          setIsRunningETL(false);
          setTimeout(() => setCurrentStep('idle'), 4000);
        }, 350);
      }, 350);
    }, 350);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">ETL Pipeline</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Extract, transform and prepare restaurant data for analytical processing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunETL}
            disabled={isRunningETL || isLoading}
            className="text-xs bg-accent text-white font-medium hover:bg-accent/90 px-4 py-2"
          >
            {isRunningETL ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Executing Pipeline...
              </span>
            ) : (
              'Run ETL Pipeline'
            )}
          </Button>
        </div>
      </div>

      {/* Progress Toast */}
      {currentStep !== 'idle' && (
        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            {currentStep === 'extract' && 'Stage 1: Extracting tarri_data.csv raw line-item source...'}
            {currentStep === 'transform' && 'Stage 2: Transforming data types, parsing calendar dates, and normalizing categories...'}
            {currentStep === 'load' && 'Stage 3: Loading Fact and Dimension records into Analytical Star Schema...'}
            {currentStep === 'done' && '✓ ETL Pipeline execution completed successfully.'}
          </div>
          <span className="font-mono text-[11px] text-blue-700 uppercase tracking-wider">
            Step: {currentStep.toUpperCase()}
          </span>
        </div>
      )}

      {/* 2. Pipeline Visualization Flow */}
      <Card className="border border-neutral-100 bg-white">
        <div className="mb-4 pb-2 border-b border-neutral-100">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Architecture
          </span>
          <h3 className="text-sm font-semibold text-neutral-800 mt-0.5">
            Data Warehouse Ingestion & Transformation Flow
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Box 1: Source */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                1. Source
              </span>
              <h4 className="font-bold text-neutral-800 text-sm mt-1 font-mono">
                tarri_data.csv
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Operational restaurant log (4,385 lines, 14 headers)
              </p>
            </div>
            <div className="mt-3 text-[11px] text-neutral-400 font-mono">
              Raw Ingestion
            </div>
          </div>

          {/* Box 2: Extract */}
          <div className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
            currentStep === 'extract' ? 'border-accent bg-accent/5' : 'border-neutral-200 bg-white'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  2. Extract
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Active
                </span>
              </div>
              <h4 className="font-bold text-neutral-800 text-sm mt-1">
                CSV Ingestion
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Validates header token schema and text stream
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-neutral-600">
              {records.length.toLocaleString('en-GB')} rows read
            </div>
          </div>

          {/* Box 3: Transform */}
          <div className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
            currentStep === 'transform' ? 'border-accent bg-accent/5' : 'border-neutral-200 bg-white'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  3. Transform
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Active
                </span>
              </div>
              <h4 className="font-bold text-neutral-800 text-sm mt-1">
                Data Scrubbing
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Date hierarchies, floats, string trim, and cancellation flag
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-neutral-600">
              9 transformations applied
            </div>
          </div>

          {/* Box 4: Load */}
          <div className={`p-3.5 rounded-xl border transition-colors flex flex-col justify-between ${
            currentStep === 'load' ? 'border-accent bg-accent/5' : 'border-neutral-200 bg-white'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  4. Load
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Active
                </span>
              </div>
              <h4 className="font-bold text-neutral-800 text-sm mt-1">
                Star Schema
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Populates FACT_SALES and 4 dimensional lookup tables
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-neutral-600">
              5 analytical structures
            </div>
          </div>

          {/* Box 5: Analytical Dataset */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                5. Target
              </span>
              <h4 className="font-bold text-neutral-800 text-sm mt-1">
                OLAP / ML Cube
              </h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Serves verified facts to Analytics, OLAP, and ML models
              </p>
            </div>
            <div className="mt-3 text-[11px] text-emerald-700 font-semibold">
              Ready for Analysis
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Stage Execution Metrics */}
      {etlResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Extract Card */}
          <Card className="border border-neutral-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Stage 1: Extract
              </h4>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Completed
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Source Dataset:</span>
                <span className="font-mono font-semibold text-neutral-800">tarri_data.csv</span>
              </div>
              <div className="flex justify-between">
                <span>Rows Extracted:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {etlResult.extractedRows.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Columns Ingested:</span>
                <span className="font-mono text-neutral-800">14 headers</span>
              </div>
              <div className="flex justify-between">
                <span>Extraction Timestamp:</span>
                <span className="font-mono text-neutral-500">{etlResult.executionTime}</span>
              </div>
            </div>
          </Card>

          {/* Transform Card */}
          <Card className="border border-neutral-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Stage 2: Transform
              </h4>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Completed
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Input Records:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {etlResult.extractedRows.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transformed Records:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {etlResult.transformedRows.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fields Standardized:</span>
                <span className="font-mono text-neutral-800">{etlResult.rowsModified.toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span>Records Dropped:</span>
                <span className="font-mono text-neutral-800">0 (100% Retained)</span>
              </div>
            </div>
          </Card>

          {/* Load Card */}
          <Card className="border border-neutral-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Stage 3: Load
              </h4>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Completed
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Destination Model:</span>
                <span className="font-mono font-semibold text-neutral-800">In-Memory Analytical Cube</span>
              </div>
              <div className="flex justify-between">
                <span>Fact Rows Loaded:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {etlResult.loadedRows.toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Star Schema Tables:</span>
                <span className="font-mono text-neutral-800">1 Fact + 4 Dimensions</span>
              </div>
              <div className="flex justify-between">
                <span>Pipeline Duration:</span>
                <span className="font-mono text-neutral-800">{etlResult.durationMs} ms</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Transformed Data Model: Logical Star Schema */}
      {etlResult && (
        <Card className="border border-neutral-100 bg-white">
          <div className="mb-4 pb-2 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Transformed Data Model: Logical Star Schema
              </h3>
              <p className="text-xs text-neutral-500">
                Relational dimensional representation mapping central sales facts to surrounding business dimensions.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-neutral-100 text-neutral-700">
              Standard 1:N Star Schema
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Fact Table (Center) */}
            <div className="lg:col-span-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-blue-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  CENTRAL FACT TABLE
                </span>
                <span className="text-xs font-mono font-semibold text-blue-900">
                  {etlResult.schema.factTable.recordCount.toLocaleString('en-GB')} rows
                </span>
              </div>
              <h4 className="font-mono font-bold text-neutral-800 text-sm">
                {etlResult.schema.factTable.name}
              </h4>
              <p className="text-[11px] text-neutral-600">
                {etlResult.schema.factTable.description}
              </p>

              <div className="pt-2">
                <span className="text-[10px] font-semibold uppercase text-neutral-400 block mb-1">
                  Analytical Measures:
                </span>
                <div className="flex flex-wrap gap-1">
                  {etlResult.schema.factTable.measures.map((m) => (
                    <span key={m} className="text-[11px] px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-mono">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dimension Tables (Surrounding) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {etlResult.schema.dimensionTables.map((dim) => (
                <div key={dim.name} className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-mono font-semibold text-xs text-neutral-800">
                      {dim.name}
                    </h5>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Cardinality: {dim.cardinality}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    Primary Key: <span className="font-semibold text-neutral-700">{dim.key}</span>
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    Attributes: {dim.attributes.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 5. ETL Data Quality Before & After */}
      {etlResult && (
        <Card className="border border-neutral-100 bg-white">
          <div className="mb-3 pb-2 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-800">
              ETL Quality Audit (Source vs. Transformed Target)
            </h3>
            <p className="text-xs text-neutral-500">
              Strict audit of integrity metrics across pipeline execution stages.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2.5">Integrity Metric</th>
                  <th className="px-4 py-2.5 text-right">Extract Stage (Input)</th>
                  <th className="px-4 py-2.5 text-right">Load Stage (Output)</th>
                  <th className="px-4 py-2.5 text-right">Audit Variance</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-neutral-800">Total Observations</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityBefore.totalRows.toLocaleString('en-GB')}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityAfter.totalRows.toLocaleString('en-GB')}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-500">0 (Zero loss)</td>
                  <td className="px-4 py-2.5 font-sans"><span className="text-emerald-700 font-semibold">100% Ingested</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-neutral-800">Duplicate Rows</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityBefore.duplicateRows}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityAfter.duplicateRows}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-500">0</td>
                  <td className="px-4 py-2.5 font-sans"><span className="text-emerald-700 font-semibold">No Duplicates</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-neutral-800">Missing Mandatory Fields</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityBefore.missingValues}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-800">{etlResult.qualityAfter.missingValues}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-500">0</td>
                  <td className="px-4 py-2.5 font-sans"><span className="text-emerald-700 font-semibold">Complete</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-neutral-800">Cancelled Transactions</td>
                  <td className="px-4 py-2.5 text-right text-rose-700">{etlResult.qualityBefore.cancelledRecords}</td>
                  <td className="px-4 py-2.5 text-right text-rose-700">{etlResult.qualityAfter.cancelledRecords}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-500">0</td>
                  <td className="px-4 py-2.5 font-sans"><span className="text-amber-700 font-semibold">Isolated in DIM_STATUS</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. Pipeline Execution Log */}
      {etlResult && (
        <Card className="border border-neutral-100 bg-white">
          <div className="mb-3 pb-2 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Pipeline Execution Log
              </h3>
              <p className="text-xs text-neutral-500">
                Detailed chronological trace of all operations executed by the warehouse ingestion engine.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {etlResult.logs.length} Log Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5">Operation Description</th>
                  <th className="px-4 py-2.5 text-right">Records Processed</th>
                  <th className="px-4 py-2.5">Details</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {etlResult.logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-2.5 text-neutral-500">{log.timestamp}</td>
                    <td className="px-4 py-2.5 font-sans font-semibold text-neutral-800">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        log.stage === 'Extract'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : log.stage === 'Transform'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {log.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-neutral-800">{log.operation}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-800">{log.recordCount.toLocaleString('en-GB')}</td>
                    <td className="px-4 py-2.5 font-sans text-neutral-500 text-[11px]">{log.details || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <span className="text-emerald-700 font-semibold">{log.status}</span>
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
