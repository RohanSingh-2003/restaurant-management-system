import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, Button } from '../../../components/ui';
import { DatasetInfo } from '../../../components/mining/DatasetInfo';
import { InputOutputGuide } from '../../../components/mining/InputOutputGuide';
import { PipelineDiagram } from '../../../components/mining/PipelineDiagram';
import { ConfusionMatrixView } from '../../../components/mining/ConfusionMatrixView';
import { LeakageWarning } from '../../../components/mining/LeakageWarning';
import { BestMethodCard } from '../../../components/mining/BestMethodCard';
import { ModelComparisonTable } from '../../../components/mining/ModelComparisonTable';
import { loadDataset } from '../../../services/tarriDataService';
import { getDatasetMeta } from '../../../services/mining/dataAggregation';
import { checkDataLeakage } from '../../../services/mining/preprocessing';
import { runClassificationComparison } from '../../../services/mining/classification';
import type { TarriRecord } from '../../../types/dataset';
import type {
  ClassificationComparisonResult,
  ClassificationModelResult,
  DatasetMeta,
} from '../../../types/mining';

const VALID_TARGETS = [
  { value: 'Cancelled', label: 'Cancelled (Yes / No)' },
  { value: 'OrderType', label: 'Order Type (Delivery / Collection)' },
  { value: 'Category', label: 'Category (Menu Group)' },
];

const AVAILABLE_FEATURES = [
  { value: 'Quantity', label: 'Quantity', type: 'numerical' },
  { value: 'Price Per Item', label: 'Price Per Item', type: 'numerical' },
  { value: 'Gross Sales', label: 'Gross Sales', type: 'numerical' },
  { value: 'Est. Cost', label: 'Est. Cost', type: 'numerical' },
  { value: 'Est. Profit', label: 'Est. Profit', type: 'numerical' },
  { value: 'Category', label: 'Category', type: 'categorical' },
  { value: 'OrderType', label: 'Order Type', type: 'categorical' },
  { value: 'DayOfWeek', label: 'Day of Week', type: 'categorical' },
  { value: 'Time', label: 'Time (Hour of Day)', type: 'numerical' },
];

export function ClassificationAnalysis() {
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Model configuration
  const [target, setTarget] = useState<string>('Cancelled');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Quantity',
    'Price Per Item',
    'Gross Sales',
    'OrderType',
    'DayOfWeek',
  ]);
  const [trainRatio] = useState<number>(0.8);

  // Execution state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ClassificationComparisonResult | null>(null);
  const [inspectedModelName, setInspectedModelName] = useState<string | null>(null);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setMeta(getDatasetMeta(data));
        setIsLoadingData(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset for classification', err);
        setIsLoadingData(false);
      });
  }, []);

  // Class distribution preview
  const classDistributionPreview = useMemo(() => {
    if (records.length === 0) return [];
    const countMap = new Map<string, number>();

    for (const r of records) {
      let val = '';
      if (target === 'Cancelled') val = r.cancelled ? 'Yes' : 'No';
      else if (target === 'OrderType') val = r.orderType || 'Delivery';
      else if (target === 'Category') val = r.category || 'Other';
      countMap.set(val, (countMap.get(val) || 0) + 1);
    }

    const total = records.length;
    return Array.from(countMap.entries()).map(([cls, count]) => ({
      className: cls,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
  }, [records, target]);

  const isImbalanced = useMemo(() => {
    return classDistributionPreview.some((c) => c.percentage < 10 || c.percentage > 85);
  }, [classDistributionPreview]);

  // Leakage check
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
        const comp = runClassificationComparison(records, {
          target,
          features: selectedFeatures,
          trainSplitRatio: trainRatio,
        });
        setComparisonResult(comp);
        setInspectedModelName(comp.recommendedResult.modelName);
      } catch (err) {
        console.error('Classification comparison error', err);
      } finally {
        setIsTraining(false);
      }
    }, 150);
  };

  const activeModel: ClassificationModelResult | null = useMemo(() => {
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
    'Target Distribution & Imbalance Audit',
    'Stratified 80/20 Split (Seed 42)',
    'Candidate Classifiers Training',
    'Class-Aware Metrics Evaluation',
    'Data-Driven Recommendation',
  ];

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header with Reproducibility Badge */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
            Classification Analysis & Automatic Model Comparison
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Train and evaluate candidate classifiers on identical stratified test partitions, prioritizing class-aware metrics on imbalanced targets.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-3 py-1 rounded border border-neutral-200">
            Random State: 42
          </span>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-200">
            Stratified 80/20 Split
          </span>
        </div>
      </div>

      {/* 2. Dataset Information */}
      {meta && <DatasetInfo meta={meta} levelLabel="Transaction Line" />}

      {/* 3. Input -> Output & Model Selection Guide */}
      <InputOutputGuide
        input={selectedFeatures.join(', ') || 'Selected features'}
        target={target}
        modelsTested="Logistic Regression (L2), Decision Tree (Gini), Random Forest (15 Trees)"
        selectionCriteria={
          isImbalanced
            ? 'Macro F1 Score & Balanced Accuracy (Class-Imbalance Aware)'
            : 'Macro F1 Score & Test Accuracy'
        }
        output={`Discrete classification of ${target}`}
      />

      {/* 4. Configuration & Setup Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                Classification Setup
              </h3>
              <span className="text-xs text-neutral-400">
                All candidates evaluated
              </span>
            </div>

            {/* Target Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Variable (Categorical Dependent y)
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

            {/* Class Distribution Preview */}
            <div className="p-3 rounded-lg bg-neutral-50/80 border border-neutral-100 text-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-neutral-700">Target Distribution:</span>
                {isImbalanced ? (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Class Imbalance Detected
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Balanced Target
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {classDistributionPreview.map((c) => (
                  <div key={c.className} className="flex justify-between text-neutral-600 text-[11px]">
                    <span className="font-mono">{c.className}:</span>
                    <span>
                      {c.count.toLocaleString('en-GB')} rows ({c.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>

              {isImbalanced && (
                <p className="mt-2 text-[11px] text-amber-800 border-t border-amber-100 pt-1.5 leading-normal">
                  Notice: In an imbalanced setup, predicting the majority class yields high raw accuracy without learning the minority signal. The system automatically prioritizes <strong>Macro F1</strong> and <strong>Balanced Accuracy</strong>.
                </p>
              )}
            </div>

            {/* Input Features Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Input Features (Independent X)
                </label>
                <span className="text-[11px] text-neutral-400">
                  {selectedFeatures.length} selected
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
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

            {/* Run Button */}
            <Button
              onClick={handleRunAnalysis}
              disabled={isTraining || isLoadingData || selectedFeatures.length === 0}
              className="w-full bg-accent hover:bg-accent/90 text-white font-medium text-xs py-2.5"
            >
              {isTraining ? 'Evaluating Candidate Classifiers...' : 'Run Analysis & Compare Classifiers'}
            </Button>
          </Card>
        </div>

        {/* Right: Pipeline Stages & Methodology */}
        <div className="lg:col-span-7 space-y-4">
          <PipelineDiagram stages={pipelineStages} activeStage={comparisonResult ? 4 : 0} />

          <Card className="border border-neutral-100 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Methodology & Rigor
            </h4>
            <h3 className="text-sm font-semibold text-neutral-800 mb-2">
              Class-Aware Empirical Classifier Selection
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-3">
              Supervised classifiers partition observations into discrete target classes. To avoid subjective preference or the accuracy paradox on imbalanced targets, three candidate models are trained on an identical stratified split (80/20, seed 42): <strong>Logistic Regression (L2 regularized)</strong>, <strong>Decision Tree (recursive Gini splits)</strong>, and <strong>Random Forest (15 bagged trees with feature subspace sampling)</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <div><strong>Balanced Accuracy:</strong> Unweighted average recall across all distinct classes.</div>
              <div><strong>Macro F1:</strong> Harmonic mean of precision & recall, penalizing minority neglect.</div>
              <div><strong>ROC-AUC:</strong> Probability ranking concordance across decision thresholds.</div>
              <div><strong>Confusion Matrix:</strong> Exact tally of correct vs. misclassified test points.</div>
            </div>
          </Card>
        </div>
      </div>

      {/* 5. Results & Comparative Ledger */}
      {comparisonResult && activeModel && (
        <div className="space-y-6 pt-4 border-t border-neutral-200">
          {/* A. Universal Best Method Card */}
          <BestMethodCard
            recommendation={comparisonResult.recommendation}
            moduleType="classification"
          />

          {/* B. Candidate Models Comparison Table */}
          <ModelComparisonTable
            title="Classification Candidate Models Comparison"
            subtitle="Identical stratified test partition (877 records, random_state = 42)."
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
                  Detailed Diagnostics: {activeModel.modelName}
                </h3>
                <p className="text-xs text-neutral-500">
                  {activeModel.isRecommended
                    ? 'Displaying empirical test-set confusion matrix and feature rankings for the recommended classifier.'
                    : 'Displaying test-set diagnostics for the selected candidate classifier.'}
                </p>
              </div>
              {activeModel.isRecommended ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Recommended Classifier
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

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Test Accuracy
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {(activeModel.metrics.accuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Overall correct test classifications
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Macro F1 Score
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {activeModel.metrics.f1.toFixed(3)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Harmonic precision-recall mean
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Balanced Accuracy
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {(activeModel.metrics.balancedAccuracy * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  Class-normalized average recall
                </span>
              </Card>

              <Card className="border border-neutral-100 bg-white p-4">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {activeModel.metrics.rocAuc !== undefined ? 'ROC-AUC' : 'Macro Precision'}
                </span>
                <div className="text-2xl font-bold text-neutral-800 mt-1 font-mono">
                  {activeModel.metrics.rocAuc !== undefined
                    ? activeModel.metrics.rocAuc.toFixed(3)
                    : activeModel.metrics.precision.toFixed(3)}
                </div>
                <span className="text-[11px] text-neutral-400 mt-0.5 block">
                  {activeModel.metrics.rocAuc !== undefined
                    ? 'Area under ROC curve'
                    : 'Average class precision'}
                </span>
              </Card>
            </div>

            {/* Confusion Matrix */}
            <ConfusionMatrixView
              data={activeModel.confusionMatrix}
              classBreakdown={activeModel.metrics.classBreakdown}
            />

            {/* Feature Importance */}
            {activeModel.featureImportance.length > 0 && (
              <Card className="border border-neutral-100 bg-white">
                <div className="mb-4 pb-2 border-b border-neutral-100">
                  <h4 className="text-xs font-semibold text-neutral-800">
                    Model Feature Importance (Normalized Gain / Weight)
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Empirical metric contribution of each feature to the classifier decision boundaries (non-causal association).
                  </p>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeModel.featureImportance.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        unit="%"
                        domain={[0, 'auto']}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Importance']}
                      />
                      <Bar
                        dataKey="importance"
                        fill="#2563eb"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Sample Test Predictions */}
            <Card className="border border-neutral-100 bg-white">
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-neutral-800">
                  Held-Out Test Sample Predictions
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Inspection of initial test records comparing ground-truth targets against model inference.
                </p>
              </div>

              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider border-b border-neutral-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Test Sample</th>
                      <th className="px-4 py-2">Actual Value</th>
                      <th className="px-4 py-2">Predicted Value</th>
                      <th className="px-4 py-2 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {activeModel.samplePredictions.slice(0, 15).map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-2 font-mono text-neutral-500">#{s.id}</td>
                        <td className="px-4 py-2 font-medium text-neutral-800">{s.actual}</td>
                        <td className="px-4 py-2 text-neutral-600">{s.predicted}</td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.correct
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {s.correct ? 'Correct' : 'Misclassified'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

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
                  <span className="text-neutral-400 text-[11px]">Encoded Categoricals</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    {comparisonResult.preprocessing.categoricalFeaturesEncoded.length} dummy features
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px]">Sampling Strategy</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    Stratified (Preserving Class Ratios)
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
