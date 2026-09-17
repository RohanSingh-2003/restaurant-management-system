import { useState, useEffect, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, Button } from '../../../components/ui';
import { DatasetInfo } from '../../../components/mining/DatasetInfo';
import { InputOutputGuide } from '../../../components/mining/InputOutputGuide';
import { PipelineDiagram } from '../../../components/mining/PipelineDiagram';
import { LeakageWarning } from '../../../components/mining/LeakageWarning';
import { BestMethodCard } from '../../../components/mining/BestMethodCard';
import { ModelComparisonTable } from '../../../components/mining/ModelComparisonTable';
import { loadDataset } from '../../../services/tarriDataService';
import { getDatasetMeta } from '../../../services/mining/dataAggregation';
import { checkDataLeakage } from '../../../services/mining/preprocessing';
import { runRegressionComparison } from '../../../services/mining/regression';
import type { TarriRecord } from '../../../types/dataset';
import type {
  RegressionComparisonResult,
  RegressionModelResult,
  DatasetMeta,
} from '../../../types/mining';

const VALID_TARGETS = [
  { value: 'Est. Profit', label: 'Est. Profit (£)' },
  { value: 'Gross Sales', label: 'Gross Sales (£)' },
  { value: 'Est. Cost', label: 'Est. Cost (£)' },
  { value: 'Quantity', label: 'Quantity (Portions)' },
  { value: 'Price Per Item', label: 'Price Per Item (£)' },
];

const AVAILABLE_FEATURES = [
  { value: 'Quantity', label: 'Quantity', type: 'numerical' },
  { value: 'Price Per Item', label: 'Price Per Item', type: 'numerical' },
  { value: 'Gross Sales', label: 'Gross Sales', type: 'numerical' },
  { value: 'Est. Cost', label: 'Est. Cost', type: 'numerical' },
  { value: 'Est. Profit', label: 'Est. Profit', type: 'numerical' },
  { value: 'Category', label: 'Category (Menu Section)', type: 'categorical' },
  { value: 'OrderType', label: 'Order Type (Delivery/Collection)', type: 'categorical' },
  { value: 'DayOfWeek', label: 'Day of Week', type: 'categorical' },
];

export function RegressionAnalysis() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Model configuration
  const [target, setTarget] = useState<string>('Est. Profit');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Quantity',
    'Price Per Item',
    'Category',
    'OrderType',
  ]);
  const [trainRatio] = useState<number>(0.8);

  // Comparison & active inspection state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<RegressionComparisonResult | null>(null);
  const [inspectedModelName, setInspectedModelName] = useState<string | null>(null);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setMeta(getDatasetMeta(data));
        setIsLoadingData(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset for regression', err);
        setIsLoadingData(false);
      });
  }, []);

  // Leakage warning
  const leakage = useMemo(() => {
    return checkDataLeakage(target, selectedFeatures);
  }, [target, selectedFeatures]);

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length > 1) {
        setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
      }
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleRunAnalysis = () => {
    if (records.length === 0) return;
    setIsTraining(true);

    setTimeout(() => {
      try {
        const comp = runRegressionComparison(records, {
          target,
          features: selectedFeatures,
          trainSplitRatio: trainRatio,
        });
        setComparisonResult(comp);
        setInspectedModelName(comp.recommendedResult.modelName);
      } catch (err) {
        console.error('Regression comparison error', err);
      } finally {
        setIsTraining(false);
      }
    }, 120);
  };

  // Find currently inspected model result
  const activeModel: RegressionModelResult | null = useMemo(() => {
    if (!comparisonResult) return null;
    if (!inspectedModelName) return comparisonResult.recommendedResult;
    for (const key of Object.keys(comparisonResult.allModels)) {
      if (comparisonResult.allModels[key].modelName === inspectedModelName) {
        return comparisonResult.allModels[key];
      }
    }
    return comparisonResult.recommendedResult;
  }, [comparisonResult, inspectedModelName]);

  const pipelineStages = [
    'Feature Selection',
    'One-Hot Encoding',
    '80/20 Train-Test Split (Seed 42)',
    'Candidate Models Training',
    'Empirical Metrics Comparison',
    'Data-Driven Recommendation',
  ];

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header with Reproducibility Badge */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
            Regression Analysis & Automatic Model Comparison
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Train candidate regressors on identical test partitions and automatically determine the recommended model from empirical metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-3 py-1 rounded border border-neutral-200">
            Random State: 42
          </span>
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-200">
            Split: 80% Train / 20% Test
          </span>
        </div>
      </div>

      {/* 2. Dataset Information */}
      {meta && <DatasetInfo meta={meta} levelLabel="Transaction Line" />}

      {/* 3. Input -> Output & Selection Flow */}
      <InputOutputGuide
        input={selectedFeatures.join(', ') || 'Selected features'}
        target={target}
        modelsTested="Simple Linear, Multiple Linear (OLS), Random Forest Regressor"
        selectionCriteria="Highest Test R² with Lowest Test MAE & RMSE"
        output={`Continuous prediction of ${target}`}
      />

      {/* 4. Configuration & Execution Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                Regression Setup
              </h3>
              <span className="text-xs text-neutral-400">
                All candidates evaluated
              </span>
            </div>

            {/* Target Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Variable (Continuous Dependent y)
              </label>
              <select
                value={target}
                onChange={(e) => {
                  const newTarget = e.target.value;
                  setTarget(newTarget);
                  setSelectedFeatures((prev) => prev.filter((f) => f !== newTarget));
                }}
                className="w-full px-3 py-2 text-xs rounded-md border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:border-accent"
              >
                {VALID_TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Features Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Candidate Input Features (Independent X)
                </label>
                <span className="text-[11px] text-neutral-400">
                  {selectedFeatures.length} selected
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mb-2">
                Categorical variables are automatically one-hot encoded without manual dummy coding.
              </p>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {AVAILABLE_FEATURES.map((feat) => {
                  const isTarget = feat.value === target;
                  const isSelected = selectedFeatures.includes(feat.value);

                  return (
                    <label
                      key={feat.value}
                      className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer transition-colors ${
                        isTarget
                          ? 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
                          : isSelected
                          ? 'bg-accent/5 border-accent/40 text-neutral-800 font-medium'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={isTarget}
                          checked={isSelected && !isTarget}
                          onChange={() => toggleFeature(feat.value)}
                          className="rounded border-neutral-300 text-accent focus:ring-0"
                        />
                        <span>{feat.label}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                        {isTarget ? 'Target (Excluded)' : feat.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Leakage Warning */}
            {leakage.hasLeakage && (
              <LeakageWarning warning={leakage.warning || 'Potential target leakage detected.'} />
            )}

            {/* Execution Button */}
            <Button
              onClick={handleRunAnalysis}
              disabled={isTraining || isLoadingData || selectedFeatures.length === 0}
              className="w-full bg-accent hover:bg-accent/90 text-white font-medium text-xs py-2.5"
            >
              {isTraining ? 'Training & Evaluating Candidate Models...' : 'Run Analysis & Compare Models'}
            </Button>
          </Card>
        </div>

        {/* Right: Pipeline Stages Breadcrumb */}
        <div className="lg:col-span-7 space-y-4">
          <PipelineDiagram stages={pipelineStages} activeStage={comparisonResult ? 5 : 0} />

          <Card className="border border-neutral-100 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Methodology & Rigor
            </h4>
            <h3 className="text-sm font-semibold text-neutral-800 mb-2">
              Automated Comparative Evaluation
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-3">
              Rather than assuming an algorithm in advance, this engine partitions the transaction line-item dataset using a fixed pseudorandom seed (42) and fits multiple candidate architectures: <strong>Simple Linear Regression</strong>, <strong>Multiple Linear Regression (OLS Normal Equations with Ridge regularizer)</strong>, and a <strong>Random Forest Regressor (ensemble of variance-minimizing regression trees)</strong>.
            </p>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-[11px] text-neutral-600 space-y-1">
              <div><strong>Higher R²:</strong> Greater proportion of variance explained in unseen test data.</div>
              <div><strong>Lower MAE:</strong> Smaller average absolute deviation (£) from actual realized figures.</div>
              <div><strong>Lower RMSE:</strong> Penalizes large outlier forecast errors more heavily.</div>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Results & Comparative Analysis */}
      {comparisonResult && activeModel && (
        <div className="space-y-6 pt-4 border-t border-neutral-200">
          {/* A. Universal Best Method Card */}
          <BestMethodCard
            recommendation={comparisonResult.recommendation}
            moduleType="regression"
          />

          {/* B. Candidate Models Comparison Table */}
          <ModelComparisonTable
            title="Regression Candidate Models Comparison"
            subtitle="Identical held-out test partition (20% sample, 877 test records, seed 42)."
            rows={comparisonResult.comparisonTable}
            selectedModelName={activeModel.modelName}
            onSelectModel={(name) => setInspectedModelName(name)}
          />

          {/* Academic Transparency Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Academic Method Selection: </span>
            {comparisonResult.methodSelectionNotes}
          </div>

          {/* C. Active / Inspected Model Detailed Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-800">
                  Detailed Inspection: {activeModel.modelName}
                </h3>
                <p className="text-xs text-neutral-500">
                  {activeModel.isRecommended
                    ? 'Displaying empirical diagnostics for the recommended model.'
                    : 'Displaying diagnostics for the selected candidate model.'}
                </p>
              </div>
              {activeModel.isRecommended ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recommended Architecture
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setInspectedModelName(comparisonResult.recommendedResult.modelName)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Switch back to Recommended Model
                </button>
              )}
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Test R² Score
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {activeModel.metrics.r2.toFixed(3)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  {(Math.max(0, activeModel.metrics.r2) * 100).toFixed(1)}% variance explained
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Mean Absolute Error (MAE)
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  £{activeModel.metrics.mae.toFixed(2)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Average deviation on test set
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Root Mean Sq Error (RMSE)
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  £{activeModel.metrics.rmse.toFixed(2)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Outlier-penalized deviation
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Model Complexity
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {activeModel.intercept !== undefined
                    ? `£${activeModel.intercept.toFixed(2)}`
                    : '12 Trees'}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  {activeModel.intercept !== undefined ? 'Baseline Intercept (β₀)' : 'Ensemble estimators'}
                </span>
              </Card>
            </div>

            {/* Charts: Actual vs Predicted & Residual Plot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actual vs Predicted Scatter */}
              <Card className="border border-neutral-100 bg-white">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-100">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-800">
                      Actual vs. Predicted Values
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Points closer to the diagonal represent accurate test-set predictions.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    n = {activeModel.actualVsPredicted.length} test points
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={activeModel.actualVsPredicted}
                      margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="actual"
                        type="number"
                        name="Actual"
                        unit="£"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: `Actual ${target} (£)`,
                          position: 'insideBottom',
                          offset: -10,
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        dataKey="predicted"
                        type="number"
                        name="Predicted"
                        unit="£"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: `Predicted ${target} (£)`,
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-2.5 rounded shadow-lg border border-neutral-200 text-xs">
                                <div className="font-semibold text-neutral-800 mb-1">
                                  Test Sample #{d.id}
                                </div>
                                <div className="text-neutral-600">Actual: £{d.actual.toFixed(2)}</div>
                                <div className="text-neutral-600">Predicted: £{d.predicted.toFixed(2)}</div>
                                <div className="text-neutral-500 text-[11px] mt-1">
                                  Residual: £{d.residual.toFixed(2)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Predictions"
                        dataKey="predicted"
                        fill="#2563eb"
                        fillOpacity={0.6}
                      />
                      <Line
                        dataKey="actual"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Residual Plot */}
              <Card className="border border-neutral-100 bg-white">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-100">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-800">
                      Residual Error Plot (e = y - ŷ)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Even distribution around zero indicates well-calibrated residuals.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">Zero Error Line</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="predicted"
                        type="number"
                        name="Predicted"
                        unit="£"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: `Fitted / Predicted Value (£)`,
                          position: 'insideBottom',
                          offset: -10,
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        dataKey="residual"
                        type="number"
                        name="Residual"
                        unit="£"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: 'Residual Error (£)',
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 11,
                        }}
                      />
                      <ZAxis range={[30, 30]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-2.5 rounded shadow-lg border border-neutral-200 text-xs">
                                <div className="text-neutral-600">Predicted: £{d.predicted.toFixed(2)}</div>
                                <div className="font-semibold text-neutral-800">
                                  Residual Error: £{d.residual.toFixed(2)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        data={activeModel.actualVsPredicted}
                        fill="#059669"
                        fillOpacity={0.6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Model Parameters / Feature Importance Table */}
            {activeModel.coefficients && activeModel.coefficients.length > 0 ? (
              <Card className="border border-neutral-100 bg-white">
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-neutral-800">
                    Fitted Linear Coefficients (Weights)
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Directional weight assigned to each standardized or dummy-encoded regressor.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-100">
                      <tr>
                        <th className="px-4 py-2.5">Feature Name</th>
                        <th className="px-4 py-2.5 text-right">Coefficient (β)</th>
                        <th className="px-4 py-2.5">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {activeModel.coefficients.map((c) => (
                        <tr key={c.feature} className="hover:bg-neutral-50/50">
                          <td className="px-4 py-2.5 font-medium text-neutral-800">
                            {c.feature}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-neutral-800">
                            {c.coefficient > 0 ? `+${c.coefficient.toFixed(3)}` : c.coefficient.toFixed(3)}
                          </td>
                          <td className="px-4 py-2.5 text-neutral-600">
                            {c.interpretation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : activeModel.featureImportance && activeModel.featureImportance.length > 0 ? (
              <Card className="border border-neutral-100 bg-white">
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-neutral-800">
                    Tree-Based Feature Importance Ranking
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Relative variance reduction across all 12 regression trees in the ensemble.
                  </p>
                </div>

                <div className="space-y-2">
                  {activeModel.featureImportance.map((item) => (
                    <div key={item.feature} className="space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-700">
                        <span className="font-medium">{item.feature}</span>
                        <span className="font-mono text-neutral-500">{item.importance.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-accent h-full rounded-full"
                          style={{ width: `${Math.min(100, item.importance)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Preprocessing Summary */}
            <Card className="border border-neutral-100 bg-neutral-50/50">
              <h4 className="text-xs font-semibold text-neutral-800 mb-2">
                Preprocessing Ledger & Data Provenance
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 text-[11px]">Training Set</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    {comparisonResult.preprocessing.trainCount.toLocaleString('en-GB')} rows (80%)
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px]">Held-Out Test Set</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    {comparisonResult.preprocessing.testCount.toLocaleString('en-GB')} rows (20%)
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px]">Encoded Columns</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    {comparisonResult.preprocessing.categoricalFeaturesEncoded.length} one-hot features
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px]">Random State</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    Seed 42 (Reproducible)
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
