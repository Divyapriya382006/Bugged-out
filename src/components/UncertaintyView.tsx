/**
 * FreshRoute Uncertainty & Predictive Forecasting View
 * 500-Run Monte Carlo Quantiles (P10/P50/P90), Recharts distribution histogram,
 * and 7-day seasonality-aware demand forecasting.
 */

import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { COMMODITIES, DESTINATIONS } from '../data/syntheticDataset';
import { generateDemandForecast, runMonteCarloSimulation } from '../services/monteCarloSimulation';
import { Batch, CommodityType } from '../types';

interface UncertaintyViewProps {
  batches: Batch[];
}

export const UncertaintyView: React.FC<UncertaintyViewProps> = ({ batches }) => {
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>('tomato');
  const [selectedDestination, setSelectedDestination] = useState<string>(DESTINATIONS[0].id);

  // Run 500-run Monte Carlo
  const mcResult = useMemo(() => {
    return runMonteCarloSimulation(batches);
  }, [batches]);

  // Generate 7-day Demand Forecast
  const forecastData = useMemo(() => {
    return generateDemandForecast(selectedCommodity, selectedDestination);
  }, [selectedCommodity, selectedDestination]);

  // Create histogram buckets for revenue distribution
  const histogramBuckets = useMemo(() => {
    const min = mcResult.p10NetRevenueInr * 0.85;
    const max = mcResult.p90NetRevenueInr * 1.15;
    const bucketCount = 10;
    const step = (max - min) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      range: `₹${((min + i * step) / 100000).toFixed(1)}L`,
      count: 0,
    }));

    mcResult.revenueDistribution.forEach((rev) => {
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((rev - min) / step)));
      buckets[idx].count += 1;
    });

    return buckets;
  }, [mcResult]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">🎲</span>
            Monte Carlo Uncertainty & Predictive Demand Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            500 stochastic simulation iterations over physiological shelf life, transit delays, and market demand shocks.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/60 px-4 py-2 rounded-xl text-purple-300 text-xs font-bold shadow">
          <span>🛡️</span> Feasibility Robustness: {mcResult.overallFeasibilityRobustnessPercent}%
        </div>
      </div>

      {/* Quantile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P10 (Conservative / Worst 10%) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">P90 Conservative Floor</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
              HIGH RISK
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            ₹{(mcResult.p10NetRevenueInr / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-rose-400 mt-1">
            Spoilage: {(mcResult.p90SpoilageKg / 1000).toFixed(1)} Tons under heavy heat & delays
          </div>
        </div>

        {/* P50 (Expected Median) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">P50 Expected Median</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              MEDIAN FORECAST
            </span>
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-2">
            ₹{(mcResult.p50NetRevenueInr / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Spoilage: {(mcResult.p50SpoilageKg / 1000).toFixed(1)} Tons nominal loss
          </div>
        </div>

        {/* P90 (Optimistic Upside) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">P10 Optimistic Upside</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              MAX UPSIDE
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            ₹{(mcResult.p90NetRevenueInr / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            Spoilage: {(mcResult.p10SpoilageKg / 1000).toFixed(1)} Tons (Green corridors & festival price)
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monte Carlo 500-Run Histogram */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>📊</span> 500-Run Net Revenue Probability Distribution
            </h3>
            <span className="text-xs text-slate-400">500 Iterations</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramBuckets} margin={{ top: 15, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonality Demand Forecast with Confidence Bounds */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>📈</span> 7-Day Seasonality-Aware Demand Forecast
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as CommodityType)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1"
              >
                {Object.keys(COMMODITIES).map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 15, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${(val / 1000).toFixed(0)}T`} />
                <Tooltip
                  formatter={(val: any) => `${Math.round(Number(val) || 0).toLocaleString('en-IN')} kg`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                {/* Confidence Interval Upper/Lower */}
                <Area
                  type="monotone"
                  dataKey="upperConfidenceBoundKg"
                  stroke="#38bdf8"
                  fill="#0284c7"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="predictedDemandKg"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="#38bdf8"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
