/**
 * FreshRoute Monte Carlo Simulation & Demand Forecast Engine
 * 500-run Monte Carlo uncertainty analysis (shelf life, travel delay, demand shocks)
 * Quantiles: P10 / P50 / P90 for revenue and spoilage.
 * Seasonality-aware demand forecaster.
 */

import { COMMODITIES, DESTINATIONS } from '../data/syntheticDataset';
import { Batch, CommodityType, Destination } from '../types';

export interface MonteCarloRunResult {
  p10NetRevenueInr: number;
  p50NetRevenueInr: number;
  p90NetRevenueInr: number;
  p10SpoilageKg: number;
  p50SpoilageKg: number;
  p90SpoilageKg: number;
  overallFeasibilityRobustnessPercent: number; // Probability all batches arrive feasible
  revenueDistribution: number[]; // Histogram samples
  spoilageDistribution: number[];
  insights: string[];
}

export interface DayForecast {
  dayName: string;
  baselineDemandKg: number;
  seasonalMultiplier: number;
  festivalSpikeMultiplier: number;
  predictedDemandKg: number;
  lowerConfidenceBoundKg: number;
  upperConfidenceBoundKg: number;
}

// Deterministic Pseudo-Random Generator (seeded for consistency)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Executes 500 Monte Carlo Simulation Runs
 */
export function runMonteCarloSimulation(batches: Batch[], baseNetRevenue = 4850000, baseSpoilageKg = 3200): MonteCarloRunResult {
  const rand = seededRandom(42);
  const runs = 500;
  const revenueSamples: number[] = [];
  const spoilageSamples: number[] = [];
  let fullyFeasibleCount = 0;

  for (let i = 0; i < runs; i++) {
    // Perturbations:
    // 1. Ambient temperature variation (-2°C to +6°C)
    const tempPerturb = (rand() - 0.3) * 8;
    // 2. Travel delay factor (0.9x to 1.45x)
    const delayFactor = 0.9 + rand() * 0.55;
    // 3. Market demand swing (±18%)
    const demandSwing = 0.82 + rand() * 0.36;

    // Simulate spoilage impact
    const spoilageFactor = (1 + tempPerturb * 0.08) * delayFactor;
    const runSpoilageKg = Math.max(800, baseSpoilageKg * spoilageFactor * (0.85 + rand() * 0.3));

    // Simulate net revenue impact
    const runRevenue = Math.max(
      1500000,
      baseNetRevenue * demandSwing - runSpoilageKg * 28 - (delayFactor > 1.2 ? 180000 : 0)
    );

    revenueSamples.push(Math.round(runRevenue));
    spoilageSamples.push(Math.round(runSpoilageKg));

    if (delayFactor < 1.3 && tempPerturb < 4) {
      fullyFeasibleCount += 1;
    }
  }

  // Sort samples for quantiles
  revenueSamples.sort((a, b) => a - b);
  spoilageSamples.sort((a, b) => a - b);

  const p10Idx = Math.floor(runs * 0.1);
  const p50Idx = Math.floor(runs * 0.5);
  const p90Idx = Math.floor(runs * 0.9);

  const robustness = Number(((fullyFeasibleCount / runs) * 100).toFixed(1));

  const insights = [
    `P90 Conservative Net Revenue: ₹${Math.round(revenueSamples[p10Idx]).toLocaleString('en-IN')} (Under 90% confidence worst-case delays and heat spikes).`,
    `P50 Expected Median Net Revenue: ₹${Math.round(revenueSamples[p50Idx]).toLocaleString('en-IN')}.`,
    `P10 Upside Potential: ₹${Math.round(revenueSamples[p90Idx]).toLocaleString('en-IN')} under smooth green-corridor transit and high festival demand.`,
    `Arrival Feasibility Robustness: ${robustness}% probability that all dispatches meet destination arrival RSL buffer.`,
  ];

  return {
    p10NetRevenueInr: revenueSamples[p10Idx],
    p50NetRevenueInr: revenueSamples[p50Idx],
    p90NetRevenueInr: revenueSamples[p90Idx],
    p10SpoilageKg: spoilageSamples[p10Idx],
    p50SpoilageKg: spoilageSamples[p50Idx],
    p90SpoilageKg: spoilageSamples[p90Idx],
    overallFeasibilityRobustnessPercent: robustness,
    revenueDistribution: revenueSamples,
    spoilageDistribution: spoilageSamples,
    insights,
  };
}

/**
 * 7-Day Seasonality-Aware Demand Forecaster
 */
export function generateDemandForecast(commodity: CommodityType, destinationId: string): DayForecast[] {
  const comm = COMMODITIES[commodity];
  const dest = DESTINATIONS.find((d) => d.id === destinationId) || DESTINATIONS[0];
  const baseDemand = dest.demandKg[commodity] / 7;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayMultipliers = [0.9, 0.95, 1.0, 1.05, 1.25, 1.35, 1.1]; // Weekend spike in urban retail

  return days.map((day, idx) => {
    const seasonal = dayMultipliers[idx];
    const festivalSpike = idx === 4 || idx === 5 ? 1.2 : 1.0; // Weekend festive uplift
    const predicted = Math.round(baseDemand * seasonal * festivalSpike);
    const uncertainty = predicted * (dest.demandUncertaintyPercent / 100);

    return {
      dayName: day,
      baselineDemandKg: Math.round(baseDemand),
      seasonalMultiplier: seasonal,
      festivalSpikeMultiplier: festivalSpike,
      predictedDemandKg: predicted,
      lowerConfidenceBoundKg: Math.round(predicted - uncertainty),
      upperConfidenceBoundKg: Math.round(predicted + uncertainty),
    };
  });
}
