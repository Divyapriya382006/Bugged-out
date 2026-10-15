/**
 * FreshRoute Active Inventory & Batch Physiological Health View
 */

import React from 'react';
import { COMMODITIES } from '../data/syntheticDataset';
import { Batch } from '../types';

interface InventoryViewProps {
  batches: Batch[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ batches }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">📦</span>
            Horticultural Inventory & Batch FEFO Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time batch physiological status, sensor readings, remaining shelf life (RSL), and value at risk.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Total Batches: <strong className="text-white">{batches.length}</strong> | Total Produce:{' '}
          <strong className="text-sky-400">
            {(batches.reduce((sum, b) => sum + b.quantityKg, 0) / 1000).toFixed(1)} Tons
          </strong>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                <th className="py-2.5 px-3">FEFO Rank</th>
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Commodity</th>
                <th className="py-2.5 px-3">Volume (kg)</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Current Temp</th>
                <th className="py-2.5 px-3">Remaining Shelf Life</th>
                <th className="py-2.5 px-3">Value at Risk</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {batches.map((b) => {
                const comm = COMMODITIES[b.commodity];
                const isTempExcursion = b.currentTempC > comm.idealTempMax;
                const isChilling = comm.chillingSensitive && b.currentTempC < (comm.chillingThresholdTemp || 0);

                return (
                  <tr key={b.batchId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-sky-400">#{b.fefoRank}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">{b.batchId}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-200 capitalize">{b.commodity}</span>
                      <span className="text-[10px] text-slate-500 block">{comm.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{b.quantityKg.toLocaleString('en-IN')} kg</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{b.currentLocationId}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono font-semibold ${
                          isTempExcursion || isChilling ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {b.currentTempC.toFixed(1)}°C
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Band: [{comm.idealTempMin}-{comm.idealTempMax}°C]
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          b.currentRslHours < 72 ? 'text-rose-400' : b.currentRslHours < 150 ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {b.currentRslHours}h
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">±{b.uncertaintyHours}h</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">
                      ₹{b.valueAtRiskInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.qualityGrade === 'A'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        Grade {b.qualityGrade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {b.sensorAnomalyDetected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-800">
                          CYBER ANOMALY
                        </span>
                      ) : isTempExcursion ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-800">
                          EXCURSION
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          NOMINAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
