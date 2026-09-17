export interface DatasetMeta {
  filename: string;
  totalRows: number;
  totalColumns: number;
  dateRange: string;
  cancelledRows: number;
}

export interface PreprocessingSummary {
  rowsUsed: number;
  rowsRemoved: number;
  featuresSelected: string[];
  categoricalFeaturesEncoded: string[];
  scalingApplied: string;
  trainCount: number;
  testCount: number;
}

export interface TrainTestSplitResult<T = number[]> {
  XTrain: T[];
  yTrain: number[];
  XTest: T[];
  yTest: number[];
  featureNames: string[];
}

// ==========================================
// UNIVERSAL BEST METHOD & COMPARISON TYPES
// ==========================================

export interface BestMethodRecommendation {
  recommendedName: string;
  criterion: string;
  primaryMetricName: string;
  primaryMetricValue: string;
  whyReason: string;
  alternativeMethod: {
    name: string;
    description: string;
    comparisonNote: string;
  };
}

export interface ModelComparisonRow {
  modelName: string;
  isRecommended: boolean;
  metrics: Record<string, string | number>;
  badge?: string;
  notes?: string;
}

// ==========================================
// REGRESSION TYPES
// ==========================================

export type RegressionModelType = 'simple' | 'multiple' | 'randomForest' | 'decisionTree';

export interface RegressionConfig {
  target: string;
  features: string[];
  modelType?: RegressionModelType;
  trainSplitRatio: number;
}

export interface ActualVsPredictedPoint {
  id: number;
  actual: number;
  predicted: number;
  residual: number;
}

export interface FeatureCoefficient {
  feature: string;
  coefficient: number;
  interpretation: string;
}

export interface RegressionMetrics {
  r2: number;
  mae: number;
  rmse: number;
}

export interface RegressionModelResult {
  modelType: RegressionModelType;
  modelName: string;
  metrics: RegressionMetrics;
  intercept?: number;
  coefficients?: FeatureCoefficient[];
  actualVsPredicted: ActualVsPredictedPoint[];
  featureImportance?: { feature: string; importance: number }[];
  isRecommended: boolean;
}

export interface RegressionComparisonResult {
  target: string;
  features: string[];
  preprocessing: PreprocessingSummary;
  recommendation: BestMethodRecommendation;
  comparisonTable: ModelComparisonRow[];
  recommendedResult: RegressionModelResult;
  allModels: Record<string, RegressionModelResult>;
  methodSelectionNotes: string;
}

// Legacy single-result interface for backwards compatibility if needed
export interface RegressionResult {
  modelType: RegressionModelType;
  target: string;
  features: string[];
  metrics: RegressionMetrics;
  intercept: number;
  coefficients: FeatureCoefficient[];
  actualVsPredicted: ActualVsPredictedPoint[];
  preprocessing: PreprocessingSummary;
  explanation: string;
}

// ==========================================
// CLASSIFICATION TYPES
// ==========================================

export type ClassificationModelType = 'logistic' | 'decisionTree' | 'randomForest';

export interface ClassificationConfig {
  target: string;
  features: string[];
  modelType?: ClassificationModelType;
  trainSplitRatio: number;
}

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
}

export interface ConfusionMatrixData {
  classes: string[];
  matrix: number[][]; // [actualIndex][predictedIndex]
  totalSamples: number;
}

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  balancedAccuracy: number;
  rocAuc?: number;
  classBreakdown?: {
    className: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }[];
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ClassificationModelResult {
  modelType: ClassificationModelType;
  modelName: string;
  metrics: ClassificationMetrics;
  confusionMatrix: ConfusionMatrixData;
  featureImportance: FeatureImportanceItem[];
  samplePredictions: {
    id: number;
    actual: string;
    predicted: string;
    correct: boolean;
  }[];
  isRecommended: boolean;
}

export interface ClassificationComparisonResult {
  target: string;
  features: string[];
  classes: string[];
  classDistribution: ClassDistribution[];
  isImbalanced: boolean;
  preprocessing: PreprocessingSummary;
  recommendation: BestMethodRecommendation;
  comparisonTable: ModelComparisonRow[];
  recommendedResult: ClassificationModelResult;
  allModels: Record<string, ClassificationModelResult>;
  methodSelectionNotes: string;
}

export interface ClassificationResult {
  modelType: ClassificationModelType;
  target: string;
  features: string[];
  classes: string[];
  classDistribution: ClassDistribution[];
  isImbalanced: boolean;
  metrics: ClassificationMetrics;
  confusionMatrix: ConfusionMatrixData;
  featureImportance: FeatureImportanceItem[];
  preprocessing: PreprocessingSummary;
  samplePredictions: {
    id: number;
    actual: string;
    predicted: string;
    correct: boolean;
  }[];
  explanation: string;
}

// ==========================================
// CLUSTERING TYPES
// ==========================================

export interface OrderAggregatedRecord {
  orderId: string;
  totalQuantity: number;
  totalGrossSales: number;
  totalEstCost: number;
  totalEstProfit: number;
  avgPricePerItem: number;
  lineItemCount: number;
  orderType: string;
  payment: string;
  dayOfWeek: string;
  cancelled: boolean;
}

export interface ClusteringConfig {
  k?: number;
  selectedFeatures: (keyof OrderAggregatedRecord)[];
  maxIterations?: number;
}

export interface ClusterProfile {
  clusterId: number;
  name: string;
  orderCount: number;
  percentage: number;
  avgQuantity: number;
  avgRevenue: number;
  avgProfit: number;
  avgItemsPerOrder: number;
  avgPricePerItem: number;
  avgLineItems: number;
}

export interface ClusterScatterPoint {
  orderId: string;
  clusterId: number;
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  tooltipInfo: {
    revenue: number;
    quantity: number;
    items: number;
  };
}

export interface KComparisonRow {
  k: number;
  clusters: number;
  silhouetteScore: number;
  inertia: number;
  isRecommended: boolean;
  interpretation: string;
}

export interface ClusteringResult {
  k: number;
  totalOrders: number;
  selectedFeatures: string[];
  scalingApplied: boolean;
  clusters: ClusterProfile[];
  scatterPoints: ClusterScatterPoint[];
  featureNames: string[];
  explanation: string[];
}

export interface ClusteringComparisonResult {
  selectedFeatures: string[];
  totalOrders: number;
  scalingApplied: boolean;
  kEvaluations: KComparisonRow[];
  recommendation: BestMethodRecommendation;
  recommendedK: number;
  activeResult: ClusteringResult;
  allResults: Record<number, ClusteringResult>;
  methodSelectionNotes: string;
}
