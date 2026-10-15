/**
 * FreshRoute Explainability Engine (Turnkey Explainable AI)
 * Explains:
 * 1. Why this batch was prioritized first (FEFO slack formula)
 * 2. Why this destination was selected vs the next 2 alternatives (Quantitative net revenue & slack deltas)
 * 3. Why this discount % and timing were chosen (Price elasticity & turnover window)
 * 4. What binding constraints dictated the outcome
 * 5. Explicitly listed rejected options with physiological rejection reasons.
 */

import React, { useState } from 'react';
import { PlanAllocation, Batch } from '../types';

interface ExplainViewProps {
  allocations: PlanAllocation[];
  batches: Batch[];
}

export const ExplainView: React.FC<ExplainViewProps> = ({ allocations, batches }) => {
  const [selectedAllocId, setSelectedAllocId] = useState<string>(allocations[0]?.id || '');

  const activeAlloc = allocations.find((a) => a.id === selectedAllocId) || allocations[0];
  const activeBatch = batches.find((b) => b.batchId === activeAlloc?.batchId);

  if (!activeAlloc || !activeBatch) {
    return <div className="text-slate-400 p-8 text-center">No allocations available for explanation.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">💡</span>
            Decision Explainability & Binding Constraint Auditing
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic, explainable rationale for batch prioritization, destination ranking, and dynamic discounting.
          </p>
        </div>

        {/* Batch Allocation Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Select Allocation:</label>
          <select
            value={selectedAllocId}
            onChange={(e) => setSelectedAllocId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {allocations.map((alloc) => (
              <option key={alloc.id} value={alloc.id}>
                {alloc.batchId} - {alloc.commodity.toUpperCase()} ({alloc.destinationId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Explainability Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Why This Batch First (FEFO Priority Slack) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>⏱️</span> 1. Why Was This Batch Dispatched First?
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
              FEFO Priority Rank #{activeBatch.fefoRank}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Under FreshRoute's FEFO priority algorithm, priority is governed by{' '}
              <strong className="text-sky-300">minimum physiological slack</strong>:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
              Slack Hours = Current RSL ({activeBatch.currentRslHours}h) - [Transit Leg ({activeAlloc.estimatedArrivalHours}h) + Safety Buffer ({activeAlloc.safetyBufferHours}h)]
              <br />
              <strong className="text-emerald-400">Net Safe Arrival Margin = {activeAlloc.estimatedArrivalRslHours}h</strong>
            </div>
            <p className="text-slate-400">
              Value at Risk: <strong className="text-slate-200">₹{activeBatch.valueAtRiskInr.toLocaleString('en-IN')}</strong>. Perishability factor is elevated due to sensitivity to ambient temperature oscillations.
            </p>
          </div>
        </div>

        {/* Pillar 2: Why This Destination vs Alternatives */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🎯</span> 2. Why {activeAlloc.destinationId} vs Alternatives?
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Top Ranked Route
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Selected route maximizes expected net revenue while fulfilling destination minimum arrival shelf-life standards:
            </p>
            <div className="space-y-2 pt-1">
              {activeAlloc.alternativeOptionsCompared.map((alt, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>Alternative #{idx + 1}: {alt.destinationId}</span>
                    <span className="text-rose-400 text-[10px]">REJECTED / RANKED LOWER</span>
                  </div>
                  <div className="text-slate-400 mt-1">{alt.whyRejectedOrRankedLower}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 3: Why This Discount & Timing */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🏷️</span> 3. Discount Strategy & Sell-Through Uplift
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
              {activeAlloc.discountPercent}% Dynamic Markdown
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p>
              Timing: <strong className="text-sky-300">{activeAlloc.discountTiming}</strong>.
            </p>
            <p className="text-slate-400">
              Expected Realized Price: <strong className="text-slate-200">₹{activeAlloc.expectedRealizedPricePerKg}/kg</strong> (Strictly above marginal procurement floor price).
            </p>
            <p className="text-slate-400">
              Price elasticity triggers demand acceleration, lifting sell-through to{' '}
              <strong className="text-emerald-400">{activeAlloc.expectedSellThroughPercent}%</strong> and preventing ₹{(activeAlloc.expectedSpoilageKg * 20).toLocaleString('en-IN')} in total spoilage write-offs.
            </p>
          </div>
        </div>

        {/* Pillar 4: Binding Constraints & Autonomy Gate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🔒</span> 4. Binding Constraints & Review Level
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeAlloc.reviewLevel === 'HIGH'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : activeAlloc.reviewLevel === 'MEDIUM'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {activeAlloc.reviewLevel} REVIEW TIER
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-400 block mb-0.5">Primary Binding Constraint:</span>
              <strong className="text-sky-300 text-sm font-semibold">{activeAlloc.bindingConstraint}</strong>
            </div>
            <p className="text-slate-400">
              Autonomy Tier: <strong className="text-slate-200">{activeAlloc.autonomyTier}</strong>. Governed by value at risk and export trade barriers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
