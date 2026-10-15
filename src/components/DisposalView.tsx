/**
 * FreshRoute Disposal & Value-Recovery Hierarchy View
 * Renders the 8-step value recovery ladder, reasons for route rejection,
 * and the QA Human Disposition Gate (Release / Quarantine / Reject) with audit log anchoring.
 */

import React, { useState } from 'react';
import { evaluateDisposalHierarchy, logQaDispositionDecision } from '../services/disposalEngine';
import { Batch } from '../types';

interface DisposalViewProps {
  batches: Batch[];
}

export const DisposalView: React.FC<DisposalViewProps> = ({ batches }) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.batchId || '');
  const [qaStatus, setQaStatus] = useState<'RELEASE' | 'QUARANTINE' | 'REJECT'>('RELEASE');
  const [inspectorNotes, setInspectorNotes] = useState('Visual inspection verified no chilling mold; physiological maturity acceptable.');
  const [isLogged, setIsLogged] = useState(false);

  const selectedBatch = batches.find((b) => b.batchId === selectedBatchId) || batches[0];
  const { evaluation, optionsBreakdown } = evaluateDisposalHierarchy(selectedBatch, qaStatus);

  const handleLogDisposition = async () => {
    await logQaDispositionDecision(
      selectedBatch.batchId,
      qaStatus,
      'Dr. Ananya Roy (Lead QA Phytosanitary Officer)',
      inspectorNotes
    );
    setIsLogged(true);
    setTimeout(() => setIsLogged(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">♻️</span>
            Disposal & Value-Recovery Hierarchy
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic 8-step value recovery ladder with mandatory human QA disposition gate.
          </p>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Inspect Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              setIsLogged(false);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
          >
            {batches.map((b) => (
              <option key={b.batchId} value={b.batchId}>
                {b.batchId} - {b.commodity.toUpperCase()} ({b.quantityKg} kg, RSL: {b.currentRslHours}h)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* QA Human Disposition Gate Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Mandatory Quality Gate (Section 6 Policy)
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              QA Human Disposition: {selectedBatch.batchId} ({selectedBatch.commodity.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-400">
              The AI never autonomously declares compromised food safe or unsafe. Excursions are flagged by rules; disposition is a human approval logged to the audit chain.
            </p>
          </div>

          {/* Disposition State Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQaStatus('RELEASE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                qaStatus === 'RELEASE'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ✓ RELEASE (Edible)
            </button>
            <button
              onClick={() => setQaStatus('QUARANTINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                qaStatus === 'QUARANTINE'
                  ? 'bg-amber-600 border-amber-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⚠ QUARANTINE (Hold)
            </button>
            <button
              onClick={() => setQaStatus('REJECT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                qaStatus === 'REJECT'
                  ? 'bg-rose-600 border-rose-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ✕ REJECT (Non-Food Only)
            </button>
          </div>
        </div>

        {/* Inspector Input */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="text"
            value={inspectorNotes}
            onChange={(e) => setInspectorNotes(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            placeholder="Enter QA inspector rationale..."
          />
          <button
            onClick={handleLogDisposition}
            className="w-full md:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition whitespace-nowrap shadow"
          >
            {isLogged ? '✓ Logged to Audit!' : 'Sign & Commit to Audit Chain'}
          </button>
        </div>
      </div>

      {/* 8-Step Value Recovery Ladder Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🪜</span> 8-Step Recovery Evaluation for Batch #{selectedBatch.batchId}
          </h3>
          <div className="text-xs text-slate-300">
            Selected Best Route:{' '}
            <strong className="text-emerald-400 font-bold">{evaluation.recommendedRoute}</strong> (Recovered ₹{evaluation.expectedValueRecoveredInr.toLocaleString('en-IN')})
          </div>
        </div>

        <div className="space-y-2.5">
          {optionsBreakdown.map((opt, idx) => {
            const isChosen = evaluation.recommendedRoute === opt.route;
            return (
              <div
                key={opt.route}
                className={`p-3.5 rounded-lg border transition ${
                  isChosen
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-md'
                    : opt.isFeasible
                    ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    : 'border-slate-800/60 bg-slate-950/40 opacity-70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-200">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        Rate: ₹{opt.valuePerKgInr}/kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold ${
                          opt.totalValueInr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {opt.totalValueInr >= 0 ? `+₹${opt.totalValueInr.toLocaleString('en-IN')}` : `-₹${Math.abs(opt.totalValueInr).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                    {isChosen ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-white font-bold text-[10px] shadow-sm">
                        OPTIMAL VALUE ROUTE
                      </span>
                    ) : opt.isFeasible ? (
                      <span className="text-slate-400 text-[10px]">FEASIBLE LOWER TIER</span>
                    ) : (
                      <span className="text-rose-400 text-[10px] font-semibold">REJECTED</span>
                    )}
                  </div>
                </div>

                {opt.rejectionReason && (
                  <div className="mt-1.5 text-[11px] text-rose-300/90 pl-6 flex items-center gap-1.5">
                    <span>↳ Rejection Reason:</span> {opt.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
