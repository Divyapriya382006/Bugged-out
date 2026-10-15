/**
 * FreshRoute Baseline vs FreshRoute Performance Comparison
 * Side-by-side evaluation against the FIFO baseline using the identical simulator and economic cost model.
 * Includes Net Revenue Waterfall and Spoilage KPI Breakdown using Recharts.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EconomicCostBreakdown } from '../services/allocationEngine';

interface BaselineComparisonViewProps {
  planMetrics: EconomicCostBreakdown;
  baselineMetrics: EconomicCostBreakdown;
  scenarioName: string;
}

export const BaselineComparisonView: React.FC<BaselineComparisonViewProps> = ({
  planMetrics,
  baselineMetrics,
  scenarioName,
}) => {
  const netRevenueDiff = planMetrics.netRevenueInr - baselineMetrics.netRevenueInr;
  const netRevenuePercentImprovement =
    baselineMetrics.netRevenueInr > 0
      ? Number(((netRevenueDiff / baselineMetrics.netRevenueInr) * 100).toFixed(1))
      : 100;

  const spoilageReductionKg = baselineMetrics.totalKgSpoiled - planMetrics.totalKgSpoiled;
  const spoilagePercentReduction = Number(
    (baselineMetrics.spoilagePercent - planMetrics.spoilagePercent).toFixed(1)
  );

  // Waterfall Chart Data for FreshRoute Net Revenue
  const waterfallData = [
    { name: 'Gross Revenue', value: planMetrics.grossRevenueInr, type: 'positive' },
    { name: 'Freight Cost', value: -planMetrics.transportFreightCostInr, type: 'negative' },
    { name: 'Handling Loss', value: -planMetrics.handlingLossCostInr, type: 'negative' },
    { name: 'Reefer Energy', value: -planMetrics.reeferEnergyCostInr, type: 'negative' },
    { name: 'Export Tariffs', value: -planMetrics.tariffDutiesInr, type: 'negative' },
    { name: 'Spoilage Loss', value: -planMetrics.spoilageLossInr, type: 'negative' },
    { name: 'Disposal Recovery', value: planMetrics.disposalNetRecoveryInr, type: 'positive' },
    { name: 'Final Net Revenue', value: planMetrics.netRevenueInr, type: 'total' },
  ];

  // Head-to-Head Comparison Chart Data
  const comparisonData = [
    {
      metric: 'Net Revenue (₹Lakhs)',
      FreshRoute: Number((planMetrics.netRevenueInr / 100000).toFixed(2)),
      Baseline: Number((baselineMetrics.netRevenueInr / 100000).toFixed(2)),
    },
    {
      metric: 'Spoilage Volume (Tons)',
      FreshRoute: Number((planMetrics.totalKgSpoiled / 1000).toFixed(1)),
      Baseline: Number((baselineMetrics.totalKgSpoiled / 1000).toFixed(1)),
    },
    {
      metric: 'Fulfillment (%)',
      FreshRoute: planMetrics.demandFulfillmentPercent,
      Baseline: baselineMetrics.demandFulfillmentPercent,
    },
    {
      metric: 'Disposal Recovery (₹K)',
      FreshRoute: Number((planMetrics.disposalNetRecoveryInr / 1000).toFixed(1)),
      Baseline: Number((baselineMetrics.disposalNetRecoveryInr / 1000).toFixed(1)),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">📊</span>
            FreshRoute vs Defined Baseline (FIFO) Benchmark
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Simulated under the EXACT SAME economic cost model and scenario conditions ({scenarioName}).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/60 px-4 py-2 rounded-xl text-emerald-300 text-xs font-bold shadow">
          <span>📈</span> Net Gain: +₹{(netRevenueDiff / 100000).toFixed(2)} Lakhs (+{netRevenuePercentImprovement}%)
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400">Net Revenue (After all costs)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{(planMetrics.netRevenueInr / 100000).toFixed(2)}L
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Baseline: ₹{(baselineMetrics.netRevenueInr / 100000).toFixed(2)}L</span>
            <span className="text-emerald-400 font-bold">+{netRevenuePercentImprovement}%</span>
          </div>
        </div>

        {/* Spoilage Loss */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400">Total Produce Spoiled</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {(planMetrics.totalKgSpoiled / 1000).toFixed(1)} T{' '}
            <span className="text-xs font-normal text-slate-400">({planMetrics.spoilagePercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Baseline: {(baselineMetrics.totalKgSpoiled / 1000).toFixed(1)} T ({baselineMetrics.spoilagePercent}%)</span>
            <span className="text-emerald-400 font-bold">-{spoilagePercentReduction}%</span>
          </div>
        </div>

        {/* Demand Fulfillment */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400">Demand Fulfillment</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {planMetrics.demandFulfillmentPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Baseline: {baselineMetrics.demandFulfillmentPercent}%</span>
            <span className="text-emerald-400 font-bold">
              +{(planMetrics.demandFulfillmentPercent - baselineMetrics.demandFulfillmentPercent).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Value Recovery */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-400">Value Recovery / Salvage</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            ₹{(planMetrics.disposalNetRecoveryInr / 1000).toFixed(1)}K
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Baseline: Landfill Penalty</span>
            <span className="text-amber-400 font-bold">Saved ₹{Math.abs(baselineMetrics.disposalNetRecoveryInr).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🌊</span> Net Revenue Economic Waterfall
            </h3>
            <span className="text-xs text-slate-400">Values in INR (₹)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-30} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} />
                <Tooltip
                  formatter={(val: any) => `₹${Math.round(Number(val) || 0).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => {
                    const color =
                      entry.type === 'total'
                        ? '#38bdf8'
                        : entry.value >= 0
                        ? '#10b981'
                        : '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Head-to-Head Comparison Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>⚖️</span> Head-to-Head Metric Benchmarking
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-sky-400 font-semibold">
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> FreshRoute
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-600 rounded-sm" /> Baseline (FIFO)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="FreshRoute" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Baseline" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
