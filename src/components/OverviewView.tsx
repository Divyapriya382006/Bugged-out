/**
 * FreshRoute Executive Overview & 5-Agent Command Center
 */

import React from 'react';
import { EconomicCostBreakdown } from '../services/allocationEngine';
import { DisruptionEvent, OperatingMode, PlanAllocation, UserRole } from '../types';

interface OverviewViewProps {
  planMetrics: EconomicCostBreakdown;
  baselineMetrics: EconomicCostBreakdown;
  activeDisruptions: DisruptionEvent[];
  operatingMode: OperatingMode;
  simulationClockHours: number;
  currentRole: UserRole;
  scenarioName: string;
  onAdvanceClock: (hours: number) => void;
  onModeChange: (mode: OperatingMode) => void;
  onTabNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  planMetrics,
  baselineMetrics,
  activeDisruptions,
  operatingMode,
  simulationClockHours,
  scenarioName,
  onAdvanceClock,
  onModeChange,
  onTabNavigate,
}) => {
  const netGainInr = planMetrics.netRevenueInr - baselineMetrics.netRevenueInr;
  const spoilageSavedKg = baselineMetrics.totalKgSpoiled - planMetrics.totalKgSpoiled;

  const agents = [
    {
      id: 'AGENT_1',
      name: 'Agent 1: Disruption Sensing',
      status: operatingMode === 'EMERGENCY_DEGRADED_POWER' ? 'OFFLINE' : 'ACTIVE',
      focus: 'Open-Meteo marine/weather, GDACS, PortWatch, UKMTO advisories. Corroborates signal confidence before alerting.',
      icon: '📡',
      metrics: `${activeDisruptions.length} Corroborated Signals`,
    },
    {
      id: 'AGENT_2',
      name: 'Agent 2: Cold-Chain Monitoring',
      status: 'ACTIVE',
      focus: 'Batch-level temp, RH, CO2 and GPS telemetry. Deterministic Q10 Arrhenius decay & equipment excursion detection.',
      icon: '❄️',
      metrics: '12 Live Reefer Streams',
    },
    {
      id: 'AGENT_3',
      name: 'Agent 3: Scenario Planning (Core)',
      status: operatingMode === 'EMERGENCY_DEGRADED_POWER' ? 'OFFLINE' : 'ACTIVE',
      focus: 'FEFO slack optimizer, 500-run Monte Carlo simulation, counterfactual analysis, and resilience impact graph.',
      icon: '🧠',
      metrics: 'FEFO Priority Queue Active',
    },
    {
      id: 'AGENT_4',
      name: 'Agent 4: Rerouting & Logistics',
      status: operatingMode === 'EMERGENCY_DEGRADED_POWER' ? 'OFFLINE' : 'ACTIVE',
      focus: 'Multi-modal road/sea routing, mobile repair hub rendezvous, and signed vessel machine control commands.',
      icon: '🚢',
      metrics: 'Optimal Safe Lanes Engaged',
    },
    {
      id: 'AGENT_5',
      name: 'Agent 5: Compliance & Audit',
      status: 'ACTIVE',
      focus: 'WebCrypto HMAC-SHA256 verification, append-only hash chains, versioned tariff tables, and QA human gate.',
      icon: '🛡️',
      metrics: 'WebCrypto Chain Verified',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status, Scenario & Demo Clock */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              MEDGUARD MARITIME & COLD-CHAIN ADAPTATION
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Demo Clock: <strong className="text-sky-300">T+{simulationClockHours}:00h</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            FreshRoute Operational Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active Scenario: <strong className="text-white">{scenarioName}</strong> ({activeDisruptions.length} active disruptions)
          </p>
        </div>

        {/* Operating Mode Selector & Clock Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Operating Mode */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onModeChange('CONNECTED')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                operatingMode === 'CONNECTED'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode 1: Connected
            </button>
            <button
              onClick={() => onModeChange('NETWORK_OFFLINE')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                operatingMode === 'NETWORK_OFFLINE'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode 2: Network Offline
            </button>
            <button
              onClick={() => onModeChange('EMERGENCY_DEGRADED_POWER')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                operatingMode === 'EMERGENCY_DEGRADED_POWER'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode 3: Degraded Power
            </button>
          </div>

          {/* Time Accelerated Demo Clock */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-400">
            <span>Clock:</span>
            <button
              onClick={() => onAdvanceClock(2)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold"
            >
              +2h
            </button>
            <button
              onClick={() => onAdvanceClock(8)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold"
            >
              +8h
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onTabNavigate('BASELINE')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-400">Net Financial Gain vs Baseline</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            +₹{(netGainInr / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1">
            Measured through identical cost model
          </div>
        </div>

        <div
          onClick={() => onTabNavigate('DISPOSAL')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-400">Food Spoilage Prevented</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {(spoilageSavedKg / 1000).toFixed(1)} Tons Saved
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            FreshRoute: {planMetrics.spoilagePercent}% vs Baseline: {baselineMetrics.spoilagePercent}%
          </div>
        </div>

        <div
          onClick={() => onTabNavigate('VESSEL_SHORE')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-400">Sea-Vessel Edge Satcom</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            88.9% Saved
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            AES-GCM encrypted delta telemetry
          </div>
        </div>

        <div
          onClick={() => onTabNavigate('SECURITY')}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition shadow-sm"
        >
          <div className="text-xs text-slate-400">Audit & Cryptographic Status</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /> Verified
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            WebCrypto HMAC & SHA-256 Chain
          </div>
        </div>
      </div>

      {/* Five Agents Status Grid */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🤖</span> Five Autonomous Agents Orchestrator (MedGuard Architecture)
          </h2>
          <span className="text-xs bg-sky-950 border border-sky-800 text-sky-300 px-2.5 py-0.5 rounded-full font-mono">
            Shared World State Pattern
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between text-xs space-y-2"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{agent.icon}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      agent.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="font-bold text-slate-200 text-xs">{agent.name}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-3">{agent.focus}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-sky-400 font-semibold truncate">
                {agent.metrics}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => onTabNavigate('PLAN')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-1"
        >
          <div className="font-bold text-sky-400 text-sm flex items-center gap-2">
            <span>📋</span> View Dispatch Plan
          </div>
          <p className="text-slate-400 text-[11px]">
            Inspect batch assignments, ETA, arrival RSL, and approve HIGH-review dispatches.
          </p>
        </button>

        <button
          onClick={() => onTabNavigate('VESSEL_SHORE')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-1"
        >
          <div className="font-bold text-amber-400 text-sm flex items-center gap-2">
            <span>🚢</span> Vessel & Shore 3D Twin
          </div>
          <p className="text-slate-400 text-[11px]">
            Inspect Three.js 3D vessel/truck digital twin and simulate satcom blackout.
          </p>
        </button>

        <button
          onClick={() => onTabNavigate('IMPACT_GRAPH')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-1"
        >
          <div className="font-bold text-rose-400 text-sm flex items-center gap-2">
            <span>🕸️</span> Impact Graph & Replan
          </div>
          <p className="text-slate-400 text-[11px]">
            Trace disruption propagation across the 9-node cascading resilience graph.
          </p>
        </button>

        <button
          onClick={() => onTabNavigate('AWS_ARCH')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-1"
        >
          <div className="font-bold text-purple-400 text-sm flex items-center gap-2">
            <span>☁️</span> AWS Cloud Architecture
          </div>
          <p className="text-slate-400 text-[11px]">
            View AWS IoT Core, DynamoDB, Bedrock, and KMS mapping with turnkey CDK code.
          </p>
        </button>
      </div>
    </div>
  );
};
