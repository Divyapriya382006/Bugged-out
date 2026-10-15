/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { BUILT_IN_SCENARIOS, COMMODITIES, DESTINATIONS, INITIAL_BATCHES } from './data/syntheticDataset';
import { generateBaselinePlan, generateFreshRoutePlan } from './services/allocationEngine';
import { orchestrator, WorldState } from './services/agentOrchestrator';
import { UserRole } from './types';

// Components
import { OverviewView } from './components/OverviewView';
import { InventoryView } from './components/InventoryView';
import { PlanView } from './components/PlanView';
import { BaselineComparisonView } from './components/BaselineComparisonView';
import { ExplainView } from './components/ExplainView';
import { DisposalView } from './components/DisposalView';
import { VesselShoreView } from './components/VesselShoreView';
import { ImpactGraphView } from './components/ImpactGraphView';
import { UncertaintyView } from './components/UncertaintyView';
import { HubsRepairView } from './components/HubsRepairView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { AwsArchitectureView } from './components/AwsArchitectureView';
import { LimitationsView } from './components/LimitationsView';

export default function App() {
  const [worldState, setWorldState] = useState<WorldState>(orchestrator.getState());
  const [activeTab, setActiveTab] = useState<string>('OVERVIEW');
  const [currentRole, setCurrentRole] = useState<UserRole>('LOGISTICS_PLANNER');
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Subscribe to World State updates
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe(() => {
      setWorldState({ ...orchestrator.getState() });
    });
    return unsubscribe;
  }, []);

  // Compute FreshRoute & Baseline metrics for currently loaded batches
  const planResults = useMemo(() => {
    return generateFreshRoutePlan(worldState.batches, worldState.destinations, worldState.lanes);
  }, [worldState.batches, worldState.destinations, worldState.lanes]);

  const baselineResults = useMemo(() => {
    return generateBaselinePlan(worldState.batches, worldState.destinations, worldState.lanes);
  }, [worldState.batches, worldState.destinations, worldState.lanes]);

  const activeScenario = BUILT_IN_SCENARIOS.find((s) => s.id === worldState.currentScenarioId) || BUILT_IN_SCENARIOS[0];

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    orchestrator.loadScenario(e.target.value);
  };

  const handleDownloadScenarioJson = () => {
    const data = {
      scenario: activeScenario,
      batches: worldState.batches,
      destinations: worldState.destinations,
      lanes: worldState.lanes,
      hubs: worldState.hubs,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', jsonStr);
    dl.setAttribute('download', `${activeScenario.id}_scenario.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  const handleUploadScenarioJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.batches && Array.isArray(parsed.batches)) {
          worldState.batches = parsed.batches;
          orchestrator.runFullOrchestrationCycle();
          alert('Custom scenario JSON loaded successfully!');
        } else {
          alert('Invalid scenario JSON schema: missing batches array.');
        }
      } catch (err) {
        alert('Failed to parse scenario JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const navTabs = [
    { id: 'OVERVIEW', label: 'Overview & KPIs', icon: '⚡' },
    { id: 'INVENTORY', label: 'Inventory (FEFO)', icon: '📦' },
    { id: 'PLAN', label: 'Dispatch Plan', icon: '📋' },
    { id: 'BASELINE', label: 'Baseline vs FreshRoute', icon: '📊' },
    { id: 'EXPLAIN', label: 'Explainability', icon: '💡' },
    { id: 'DISPOSAL', label: 'Disposal & Value Recovery', icon: '♻️' },
    { id: 'VESSEL_SHORE', label: 'Vessel Edge & Shore Control', icon: '🚢' },
    { id: 'IMPACT_GRAPH', label: 'Disruptions & Impact Graph', icon: '🕸️' },
    { id: 'UNCERTAINTY', label: 'Uncertainty & Monte Carlo', icon: '🎲' },
    { id: 'HUBS_REPAIR', label: 'Hubs & Cold-Chain Repair', icon: '🛠️' },
    { id: 'SECURITY', label: 'Security, RBAC & Audit', icon: '🛡️' },
    { id: 'AWS_ARCH', label: 'AWS Architecture & CDK', icon: '☁️' },
    { id: 'LIMITATIONS', label: 'Assumptions & Limitations', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Platform Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-lg font-black text-white shadow-md">
              FR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white tracking-tight">FreshRoute</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-800/80">
                  PS 07 Resilience Platform
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Cold-Chain & Sea-Vessel Produce Resilience (MedGuard Architecture)
              </span>
            </div>
          </div>

          {/* Scenario Selector & Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Scenario Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Scenario:</span>
              <select
                value={worldState.currentScenarioId}
                onChange={handleScenarioChange}
                className="bg-transparent text-sky-400 font-semibold focus:outline-none cursor-pointer max-w-[210px] truncate"
              >
                {BUILT_IN_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Custom JSON */}
            <label className="cursor-pointer px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition border border-slate-700 flex items-center gap-1">
              <span>📤</span> Upload Scenario
              <input type="file" accept=".json" onChange={handleUploadScenarioJson} className="hidden" />
            </label>

            {/* Download JSON */}
            <button
              onClick={handleDownloadScenarioJson}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition border border-slate-700 flex items-center gap-1"
              title="Download current scenario JSON"
            >
              <span>💾</span> Export JSON
            </button>

            {/* Schema Help */}
            <button
              onClick={() => setShowSchemaModal(true)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
              title="View Scenario JSON Schema"
            >
              Schema (?)
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation Header */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max py-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Tab View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'OVERVIEW' && (
          <OverviewView
            planMetrics={planResults.totalMetrics}
            baselineMetrics={baselineResults.totalMetrics}
            activeDisruptions={worldState.activeDisruptions}
            operatingMode={worldState.operatingMode}
            simulationClockHours={worldState.simulationClockHours}
            currentRole={currentRole}
            scenarioName={activeScenario.name}
            onAdvanceClock={(h) => orchestrator.advanceClock(h)}
            onModeChange={(m) => orchestrator.setOperatingMode(m)}
            onTabNavigate={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'INVENTORY' && <InventoryView batches={worldState.batches} />}

        {activeTab === 'PLAN' && (
          <PlanView
            allocations={worldState.currentPlan}
            currentRole={currentRole}
            simulationClockHours={worldState.simulationClockHours}
          />
        )}

        {activeTab === 'BASELINE' && (
          <BaselineComparisonView
            planMetrics={planResults.totalMetrics}
            baselineMetrics={baselineResults.totalMetrics}
            scenarioName={activeScenario.name}
          />
        )}

        {activeTab === 'EXPLAIN' && (
          <ExplainView allocations={worldState.currentPlan} batches={worldState.batches} />
        )}

        {activeTab === 'DISPOSAL' && <DisposalView batches={worldState.batches} />}

        {activeTab === 'VESSEL_SHORE' && <VesselShoreView />}

        {activeTab === 'IMPACT_GRAPH' && (
          <ImpactGraphView
            activeDisruptions={worldState.activeDisruptions}
            scenarioName={activeScenario.name}
          />
        )}

        {activeTab === 'UNCERTAINTY' && <UncertaintyView batches={worldState.batches} />}

        {activeTab === 'HUBS_REPAIR' && <HubsRepairView />}

        {activeTab === 'SECURITY' && (
          <SecurityAuditView currentRole={currentRole} onRoleChange={(r) => setCurrentRole(r)} />
        )}

        {activeTab === 'AWS_ARCH' && <AwsArchitectureView />}

        {activeTab === 'LIMITATIONS' && <LimitationsView />}
      </main>

      {/* Scenario Schema Documentation Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">FreshRoute Scenario JSON Schema Specification</h3>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-slate-300">
              You can upload custom scenarios to test hidden evaluation situations. The JSON file must adhere to this schema:
            </p>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto">
{`{
  "scenario": {
    "id": "CUSTOM_SCENARIO_ID",
    "name": "Custom Disruption Title",
    "disruptions": [
      {
        "id": "DISRUPT_01",
        "title": "Road Closure / Reefer Trip",
        "type": "HEATWAVE | CYCLONE_PORT_CLOSURE | REEFER_COMPRESSOR_FAILURE",
        "severity": "LOW | MEDIUM | HIGH | CRITICAL",
        "eventConfidence": 0.95,
        "affectedLanes": ["LANE_PUNE_DELHI"],
        "affectedPorts": ["PORT_TUTICORIN"]
      }
    ]
  },
  "batches": [
    {
      "batchId": "BATCH_01",
      "commodity": "tomato | onion | potato | banana | mango | spinach | cauliflower | grapes | apple | pomegranate",
      "quantityKg": 8000,
      "qualityGrade": "A | B | C",
      "currentRslHours": 120,
      "uncertaintyHours": 8,
      "valueAtRiskInr": 250000,
      "fefoRank": 1,
      "currentLocationId": "HUB_PUNE",
      "currentTempC": 12.0
    }
  ]
}`}
            </pre>
            <div className="text-right">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-4 text-center text-xs text-slate-500">
        FreshRoute Horticultural Cold-Chain & Maritime Resilience Architecture | Deterministic Physiological Models & WebCrypto SHA-256 Chain
      </footer>
    </div>
  );
}
