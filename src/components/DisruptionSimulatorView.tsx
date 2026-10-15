/**
 * FreshRoute Disruption Injection & Replan Diff View
 * Allows injecting disruptions live, triggering instant replanning,
 * and displaying a before/after allocation diff with explainable reasons.
 */

import React, { useState } from 'react';
import { BUILT_IN_SCENARIOS } from '../data/syntheticDataset';
import { orchestrator } from '../services/agentOrchestrator';
import { DisruptionEvent, PlanAllocation } from '../types';

interface DisruptionSimulatorViewProps {
  activeDisruptions: DisruptionEvent[];
  currentPlan: PlanAllocation[];
  currentScenarioId: string;
}

export const DisruptionSimulatorView: React.FC<DisruptionSimulatorViewProps> = ({
  activeDisruptions,
  currentPlan,
  currentScenarioId,
}) => {
  const [replanDiff, setReplanDiff] = useState<Array<{
    batchId: string;
    commodity: string;
    previousRoute: string;
    newRoute: string;
    previousNetRev: number;
    newNetRev: number;
    deltaNetRev: number;
    changeRationale: string;
  }> | null>(null);

  const [isReplanning, setIsReplanning] = useState(false);

  const handleSelectScenario = async (scenId: string) => {
    setIsReplanning(true);
    const beforePlan = [...currentPlan];
    await orchestrator.loadScenario(scenId);
    const afterPlan = orchestrator.getState().currentPlan;

    // Compute plan diff
    const diffs: Array<{
      batchId: string;
      commodity: string;
      previousRoute: string;
      newRoute: string;
      previousNetRev: number;
      newNetRev: number;
      deltaNetRev: number;
      changeRationale: string;
    }> = [];

    afterPlan.forEach((after) => {
      const before = beforePlan.find((b) => b.batchId === after.batchId);
      if (before && (before.destinationId !== after.destinationId || before.discountPercent !== after.discountPercent || before.reviewLevel !== after.reviewLevel)) {
        diffs.push({
          batchId: after.batchId,
          commodity: after.commodity,
          previousRoute: `${before.destinationId} (${before.discountPercent}% off)`,
          newRoute: `${after.destinationId} (${after.discountPercent}% off)`,
          previousNetRev: before.expectedNetRevenueInr,
          newNetRev: after.expectedNetRevenueInr,
          deltaNetRev: after.expectedNetRevenueInr - before.expectedNetRevenueInr,
          changeRationale: after.bindingConstraint || 'Rerouted to preserve remaining shelf life margin under disruption',
        });
      }
    });

    setReplanDiff(diffs);
    setIsReplanning(false);
  };

  const handleTriggerManualReplan = () => {
    setIsReplanning(true);
    orchestrator.runFullOrchestrationCycle();
    setTimeout(() => setIsReplanning(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">⚡</span>
            Disruption Simulator & Instant Replan Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulate lane blocks, heatwaves, reefer compressor trips, tariff surcharges, and satcom blackouts.
          </p>
        </div>

        <button
          onClick={handleTriggerManualReplan}
          disabled={isReplanning}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5"
        >
          <span>{isReplanning ? '🔄' : '⚡'}</span> Trigger Replan Cycle
        </button>
      </div>

      {/* Built-in Scenarios Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {BUILT_IN_SCENARIOS.map((scen) => {
          const isActive = currentScenarioId === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => handleSelectScenario(scen.id)}
              className={`p-3.5 rounded-xl border text-left transition ${
                isActive
                  ? 'border-sky-500 bg-sky-950/60 shadow-lg ring-1 ring-sky-500'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="truncate">{scen.name}</span>
                {isActive && <span className="text-sky-400 font-bold">● Active</span>}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{scen.tagline}</div>
              <div className="mt-2 text-[10px] text-sky-400 font-medium">
                {scen.disruptions.length} Disruptions
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Disruptions Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <span>🚨</span> Active Corroborated Disruption Signals ({activeDisruptions.length})
        </h3>

        {activeDisruptions.length === 0 ? (
          <div className="text-xs text-slate-500 py-3">No active disruptions. Operating under normal conditions.</div>
        ) : (
          <div className="space-y-2">
            {activeDisruptions.map((d) => (
              <div key={d.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {d.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                      {d.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Confidence: {(d.eventConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-slate-400">{d.description}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-4 pt-1">
                  <span>Source Authority: <strong className="text-slate-400">{d.sourceAuthority}</strong></span>
                  <span>Corroborated: <strong className="text-emerald-400">{d.corroborated ? 'YES' : 'NO'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Replan Diff View (What Changed and Why) */}
      {replanDiff && replanDiff.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🔀</span> Replan Diff: Operational Allocation Changes ({replanDiff.length} Batches Altered)
            </h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              Autonomous Optimization Engaged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                  <th className="py-2.5 px-3">Batch & Commodity</th>
                  <th className="py-2.5 px-3">Previous Assignment</th>
                  <th className="py-2.5 px-3">New Re-Routed Assignment</th>
                  <th className="py-2.5 px-3 text-right">Net Rev Impact</th>
                  <th className="py-2.5 px-3">Physiological & Resilience Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {replanDiff.map((diff, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {diff.batchId} <span className="text-slate-400 capitalize">({diff.commodity})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 line-through">{diff.previousRoute}</td>
                    <td className="py-3 px-3 font-bold text-sky-400">{diff.newRoute}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={diff.deltaNetRev >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {diff.deltaNetRev >= 0 ? '+' : ''}₹{diff.deltaNetRev.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-[300px]">{diff.changeRationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
