import React from 'react';
import type { BestMethodRecommendation } from '../../types/mining';

interface BestMethodCardProps {
  recommendation: BestMethodRecommendation;
  moduleType?: 'regression' | 'classification' | 'clustering';
}

export const BestMethodCard: React.FC<BestMethodCardProps> = ({
  recommendation,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Evaluated Recommendation
            </span>
            <span className="text-xs text-gray-500">
              Selection Criterion: {recommendation.criterion}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {recommendation.recommendedName}
          </h3>
        </div>

        {/* Primary Metric Score Pill */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 self-start lg:self-auto">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              Primary Metric ({recommendation.primaryMetricName})
            </div>
            <div className="text-xl font-bold text-gray-900">
              {recommendation.primaryMetricValue}
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning Section */}
      <div className="mt-5 space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Factual Methodology & Justification
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {recommendation.whyReason}
          </p>
        </div>

        {/* Alternative Candidate */}
        {recommendation.alternativeMethod && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">
                Potential Alternative: {recommendation.alternativeMethod.name}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">
                {recommendation.alternativeMethod.comparisonNote}
              </span>
            </div>
            <p className="text-gray-600 leading-normal">
              {recommendation.alternativeMethod.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
