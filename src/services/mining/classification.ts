import type { TarriRecord } from '../../types/dataset';
import type {
  ClassificationConfig,
  ClassificationResult,
  ClassificationMetrics,
  ConfusionMatrixData,
  FeatureImportanceItem,
  ClassificationComparisonResult,
  ClassificationModelResult,
  ModelComparisonRow,
  BestMethodRecommendation,
} from '../../types/mining';
import { prepareClassificationDataset, createRNG } from './preprocessing';

// ==========================================
// DECISION TREE CLASSIFIER
// ==========================================

interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  samples: number;
}

function computeGini(labels: number[], numClasses: number): number {
  if (labels.length === 0) return 0;
  const counts = new Array(numClasses).fill(0);
  for (const l of labels) counts[l]++;
  let sumSq = 0;
  const n = labels.length;
  for (let c = 0; c < numClasses; c++) {
    const p = counts[c] / n;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

function buildTree(
  X: number[][],
  y: number[],
  numClasses: number,
  depth = 0,
  maxDepth = 5,
  minSamplesSplit = 10,
  featureImportances: number[],
  featureSubsample?: number,
  rng?: () => number
): TreeNode {
  const n = y.length;
  const counts = new Array(numClasses).fill(0);
  for (const label of y) counts[label]++;
  let bestClass = 0;
  let maxCount = counts[0];
  for (let c = 1; c < numClasses; c++) {
    if (counts[c] > maxCount) {
      maxCount = counts[c];
      bestClass = c;
    }
  }

  if (depth >= maxDepth || n < minSamplesSplit || counts[bestClass] === n) {
    return { isLeaf: true, prediction: bestClass, samples: n };
  }

  const currentGini = computeGini(y, numClasses);
  let bestGain = 0;
  let bestFeat = -1;
  let bestThresh = 0;
  let bestLeftIndices: number[] = [];
  let bestRightIndices: number[] = [];

  const numFeatures = X[0].length;
  let candidateFeatures: number[] = Array.from({ length: numFeatures }, (_, i) => i);

  if (featureSubsample && rng && featureSubsample < numFeatures) {
    for (let i = candidateFeatures.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidateFeatures[i], candidateFeatures[j]] = [candidateFeatures[j], candidateFeatures[i]];
    }
    candidateFeatures = candidateFeatures.slice(0, featureSubsample);
  }

  for (const f of candidateFeatures) {
    const vals = Array.from(new Set(X.map((row) => row[f]))).sort((a, b) => a - b);
    if (vals.length <= 1) continue;

    const step = Math.max(1, Math.floor(vals.length / 15));
    for (let i = 0; i < vals.length - 1; i += step) {
      const thresh = (vals[i] + vals[i + 1]) / 2;
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];

      for (let r = 0; r < n; r++) {
        if (X[r][f] <= thresh) leftIdx.push(r);
        else rightIdx.push(r);
      }

      if (leftIdx.length === 0 || rightIdx.length === 0) continue;

      const leftY = leftIdx.map((idx) => y[idx]);
      const rightY = rightIdx.map((idx) => y[idx]);
      const leftGini = computeGini(leftY, numClasses);
      const rightGini = computeGini(rightY, numClasses);
      const splitGini = (leftIdx.length / n) * leftGini + (rightIdx.length / n) * rightGini;
      const gain = currentGini - splitGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeat = f;
        bestThresh = thresh;
        bestLeftIndices = leftIdx;
        bestRightIndices = rightIdx;
      }
    }
  }

  if (bestGain <= 0 || bestFeat === -1) {
    return { isLeaf: true, prediction: bestClass, samples: n };
  }

  featureImportances[bestFeat] += bestGain * n;

  const leftX = bestLeftIndices.map((i) => X[i]);
  const leftY = bestLeftIndices.map((i) => y[i]);
  const rightX = bestRightIndices.map((i) => X[i]);
  const rightY = bestRightIndices.map((i) => y[i]);

  const leftNode = buildTree(
    leftX,
    leftY,
    numClasses,
    depth + 1,
    maxDepth,
    minSamplesSplit,
    featureImportances,
    featureSubsample,
    rng
  );
  const rightNode = buildTree(
    rightX,
    rightY,
    numClasses,
    depth + 1,
    maxDepth,
    minSamplesSplit,
    featureImportances,
    featureSubsample,
    rng
  );

  return {
    isLeaf: false,
    featureIndex: bestFeat,
    threshold: bestThresh,
    left: leftNode,
    right: rightNode,
    samples: n,
  };
}

function predictTree(node: TreeNode, x: number[]): number {
  if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
    return node.prediction ?? 0;
  }
  if (x[node.featureIndex] <= node.threshold) {
    return node.left ? predictTree(node.left, x) : (node.prediction ?? 0);
  } else {
    return node.right ? predictTree(node.right, x) : (node.prediction ?? 0);
  }
}

// ==========================================
// LOGISTIC REGRESSION CLASSIFIER
// ==========================================

function sigmoid(z: number): number {
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

function trainBinaryLogistic(
  X: number[][],
  y: number[],
  epochs = 120,
  lr = 0.05,
  l2 = 0.001
): { weights: number[]; bias: number } {
  const n = X.length;
  const p = X[0].length;
  const weights = new Array(p).fill(0);
  let bias = 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const dw = new Array(p).fill(0);
    let db = 0;

    for (let i = 0; i < n; i++) {
      let z = bias;
      for (let j = 0; j < p; j++) {
        z += X[i][j] * weights[j];
      }
      const pred = sigmoid(z);
      const err = pred - y[i];

      for (let j = 0; j < p; j++) {
        dw[j] += err * X[i][j];
      }
      db += err;
    }

    for (let j = 0; j < p; j++) {
      weights[j] -= lr * (dw[j] / n + l2 * weights[j]);
    }
    bias -= lr * (db / n);
  }

  return { weights, bias };
}

// ==========================================
// METRIC CALCULATION (ROC-AUC, BALANCED ACCURACY, CONFUSION MATRIX)
// ==========================================

function computeRocAuc(actuals: number[], probs: number[]): number {
  // Mann-Whitney U test statistic for ROC-AUC
  const n = actuals.length;
  const posIndices: number[] = [];
  const negIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (actuals[i] === 1) posIndices.push(i);
    else negIndices.push(i);
  }

  const nPos = posIndices.length;
  const nNeg = negIndices.length;
  if (nPos === 0 || nNeg === 0) return 0.5;

  let rankSum = 0;
  for (const pIdx of posIndices) {
    for (const nIdx of negIndices) {
      if (probs[pIdx] > probs[nIdx]) rankSum += 1.0;
      else if (probs[pIdx] === probs[nIdx]) rankSum += 0.5;
    }
  }

  return Math.round((rankSum / (nPos * nNeg)) * 1000) / 1000;
}

function evaluateClassification(
  actuals: number[],
  preds: number[],
  probs: number[] | null,
  classes: string[]
): {
  metrics: ClassificationMetrics;
  confusionMatrix: ConfusionMatrixData;
} {
  const numClasses = classes.length;
  const matrix = Array.from({ length: numClasses }, () => new Array(numClasses).fill(0));

  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = preds[i];
    if (act >= 0 && act < numClasses && pred >= 0 && pred < numClasses) {
      matrix[act][pred]++;
    }
  }

  let totalCorrect = 0;
  const n = actuals.length;
  const classBreakdown = [];
  let sumRecall = 0;
  let sumPrecision = 0;
  let sumF1 = 0;

  for (let c = 0; c < numClasses; c++) {
    const tp = matrix[c][c];
    totalCorrect += tp;

    let actualClassTotal = 0;
    for (let j = 0; j < numClasses; j++) actualClassTotal += matrix[c][j];

    let predictedClassTotal = 0;
    for (let i = 0; i < numClasses; i++) predictedClassTotal += matrix[i][c];

    const precision = predictedClassTotal > 0 ? tp / predictedClassTotal : 0;
    const recall = actualClassTotal > 0 ? tp / actualClassTotal : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    sumPrecision += precision;
    sumRecall += recall;
    sumF1 += f1;

    classBreakdown.push({
      className: classes[c],
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      support: actualClassTotal,
    });
  }

  const accuracy = n > 0 ? totalCorrect / n : 0;
  const macroPrecision = numClasses > 0 ? sumPrecision / numClasses : 0;
  const macroRecall = numClasses > 0 ? sumRecall / numClasses : 0;
  const macroF1 = numClasses > 0 ? sumF1 / numClasses : 0;
  const balancedAccuracy = macroRecall; // Average recall across classes

  const rocAuc = probs && numClasses === 2 ? computeRocAuc(actuals, probs) : undefined;

  return {
    metrics: {
      accuracy: Math.round(accuracy * 1000) / 1000,
      precision: Math.round(macroPrecision * 1000) / 1000,
      recall: Math.round(macroRecall * 1000) / 1000,
      f1: Math.round(macroF1 * 1000) / 1000,
      balancedAccuracy: Math.round(balancedAccuracy * 1000) / 1000,
      rocAuc,
      classBreakdown,
    },
    confusionMatrix: {
      classes,
      matrix,
      totalSamples: n,
    },
  };
}

// ==========================================
// AUTOMATIC CLASSIFICATION COMPARISON RUNNER
// ==========================================

export function runClassificationComparison(
  records: TarriRecord[],
  config: ClassificationConfig
): ClassificationComparisonResult {
  const { split, classes, classDistribution, isImbalanced, preprocessing } = prepareClassificationDataset(
    records,
    config.target,
    config.features,
    config.trainSplitRatio || 0.8
  );

  const { XTrain, yTrain, XTest, yTest, featureNames } = split;
  const numClasses = classes.length;
  const numFeatures = featureNames.length;
  const nTest = yTest.length;

  // -------------------------------------------------------------
  // 1. LOGISTIC REGRESSION (Z-score standardized, OvR for multiclass)
  // -------------------------------------------------------------
  const means = new Array(numFeatures).fill(0);
  const stds = new Array(numFeatures).fill(1);
  for (const row of XTrain) {
    for (let j = 0; j < numFeatures; j++) means[j] += row[j];
  }
  for (let j = 0; j < numFeatures; j++) means[j] /= XTrain.length || 1;
  for (const row of XTrain) {
    for (let j = 0; j < numFeatures; j++) stds[j] += (row[j] - means[j]) ** 2;
  }
  for (let j = 0; j < numFeatures; j++) stds[j] = Math.sqrt(stds[j] / (XTrain.length || 1)) || 1;

  const scale = (row: number[]) => row.map((v, j) => (v - means[j]) / stds[j]);
  const scaledXTrain = XTrain.map(scale);
  const scaledXTest = XTest.map(scale);

  const lrRawImportances = new Array(numFeatures).fill(0);
  const lrPreds: number[] = [];
  const lrProbs: number[] = [];

  if (numClasses === 2) {
    const model = trainBinaryLogistic(scaledXTrain, yTrain);
    for (let j = 0; j < numFeatures; j++) lrRawImportances[j] = Math.abs(model.weights[j]);

    for (const row of scaledXTest) {
      let z = model.bias;
      for (let j = 0; j < numFeatures; j++) z += row[j] * model.weights[j];
      const p = sigmoid(z);
      lrProbs.push(p);
      lrPreds.push(p >= 0.5 ? 1 : 0);
    }
  } else {
    // One-vs-Rest for multiclass
    const models: { weights: number[]; bias: number }[] = [];
    for (let c = 0; c < numClasses; c++) {
      const binY = yTrain.map((y) => (y === c ? 1 : 0));
      models.push(trainBinaryLogistic(scaledXTrain, binY, 80));
    }
    for (let j = 0; j < numFeatures; j++) {
      let maxW = 0;
      for (let c = 0; c < numClasses; c++) maxW = Math.max(maxW, Math.abs(models[c].weights[j]));
      lrRawImportances[j] = maxW;
    }
    for (const row of scaledXTest) {
      let bestClass = 0;
      let maxZ = -Infinity;
      for (let c = 0; c < numClasses; c++) {
        let z = models[c].bias;
        for (let j = 0; j < numFeatures; j++) z += row[j] * models[c].weights[j];
        if (z > maxZ) {
          maxZ = z;
          bestClass = c;
        }
      }
      lrPreds.push(bestClass);
    }
  }

  const lrTotalImp = lrRawImportances.reduce((a, b) => a + b, 0) || 1;
  const lrImportanceItems: FeatureImportanceItem[] = featureNames
    .map((name, i) => ({
      feature: name,
      importance: Math.round((lrRawImportances[i] / lrTotalImp) * 1000) / 10,
    }))
    .sort((a, b) => b.importance - a.importance);

  const lrEval = evaluateClassification(
    yTest,
    lrPreds,
    numClasses === 2 ? lrProbs : null,
    classes
  );

  const lrResult: ClassificationModelResult = {
    modelType: 'logistic',
    modelName: 'Logistic Regression (L2 Regularized)',
    metrics: lrEval.metrics,
    confusionMatrix: lrEval.confusionMatrix,
    featureImportance: lrImportanceItems,
    samplePredictions: yTest.slice(0, 50).map((act, i) => ({
      id: i + 1,
      actual: classes[act] || `Class ${act}`,
      predicted: classes[lrPreds[i]] || `Class ${lrPreds[i]}`,
      correct: act === lrPreds[i],
    })),
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // 2. DECISION TREE CLASSIFIER (Gini Impurity)
  // -------------------------------------------------------------
  const dtImportances = new Array(numFeatures).fill(0);
  const dtTree = buildTree(XTrain, yTrain, numClasses, 0, 5, 10, dtImportances);

  const dtPreds = XTest.map((row) => predictTree(dtTree, row));
  const dtTotalImp = dtImportances.reduce((a, b) => a + b, 0) || 1;
  const dtImportanceItems: FeatureImportanceItem[] = featureNames
    .map((name, i) => ({
      feature: name,
      importance: Math.round((dtImportances[i] / dtTotalImp) * 1000) / 10,
    }))
    .sort((a, b) => b.importance - a.importance);

  const dtEval = evaluateClassification(yTest, dtPreds, null, classes);

  const dtResult: ClassificationModelResult = {
    modelType: 'decisionTree',
    modelName: 'Decision Tree Classifier (Depth=5, Gini)',
    metrics: dtEval.metrics,
    confusionMatrix: dtEval.confusionMatrix,
    featureImportance: dtImportanceItems,
    samplePredictions: yTest.slice(0, 50).map((act, i) => ({
      id: i + 1,
      actual: classes[act] || `Class ${act}`,
      predicted: classes[dtPreds[i]] || `Class ${dtPreds[i]}`,
      correct: act === dtPreds[i],
    })),
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // 3. RANDOM FOREST CLASSIFIER (15 Bagged Trees)
  // -------------------------------------------------------------
  const rfRng = createRNG(42);
  const numTrees = 15;
  const rfTrees: TreeNode[] = [];
  const rfImportances = new Array(numFeatures).fill(0);
  const rfSubsample = Math.max(1, Math.floor(Math.sqrt(numFeatures)));

  for (let t = 0; t < numTrees; t++) {
    const bootX: number[][] = [];
    const bootY: number[] = [];
    for (let i = 0; i < XTrain.length; i++) {
      const idx = Math.floor(rfRng() * XTrain.length);
      bootX.push(XTrain[idx]);
      bootY.push(yTrain[idx]);
    }

    const tree = buildTree(
      bootX,
      bootY,
      numClasses,
      0,
      5,
      10,
      rfImportances,
      rfSubsample,
      rfRng
    );
    rfTrees.push(tree);
  }

  const rfPreds: number[] = [];
  const rfProbs: number[] = [];

  for (const row of XTest) {
    const votes = new Array(numClasses).fill(0);
    for (const tree of rfTrees) {
      votes[predictTree(tree, row)]++;
    }
    let bestClass = 0;
    let maxV = votes[0];
    for (let c = 1; c < numClasses; c++) {
      if (votes[c] > maxV) {
        maxV = votes[c];
        bestClass = c;
      }
    }
    rfPreds.push(bestClass);
    if (numClasses === 2) {
      rfProbs.push(votes[1] / numTrees);
    }
  }

  const rfTotalImp = rfImportances.reduce((a, b) => a + b, 0) || 1;
  const rfImportanceItems: FeatureImportanceItem[] = featureNames
    .map((name, i) => ({
      feature: name,
      importance: Math.round((rfImportances[i] / rfTotalImp) * 1000) / 10,
    }))
    .sort((a, b) => b.importance - a.importance);

  const rfEval = evaluateClassification(
    yTest,
    rfPreds,
    numClasses === 2 ? rfProbs : null,
    classes
  );

  const rfResult: ClassificationModelResult = {
    modelType: 'randomForest',
    modelName: 'Random Forest Classifier (15 Trees)',
    metrics: rfEval.metrics,
    confusionMatrix: rfEval.confusionMatrix,
    featureImportance: rfImportanceItems,
    samplePredictions: yTest.slice(0, 50).map((act, i) => ({
      id: i + 1,
      actual: classes[act] || `Class ${act}`,
      predicted: classes[rfPreds[i]] || `Class ${rfPreds[i]}`,
      correct: act === rfPreds[i],
    })),
    isRecommended: false,
  };

  // -------------------------------------------------------------
  // CANDIDATE EVALUATION & SELECTION
  // -------------------------------------------------------------
  const candidates: { key: string; result: ClassificationModelResult }[] = [
    { key: 'logistic', result: lrResult },
    { key: 'decisionTree', result: dtResult },
    { key: 'randomForest', result: rfResult },
  ];

  // Selection Logic:
  // If imbalanced, rank primarily by F1, secondary by Balanced Accuracy.
  // Never rank imbalanced targets by raw accuracy (accuracy paradox).
  candidates.sort((a, b) => {
    if (isImbalanced) {
      if (b.result.metrics.f1 !== a.result.metrics.f1) {
        return b.result.metrics.f1 - a.result.metrics.f1;
      }
      return b.result.metrics.balancedAccuracy - a.result.metrics.balancedAccuracy;
    } else {
      if (b.result.metrics.f1 !== a.result.metrics.f1) {
        return b.result.metrics.f1 - a.result.metrics.f1;
      }
      return b.result.metrics.accuracy - a.result.metrics.accuracy;
    }
  });

  const best = candidates[0];
  const runnerUp = candidates[1];
  best.result.isRecommended = true;

  // Comparison Table Rows
  const comparisonTable: ModelComparisonRow[] = candidates.map((c) => {
    const rowMetrics: Record<string, string | number> = {
      'Accuracy': `${(c.result.metrics.accuracy * 100).toFixed(1)}%`,
      'Macro F1': c.result.metrics.f1.toFixed(3),
      'Precision': c.result.metrics.precision.toFixed(3),
      'Recall': c.result.metrics.recall.toFixed(3),
      'Balanced Acc': `${(c.result.metrics.balancedAccuracy * 100).toFixed(1)}%`,
    };
    if (c.result.metrics.rocAuc !== undefined) {
      rowMetrics['ROC-AUC'] = c.result.metrics.rocAuc.toFixed(3);
    }

    return {
      modelName: c.result.modelName,
      isRecommended: c.key === best.key,
      metrics: rowMetrics,
      badge: c.key === best.key ? 'Recommended' : undefined,
      notes:
        c.key === best.key
          ? isImbalanced
            ? 'Highest Macro F1 & Balanced Accuracy on imbalanced target'
            : 'Highest overall F1 and test performance'
          : `F1 difference: ${(best.result.metrics.f1 - c.result.metrics.f1).toFixed(3)}`,
    };
  });

  // Factual, measured reasoning
  let whyReason = '';
  if (isImbalanced) {
    whyReason = `${best.result.modelName} is recommended for this configuration because it achieved the strongest Macro F1 score (${best.result.metrics.f1.toFixed(3)}) and balanced accuracy (${(best.result.metrics.balancedAccuracy * 100).toFixed(1)}%) on the test set. Because the target '${config.target}' exhibits substantial class imbalance, the system prioritized class-aware metrics over raw accuracy to prevent majority-class bias.`;
  } else {
    whyReason = `${best.result.modelName} is recommended for this configuration because it achieved the strongest test-set performance according to the selected evaluation criteria, with a Macro F1 score of ${best.result.metrics.f1.toFixed(3)} and accuracy of ${(best.result.metrics.accuracy * 100).toFixed(1)}%.`;
  }

  // Alternative Method definition
  const altName = runnerUp.result.modelName;
  const altDesc =
    runnerUp.key === 'logistic'
      ? 'Logistic Regression provides closed-form, probabilistic linear decision boundaries with direct parameter interpretability.'
      : runnerUp.key === 'decisionTree'
      ? 'Decision Tree offers a transparent, rule-based hierarchical structure that can be easily inspected or translated into conditional if-then rules.'
      : 'Random Forest aggregates multiple tree estimators to reduce overfitting variance.';

  const recommendation: BestMethodRecommendation = {
    recommendedName: best.result.modelName,
    criterion: isImbalanced
      ? 'Highest Macro F1 Score & Balanced Accuracy (Class-Imbalance Aware)'
      : 'Highest Macro F1 Score & Test Accuracy',
    primaryMetricName: isImbalanced ? 'Macro F1 Score' : 'Accuracy',
    primaryMetricValue: isImbalanced
      ? best.result.metrics.f1.toFixed(3)
      : `${(best.result.metrics.accuracy * 100).toFixed(1)}%`,
    whyReason,
    alternativeMethod: {
      name: altName,
      description: altDesc,
      comparisonNote: `Achieved F1 = ${runnerUp.result.metrics.f1.toFixed(3)}, Balanced Acc = ${(runnerUp.result.metrics.balancedAccuracy * 100).toFixed(1)}%.`,
    },
  };

  const methodSelectionNotes = `Candidate classifiers were trained on identical stratified training partitions and evaluated on ${nTest} held-out test records. ${
    isImbalanced
      ? 'Due to target class imbalance, selection strictly relied on Macro F1 and Balanced Accuracy rather than raw accuracy.'
      : 'Model selection was determined quantitatively by F1 score and predictive reliability.'
  }`;

  return {
    target: config.target,
    features: featureNames,
    classes,
    classDistribution,
    isImbalanced,
    preprocessing,
    recommendation,
    comparisonTable,
    recommendedResult: best.result,
    allModels: {
      logistic: lrResult,
      decisionTree: dtResult,
      randomForest: rfResult,
    },
    methodSelectionNotes,
  };
}

// Backwards-compatible single-runner wrapper
export function runClassificationAnalysis(
  records: TarriRecord[],
  config: ClassificationConfig
): ClassificationResult {
  const comparison = runClassificationComparison(records, config);
  const res =
    config.modelType && comparison.allModels[config.modelType]
      ? comparison.allModels[config.modelType]
      : comparison.recommendedResult;

  return {
    modelType: res.modelType,
    target: config.target,
    features: comparison.features,
    classes: comparison.classes,
    classDistribution: comparison.classDistribution,
    isImbalanced: comparison.isImbalanced,
    metrics: res.metrics,
    confusionMatrix: res.confusionMatrix,
    featureImportance: res.featureImportance,
    preprocessing: comparison.preprocessing,
    samplePredictions: res.samplePredictions,
    explanation: `${res.modelName} achieved test accuracy of ${(res.metrics.accuracy * 100).toFixed(1)}% and Macro F1 of ${res.metrics.f1.toFixed(3)}.`,
  };
}
