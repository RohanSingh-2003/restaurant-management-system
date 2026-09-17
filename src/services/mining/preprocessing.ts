import type { TarriRecord } from '../../types/dataset';
import type { PreprocessingSummary, TrainTestSplitResult } from '../../types/mining';

/**
 * Seeded pseudorandom number generator (Mulberry32) for reproducible splits.
 */
export function createRNG(seed = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Detects potential data leakage where an input feature is mathematically or directly derived from the target.
 */
export function checkDataLeakage(target: string, features: string[]): { hasLeakage: boolean; warning?: string } {
  const normTarget = target.toLowerCase();
  const normFeatures = features.map((f) => f.toLowerCase());

  // Profit derived from sales and cost
  if (normTarget.includes('profit')) {
    if (normFeatures.some((f) => f.includes('gross') || f.includes('sales')) && normFeatures.some((f) => f.includes('cost'))) {
      return {
        hasLeakage: true,
        warning: 'Selecting both Gross Sales and Est. Cost when predicting Est. Profit creates a direct mathematical dependency (Profit = Sales - Cost) resulting in artificially high model accuracy.',
      };
    }
  }

  // Gross sales derived from quantity and price
  if (normTarget.includes('gross') || normTarget.includes('sales')) {
    if (normFeatures.some((f) => f.includes('quantity')) && normFeatures.some((f) => f.includes('price'))) {
      return {
        hasLeakage: true,
        warning: 'Selecting both Quantity and Price Per Item when predicting Gross Sales directly reconstructs the target formula (Sales = Quantity × Price).',
      };
    }
  }

  return { hasLeakage: false };
}

/**
 * Extracts numerical and one-hot encoded categorical features for regression.
 */
export function prepareRegressionDataset(
  records: TarriRecord[],
  targetCol: string,
  featureCols: string[],
  splitRatio = 0.8,
  seed = 42
): {
  split: TrainTestSplitResult;
  preprocessing: PreprocessingSummary;
} {
  const rng = createRNG(seed);

  // Validate records
  const validRecords = records.filter((r) => !r.cancelled);

  // Identify categorical vs numerical features
  const categoricalCols = featureCols.filter((f) =>
    ['Category', 'OrderType', 'DayOfWeek'].includes(f)
  );
  const numericalCols = featureCols.filter((f) => !categoricalCols.includes(f));

  // Determine unique categories for one-hot encoding
  const categoryVocabs = new Map<string, string[]>();
  for (const col of categoricalCols) {
    const vals = new Set<string>();
    for (const r of validRecords) {
      const v = String((r as any)[col] || '');
      if (v) vals.add(v);
    }
    categoryVocabs.set(col, Array.from(vals).sort());
  }

  // Build feature names
  const featureNames: string[] = [...numericalCols];
  for (const [col, vals] of categoryVocabs.entries()) {
    for (const v of vals) {
      featureNames.push(`${col}_${v}`);
    }
  }

  const X: number[][] = [];
  const y: number[] = [];

  for (const r of validRecords) {
    const targetVal = getRecordValue(r, targetCol);
    if (isNaN(targetVal)) continue;

    const rowFeatures: number[] = [];

    // Numerical values
    for (const col of numericalCols) {
      rowFeatures.push(getRecordValue(r, col));
    }

    // Categorical one-hot encoding
    for (const [col, vals] of categoryVocabs.entries()) {
      const actualVal = String((r as any)[col] || '');
      for (const v of vals) {
        rowFeatures.push(actualVal === v ? 1 : 0);
      }
    }

    X.push(rowFeatures);
    y.push(targetVal);
  }

  // Train / Test split with shuffle
  const indices = Array.from({ length: X.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const trainCount = Math.floor(X.length * splitRatio);
  const trainIndices = indices.slice(0, trainCount);
  const testIndices = indices.slice(trainCount);

  const XTrain = trainIndices.map((i) => X[i]);
  const yTrain = trainIndices.map((i) => y[i]);
  const XTest = testIndices.map((i) => X[i]);
  const yTest = testIndices.map((i) => y[i]);

  return {
    split: {
      XTrain,
      yTrain,
      XTest,
      yTest,
      featureNames,
    },
    preprocessing: {
      rowsUsed: X.length,
      rowsRemoved: records.length - X.length,
      featuresSelected: featureCols,
      categoricalFeaturesEncoded: categoricalCols,
      scalingApplied: 'None (OLS Ordinary Least Squares closed-form)',
      trainCount: XTrain.length,
      testCount: XTest.length,
    },
  };
}

/**
 * Extracts features and integer labels for classification with stratification.
 */
export function prepareClassificationDataset(
  records: TarriRecord[],
  targetCol: string,
  featureCols: string[],
  splitRatio = 0.8,
  seed = 42
): {
  split: TrainTestSplitResult;
  classes: string[];
  classDistribution: { className: string; count: number; percentage: number }[];
  isImbalanced: boolean;
  preprocessing: PreprocessingSummary;
} {
  const rng = createRNG(seed);

  // Target class labels
  const classSet = new Set<string>();
  for (const r of records) {
    const c = getClassificationTargetValue(r, targetCol);
    if (c !== undefined && c !== '') classSet.add(c);
  }

  const classes = Array.from(classSet).sort();

  // Class distribution
  const classCountMap = new Map<string, number>();
  for (const c of classes) classCountMap.set(c, 0);

  for (const r of records) {
    const c = getClassificationTargetValue(r, targetCol);
    if (classCountMap.has(c)) {
      classCountMap.set(c, (classCountMap.get(c) || 0) + 1);
    }
  }

  const total = records.length;
  const classDistribution = classes.map((c) => {
    const count = classCountMap.get(c) || 0;
    return {
      className: c,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });

  // Imbalance threshold: if smallest class < 10% or largest > 85%
  const isImbalanced = classDistribution.some((cd) => cd.percentage < 10 || cd.percentage > 85);

  // Features
  const categoricalCols = featureCols.filter((f) =>
    ['Category', 'OrderType', 'DayOfWeek', 'Payment'].includes(f)
  );
  const numericalCols = featureCols.filter((f) => !categoricalCols.includes(f));

  // Determine vocabularies
  const categoryVocabs = new Map<string, string[]>();
  for (const col of categoricalCols) {
    const vals = new Set<string>();
    for (const r of records) {
      const v = String((r as any)[col] || '');
      if (v) vals.add(v);
    }
    categoryVocabs.set(col, Array.from(vals).sort());
  }

  const featureNames: string[] = [...numericalCols];
  for (const [col, vals] of categoryVocabs.entries()) {
    for (const v of vals) {
      featureNames.push(`${col}_${v}`);
    }
  }

  const X: number[][] = [];
  const y: number[] = [];

  for (const r of records) {
    const targetLabel = getClassificationTargetValue(r, targetCol);
    const labelIdx = classes.indexOf(targetLabel);
    if (labelIdx === -1) continue;

    const rowFeatures: number[] = [];
    for (const col of numericalCols) {
      rowFeatures.push(getRecordValue(r, col));
    }
    for (const [col, vals] of categoryVocabs.entries()) {
      const actualVal = String((r as any)[col] || '');
      for (const v of vals) {
        rowFeatures.push(actualVal === v ? 1 : 0);
      }
    }

    X.push(rowFeatures);
    y.push(labelIdx);
  }

  // Stratified split by class
  const classIndicesMap = new Map<number, number[]>();
  for (let i = 0; i < classes.length; i++) classIndicesMap.set(i, []);

  for (let i = 0; i < y.length; i++) {
    classIndicesMap.get(y[i])?.push(i);
  }

  const trainIndices: number[] = [];
  const testIndices: number[] = [];

  for (const indices of classIndicesMap.values()) {
    // Shuffle indices for this class
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const classTrainCount = Math.max(1, Math.floor(indices.length * splitRatio));
    trainIndices.push(...indices.slice(0, classTrainCount));
    testIndices.push(...indices.slice(classTrainCount));
  }

  // Final shuffle of combined train & test sets
  for (let i = trainIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [trainIndices[i], trainIndices[j]] = [trainIndices[j], trainIndices[i]];
  }
  for (let i = testIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [testIndices[i], testIndices[j]] = [testIndices[j], testIndices[i]];
  }

  const XTrain = trainIndices.map((i) => X[i]);
  const yTrain = trainIndices.map((i) => y[i]);
  const XTest = testIndices.map((i) => X[i]);
  const yTest = testIndices.map((i) => y[i]);

  return {
    split: {
      XTrain,
      yTrain,
      XTest,
      yTest,
      featureNames,
    },
    classes,
    classDistribution,
    isImbalanced,
    preprocessing: {
      rowsUsed: X.length,
      rowsRemoved: records.length - X.length,
      featuresSelected: featureCols,
      categoricalFeaturesEncoded: categoricalCols,
      scalingApplied: 'Standardized inputs for Logistic Regression / Native scaling for Trees',
      trainCount: XTrain.length,
      testCount: XTest.length,
    },
  };
}

/**
 * Normalizes numerical column names to TarriRecord fields.
 */
function getRecordValue(record: TarriRecord, colName: string): number {
  switch (colName) {
    case 'Quantity':
      return record.quantity;
    case 'Price Per Item':
      return record.pricePerItem;
    case 'Gross Sales':
      return record.grossSales;
    case 'Est. Cost':
      return record.estCost;
    case 'Est. Profit':
      return record.estProfit;
    case 'Time':
      return parseInt(record.time.split(':')[0], 10) || 0;
    default:
      return 0;
  }
}

/**
 * Returns string label for classification targets.
 */
function getClassificationTargetValue(record: TarriRecord, colName: string): string {
  switch (colName) {
    case 'Cancelled':
      return record.cancelled ? 'Yes' : 'No';
    case 'OrderType':
      return record.orderType || 'Unknown';
    case 'Category':
      return record.category || 'Other';
    case 'Payment':
      return record.payment || 'Card';
    default:
      return String((record as any)[colName] || 'Unknown');
  }
}

/**
 * Z-score standardization: (x - mean) / stdDev.
 */
export function standardizeMatrix(matrix: number[][]): {
  scaledMatrix: number[][];
  means: number[];
  stdDevs: number[];
} {
  if (matrix.length === 0) return { scaledMatrix: [], means: [], stdDevs: [] };
  const cols = matrix[0].length;
  const rows = matrix.length;

  const means: number[] = new Array(cols).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      means[c] += matrix[r][c];
    }
  }
  for (let c = 0; c < cols; c++) {
    means[c] /= rows;
  }

  const stdDevs: number[] = new Array(cols).fill(0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const diff = matrix[r][c] - means[c];
      stdDevs[c] += diff * diff;
    }
  }
  for (let c = 0; c < cols; c++) {
    stdDevs[c] = Math.sqrt(stdDevs[c] / rows) || 1;
  }

  const scaledMatrix: number[][] = matrix.map((row) =>
    row.map((val, c) => (val - means[c]) / stdDevs[c])
  );

  return { scaledMatrix, means, stdDevs };
}
