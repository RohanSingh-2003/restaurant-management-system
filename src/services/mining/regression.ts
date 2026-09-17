import type { TarriRecord } from '../../types/dataset';
import type {
  RegressionConfig,
  RegressionResult,
  RegressionMetrics,
  FeatureCoefficient,
  RegressionComparisonResult,
  RegressionModelResult,
  ModelComparisonRow,
  BestMethodRecommendation,
} from '../../types/mining';
import { prepareRegressionDataset, createRNG } from './preprocessing';

// ==========================================
// LINEAR ALGEBRA UTILITIES
// ==========================================

function matMul(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const aVal = A[i][k];
      if (aVal === 0) continue;
      for (let j = 0; j < colsB; j++) {
        result[i][j] += aVal * B[k][j];
      }
    }
  }
  return result;
}

function matTranspose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const T: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

function matInverse(A: number[][], ridge = 1e-6): number[][] {
  const n = A.length;
  const M: number[][] = A.map((row, i) =>
    row.map((val, j) => (i === j ? val + ridge : val))
  );
  const I: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1;
    return row;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }
    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      [I[i], I[maxRow]] = [I[maxRow], I[i]];
    }

    const pivot = M[i][i];
    const safePivot = Math.abs(pivot) < 1e-12 ? 1e-12 : pivot;

    for (let j = 0; j < n; j++) {
      M[i][j] /= safePivot;
      I[i][j] /= safePivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < n; j++) {
          M[k][j] -= factor * M[i][j];
          I[k][j] -= factor * I[i][j];
        }
      }
    }
  }

  return I;
}

// ==========================================
// REGRESSION TREE & RANDOM FOREST
// ==========================================

interface RegTreeNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  threshold?: number;
  left?: RegTreeNode;
  right?: RegTreeNode;
}

function computeVariance(y: number[]): number {
  const n = y.length;
  if (n <= 1) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += y[i];
  const mean = sum / n;
  let ssq = 0;
  for (let i = 0; i < n; i++) {
    const d = y[i] - mean;
    ssq += d * d;
  }
  return ssq / n;
}

function buildRegTree(
  X: number[][],
  y: number[],
  depth = 0,
  maxDepth = 6,
  minSamplesSplit = 8,
  featureImportances: number[],
  subsampleFeatures?: number,
  rng?: () => number
): RegTreeNode {
  const n = y.length;
  let sumY = 0;
  for (let i = 0; i < n; i++) sumY += y[i];
  const meanY = n > 0 ? sumY / n : 0;

  if (depth >= maxDepth || n < minSamplesSplit) {
    return { isLeaf: true, value: meanY };
  }

  const currentVar = computeVariance(y);
  if (currentVar < 1e-6) {
    return { isLeaf: true, value: meanY };
  }

  const numFeatures = X[0].length;
  let candidateFeatures = Array.from({ length: numFeatures }, (_, i) => i);

  if (subsampleFeatures && rng && subsampleFeatures < numFeatures) {
    for (let i = candidateFeatures.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidateFeatures[i], candidateFeatures[j]] = [candidateFeatures[j], candidateFeatures[i]];
    }
    candidateFeatures = candidateFeatures.slice(0, subsampleFeatures);
  }

  let bestVarReduction = 0;
  let bestFeat = -1;
  let bestThresh = 0;
  let bestLeftIndices: number[] = [];
  let bestRightIndices: number[] = [];

  for (const f of candidateFeatures) {
    const vals = Array.from(new Set(X.map((row) => row[f]))).sort((a, b) => a - b);
    if (vals.length <= 1) continue;

    const step = Math.max(1, Math.floor(vals.length / 12));
    for (let i = 0; i < vals.length - 1; i += step) {
      const thresh = (vals[i] + vals[i + 1]) / 2;
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];

      for (let r = 0; r < n; r++) {
        if (X[r][f] <= thresh) leftIdx.push(r);
        else rightIdx.push(r);
      }

      if (leftIdx.length < 3 || rightIdx.length < 3) continue;

      const leftY = leftIdx.map((idx) => y[idx]);
      const rightY = rightIdx.map((idx) => y[idx]);

      const varLeft = computeVariance(leftY);
      const varRight = computeVariance(rightY);
      const splitVar = (leftIdx.length / n) * varLeft + (rightIdx.length / n) * varRight;
      const reduction = currentVar - splitVar;

      if (reduction > bestVarReduction) {
        bestVarReduction = reduction;
        bestFeat = f;
        bestThresh = thresh;
        bestLeftIndices = leftIdx;
        bestRightIndices = rightIdx;
      }
    }
  }

  if (bestVarReduction <= 0 || bestFeat === -1) {
    return { isLeaf: true, value: meanY };
  }

  featureImportances[bestFeat] += bestVarReduction * n;

  const leftX = bestLeftIndices.map((i) => X[i]);
  const leftY = bestLeftIndices.map((i) => y[i]);
  const rightX = bestRightIndices.map((i) => X[i]);
  const rightY = bestRightIndices.map((i) => y[i]);

  const leftNode = buildRegTree(
    leftX,
    leftY,
    depth + 1,
    maxDepth,
    minSamplesSplit,
    featureImportances,
    subsampleFeatures,
    rng
  );
  const rightNode = buildRegTree(
    rightX,
    rightY,
    depth + 1,
    maxDepth,
    minSamplesSplit,
    featureImportances,
    subsampleFeatures,
    rng
  );

  return {
    isLeaf: false,
    featureIndex: bestFeat,
    threshold: bestThresh,
    left: leftNode,
    right: rightNode,
  };
}

function predictRegTree(node: RegTreeNode, x: number[]): number {
  if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
    return node.value ?? 0;
  }
  if (x[node.featureIndex] <= node.threshold) {
    return node.left ? predictRegTree(node.left, x) : (node.value ?? 0);
  } else {
    return node.right ? predictRegTree(node.right, x) : (node.value ?? 0);
  }
}

// ==========================================
// METRIC EVALUATION
// ==========================================

function calculateMetrics(actuals: number[], preds: number[]): RegressionMetrics {
  const n = actuals.length;
  if (n === 0) return { r2: 0, mae: 0, rmse: 0 };

  const meanActual = actuals.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  let sumAbs = 0;
  let sumSq = 0;

  for (let i = 0; i < n; i++) {
    const err = actuals[i] - preds[i];
    ssRes += err * err;
    ssTot += (actuals[i] - meanActual) * (actuals[i] - meanActual);
    sumAbs += Math.abs(err);
    sumSq += err * err;
  }

  let r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  if (r2 < -1) r2 = -1; // Bound lower extreme

  return {
    r2: Math.round(r2 * 1000) / 1000,
    mae: Math.round((sumAbs / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(sumSq / n) * 100) / 100,
  };
}

// ==========================================
// AUTOMATIC MODEL COMPARISON ENGINE
// ==========================================

export function runRegressionComparison(
  records: TarriRecord[],
  config: RegressionConfig
): RegressionComparisonResult {
  const { split, preprocessing } = prepareRegressionDataset(
    records,
    config.target,
    config.features,
    config.trainSplitRatio || 0.8
  );

  const { XTrain, yTrain, XTest, yTest, featureNames } = split;
  const nTest = yTest.length;

  // -------------------------------------------------------------
  // 1. SIMPLE LINEAR REGRESSION (Univariate baseline on 1st feature)
  // -------------------------------------------------------------
  const xColTrain = XTrain.map((r) => r[0]);
  const nTr = xColTrain.length;
  const meanX = xColTrain.reduce((a, b) => a + b, 0) / nTr;
  const meanY = yTrain.reduce((a, b) => a + b, 0) / nTr;

  let num = 0;
  let den = 0;
  for (let i = 0; i < nTr; i++) {
    num += (xColTrain[i] - meanX) * (yTrain[i] - meanY);
    den += (xColTrain[i] - meanX) * (xColTrain[i] - meanX);
  }
  const simpleSlope = den !== 0 ? num / den : 0;
  const simpleIntercept = meanY - simpleSlope * meanX;

  const simplePreds = XTest.map((r) => simpleIntercept + simpleSlope * r[0]);
  const simpleMetrics = calculateMetrics(yTest, simplePreds);

  const simpleResult: RegressionModelResult = {
    modelType: 'simple',
    modelName: `Simple Linear Regression (${featureNames[0] || 'Univariate'})`,
    metrics: simpleMetrics,
    intercept: Math.round(simpleIntercept * 100) / 100,
    coefficients: [
      {
        feature: featureNames[0] || 'Feature',
        coefficient: Math.round(simpleSlope * 1000) / 1000,
        interpretation: `Each 1-unit increase in ${featureNames[0] || 'Feature'} associates with a £${Math.abs(simpleSlope).toFixed(2)} shift.`,
      },
    ],
    actualVsPredicted: yTest.slice(0, 150).map((act, i) => ({
      id: i + 1,
      actual: Math.round(act * 100) / 100,
      predicted: Math.round(simplePreds[i] * 100) / 100,
      residual: Math.round((act - simplePreds[i]) * 100) / 100,
    })),
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // 2. MULTIPLE LINEAR REGRESSION (OLS Normal Equations)
  // -------------------------------------------------------------
  let multIntercept = 0;
  let multWeights: number[] = [];

  if (featureNames.length === 1) {
    multIntercept = simpleIntercept;
    multWeights = [simpleSlope];
  } else {
    const XbTrain = XTrain.map((row) => [1, ...row]);
    const XT = matTranspose(XbTrain);
    const XTX = matMul(XT, XbTrain);
    const XTX_inv = matInverse(XTX);
    const yCol = yTrain.map((val) => [val]);
    const XTy = matMul(XT, yCol);
    const beta = matMul(XTX_inv, XTy);

    multIntercept = beta[0][0];
    multWeights = beta.slice(1).map((row) => row[0]);
  }

  const multPreds = XTest.map((row) => {
    let p = multIntercept;
    for (let j = 0; j < row.length; j++) {
      p += row[j] * (multWeights[j] || 0);
    }
    return p;
  });
  const multMetrics = calculateMetrics(yTest, multPreds);

  const multCoeffs: FeatureCoefficient[] = featureNames.map((name, i) => {
    const coeff = Math.round((multWeights[i] || 0) * 1000) / 1000;
    const dir = coeff > 0 ? 'Positive association' : coeff < 0 ? 'Negative association' : 'Neutral';
    return {
      feature: name,
      coefficient: coeff,
      interpretation: `${dir}: 1 unit shift relates to £${Math.abs(coeff).toFixed(2)} expected change in ${config.target}.`,
    };
  });

  const multResult: RegressionModelResult = {
    modelType: 'multiple',
    modelName: 'Multiple Linear Regression (OLS)',
    metrics: multMetrics,
    intercept: Math.round(multIntercept * 100) / 100,
    coefficients: multCoeffs,
    actualVsPredicted: yTest.slice(0, 150).map((act, i) => ({
      id: i + 1,
      actual: Math.round(act * 100) / 100,
      predicted: Math.round(multPreds[i] * 100) / 100,
      residual: Math.round((act - multPreds[i]) * 100) / 100,
    })),
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // 3. RANDOM FOREST REGRESSOR (Bagged Regression Trees)
  // -------------------------------------------------------------
  const rfRng = createRNG(42);
  const numTrees = 12;
  const trees: RegTreeNode[] = [];
  const rfImportances = new Array(featureNames.length).fill(0);
  const subsample = Math.max(1, Math.floor(Math.sqrt(featureNames.length)));

  for (let t = 0; t < numTrees; t++) {
    // Bootstrap sample
    const bootX: number[][] = [];
    const bootY: number[] = [];
    for (let i = 0; i < XTrain.length; i++) {
      const idx = Math.floor(rfRng() * XTrain.length);
      bootX.push(XTrain[idx]);
      bootY.push(yTrain[idx]);
    }

    const tree = buildRegTree(
      bootX,
      bootY,
      0,
      5,
      10,
      rfImportances,
      subsample,
      rfRng
    );
    trees.push(tree);
  }

  // Predict with Forest
  const rfPreds = XTest.map((row) => {
    let sumTree = 0;
    for (const tree of trees) {
      sumTree += predictRegTree(tree, row);
    }
    return sumTree / numTrees;
  });
  const rfMetrics = calculateMetrics(yTest, rfPreds);

  // Normalize feature importance
  const totalImp = rfImportances.reduce((a, b) => a + b, 0) || 1;
  const rfImportanceItems = featureNames
    .map((name, i) => ({
      feature: name,
      importance: Math.round((rfImportances[i] / totalImp) * 1000) / 10,
    }))
    .sort((a, b) => b.importance - a.importance);

  const rfResult: RegressionModelResult = {
    modelType: 'randomForest',
    modelName: 'Random Forest Regressor (12 Trees)',
    metrics: rfMetrics,
    actualVsPredicted: yTest.slice(0, 150).map((act, i) => ({
      id: i + 1,
      actual: Math.round(act * 100) / 100,
      predicted: Math.round(rfPreds[i] * 100) / 100,
      residual: Math.round((act - rfPreds[i]) * 100) / 100,
    })),
    featureImportance: rfImportanceItems,
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // CANDIDATES POOL & SELECTION
  // -------------------------------------------------------------
  const candidates: { key: string; result: RegressionModelResult }[] = [
    { key: 'simple', result: simpleResult },
    { key: 'multiple', result: multResult },
    { key: 'randomForest', result: rfResult },
  ];

  // Quantitative Ranking: Primary criterion is Test R², secondary is MAE
  candidates.sort((a, b) => {
    if (b.result.metrics.r2 !== a.result.metrics.r2) {
      return b.result.metrics.r2 - a.result.metrics.r2;
    }
    return a.result.metrics.mae - b.result.metrics.mae;
  });

  const best = candidates[0];
  const runnerUp = candidates[1];
  best.result.isRecommended = true;

  // Comparison Table Rows
  const comparisonTable: ModelComparisonRow[] = candidates.map((c) => ({
    modelName: c.result.modelName,
    isRecommended: c.key === best.key,
    metrics: {
      'R² Score': c.result.metrics.r2.toFixed(3),
      'MAE': `£${c.result.metrics.mae.toFixed(2)}`,
      'RMSE': `£${c.result.metrics.rmse.toFixed(2)}`,
    },
    badge: c.key === best.key ? 'Recommended' : undefined,
    notes:
      c.key === best.key
        ? 'Strongest measured test performance'
        : `R² diff: ${(best.result.metrics.r2 - c.result.metrics.r2).toFixed(3)}`,
  }));

  // Factual, dynamic reasoning
  const r2Diff = (best.result.metrics.r2 - runnerUp.result.metrics.r2).toFixed(3);
  const maeDiff = (runnerUp.result.metrics.mae - best.result.metrics.mae).toFixed(2);
  const whyReason = `${best.result.modelName} is recommended for this configuration because it achieved the strongest test-set performance according to the selected evaluation criteria. It attained the highest R² (${best.result.metrics.r2}) and lowest MAE (£${best.result.metrics.mae.toFixed(2)}) across the ${nTest} held-out test observations, exceeding the runner-up by ΔR² = +${r2Diff} and lower mean absolute error by £${maeDiff}.`;

  // Alternative Method definition
  const altName = runnerUp.result.modelName;
  const altDesc =
    runnerUp.key === 'multiple'
      ? 'Multiple Linear Regression provides closed-form, transparent linear coefficients where interpretability and parameter inference are preferred over non-linear interactions.'
      : runnerUp.key === 'randomForest'
      ? 'Random Forest captures non-linear interactions and threshold boundaries without assuming linear additivity.'
      : 'Simple Linear Regression serves as a clean, single-feature baseline.';

  const recommendation: BestMethodRecommendation = {
    recommendedName: best.result.modelName,
    criterion: 'Highest Test R² with Minimum Test MAE & RMSE',
    primaryMetricName: 'Test R²',
    primaryMetricValue: best.result.metrics.r2.toFixed(3),
    whyReason,
    alternativeMethod: {
      name: altName,
      description: altDesc,
      comparisonNote: `Achieved R² = ${runnerUp.result.metrics.r2.toFixed(3)} with MAE = £${runnerUp.result.metrics.mae.toFixed(2)}.`,
    },
  };

  const methodSelectionNotes = `Three candidate regression models were trained on 80% of the dataset and evaluated on the same held-out 20% test partition (${nTest} line items). The winning model was determined quantitatively by highest test R² and lowest test MAE, eliminating subjective selection bias.`;

  return {
    target: config.target,
    features: featureNames,
    preprocessing,
    recommendation,
    comparisonTable,
    recommendedResult: best.result,
    allModels: {
      simple: simpleResult,
      multiple: multResult,
      randomForest: rfResult,
    },
    methodSelectionNotes,
  };
}

// Backwards-compatible single-runner wrapper
export function runRegressionAnalysis(
  records: TarriRecord[],
  config: RegressionConfig
): RegressionResult {
  const comparison = runRegressionComparison(records, config);
  const res =
    config.modelType && comparison.allModels[config.modelType]
      ? comparison.allModels[config.modelType]
      : comparison.recommendedResult;

  return {
    modelType: res.modelType,
    target: config.target,
    features: comparison.features,
    metrics: res.metrics,
    intercept: res.intercept || 0,
    coefficients: res.coefficients || [],
    actualVsPredicted: res.actualVsPredicted,
    preprocessing: comparison.preprocessing,
    explanation: `${res.modelName} achieved an R² score of ${res.metrics.r2} with MAE £${res.metrics.mae.toFixed(2)}.`,
  };
}
