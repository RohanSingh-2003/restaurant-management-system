import React from 'react';
import { Card } from '../ui';

interface InputOutputGuideProps {
  input: string;
  target?: string;
  model?: string;
  modelsTested?: string;
  selectionCriteria?: string;
  output: string;
  metrics?: string;
}

export const InputOutputGuide: React.FC<InputOutputGuideProps> = ({
  input,
  target,
  model,
  modelsTested,
  selectionCriteria,
  output,
  metrics,
}) => {
  const displayModels = modelsTested || model || 'Evaluated Models';
  const displayCriteria = selectionCriteria || metrics || 'Quantitative Validation';

  return (
    <Card className="border border-neutral-100 bg-white shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">
          Data Mining Pipeline: Input → Candidate Models → Selection → Output
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Controlled data flow, empirical candidate comparison, and metric-governed recommendation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs">
        {/* Step 1: Input */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
            1. Input Features
          </span>
          <p className="font-semibold text-neutral-800 mt-1">{input}</p>
          <span className="text-[11px] text-neutral-400">Independent variables</span>
        </div>

        {/* Step 2: Target (if supervised) */}
        {target ? (
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
            <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
              2. Target Variable
            </span>
            <p className="font-semibold text-accent mt-1">{target}</p>
            <span className="text-[11px] text-neutral-400">Ground truth prediction</span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
            <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
              2. Target
            </span>
            <p className="font-semibold text-neutral-800 mt-1">None (Unsupervised)</p>
            <span className="text-[11px] text-neutral-400">Natural cluster structure</span>
          </div>
        )}

        {/* Step 3: Candidate Models */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
            3. Candidates Tested
          </span>
          <p className="font-semibold text-neutral-800 mt-1">{displayModels}</p>
          <span className="text-[11px] text-neutral-400">Evaluated side-by-side</span>
        </div>

        {/* Step 4: Selection Criteria */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
            4. Selection Criteria
          </span>
          <p className="font-semibold text-neutral-800 mt-1">{displayCriteria}</p>
          <span className="text-[11px] text-neutral-400">Empirical metric ranking</span>
        </div>

        {/* Step 5: Output */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100/70">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">
            5. Output
          </span>
          <p className="font-semibold text-neutral-800 mt-1">{output}</p>
          <span className="text-[11px] text-neutral-400">Recommended method inference</span>
        </div>
      </div>
    </Card>
  );
};
