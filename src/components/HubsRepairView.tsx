/**
 * FreshRoute Cold-Chain Repair Hubs & Temperature Fallback Ladder
 * Displays fixed and mobile repair hubs, equipment excursion handling,
 * temperature fallback ladder with chilling injury warnings, and static corridor friction tables.
 */

import React, { useState } from 'react';
import { PORTS_AND_HUBS } from '../data/syntheticDataset';
import { InfrastructureHub } from '../types';

export const HubsRepairView: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<InfrastructureHub>(PORTS_AND_HUBS[0]);
  const [activeTab, setActiveTab] = useState<'HUBS' | 'FALLBACK_LADDER' | 'STATIC_FRICTION'>('HUBS');

  const fallbackLadder = [
    {
      level: '1. Primary Active Cooling (Active Reefer)',
      tech: 'Carrier Transicold / ThermoKing Electric-Diesel Scroll Compressor with Microprocessor PID',
      bestFor: 'All commercial fresh produce (0°C to 15°C) & controlled atmosphere',
      chillingSensitiveSafe: true,
      durationLimit: 'Unlimited while fueled/powered',
      failureAction: 'Auto-switch to Level 2 and alert Cold-Chain Monitoring Agent',
    },
    {
      level: '2. Active Reefer + Passive PCM (Phase Change Material)',
      tech: 'Eutectic cold plates (-1°C or +4°C organic paraffin PCM) integrated into reefer ceiling',
      bestFor: 'Leafy greens, tomatoes, mangoes during power transfer or compressor trip',
      chillingSensitiveSafe: true,
      durationLimit: '18 - 26 hours autonomous hold',
      failureAction: 'Dispatch Mobile Hub Repair Unit before PCM thermal buffer depletes',
    },
    {
      level: '3. Vacuum Insulation Panels (VIP) + Thermal Blankets',
      tech: 'High-density silica microporous vacuum core with radiant metallized polyester thermal wraps',
      bestFor: 'Ambient truck transshipment or inter-modal rail corridor legs',
      chillingSensitiveSafe: true,
      durationLimit: '12 - 16 hours hold',
      failureAction: 'Emergency diversion to nearest cold-storage hub',
    },
    {
      level: '4. Cryogenic / Dry Ice (-78.5°C) & ULT Mechanical Freezers',
      tech: 'Solid Carbon Dioxide pellets / Ultra-Low-Temperature cascade freezers',
      bestFor: 'Deep frozen berries, frozen fruit pulp, pharmaceuticals, biological assays',
      chillingSensitiveSafe: false, // DANGER
      durationLimit: '48 - 72 hours with venting',
      failureAction: 'DO NOT USE ON CHILLING-SENSITIVE PRODUCE (Banana, Mango, Tomato, Pomegranate)',
      criticalWarning: 'CRITICAL WARNING: Dry ice directly destroys tropical produce cell walls! Causes irreversible chilling collapse, internal browning, and skin necrosis. Permitted ONLY for frozen pulp/juice concentrates.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">🛠️</span>
            Cold-Chain Infrastructure & Repair Hub Network
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fixed and mobile reefer repair hubs, maritime rendezvous points, and thermal fallback ladders.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('HUBS')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'HUBS' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏢 Repair Hubs
          </button>
          <button
            onClick={() => setActiveTab('FALLBACK_LADDER')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'FALLBACK_LADDER' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ❄️ Temperature Fallback Ladder
          </button>
          <button
            onClick={() => setActiveTab('STATIC_FRICTION')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'STATIC_FRICTION' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⏱️ Static Corridor Friction Table
          </button>
        </div>
      </div>

      {/* Tab 1: Hubs Network */}
      {activeTab === 'HUBS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hub List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Strategic Ports & Cold-Chain Hubs ({PORTS_AND_HUBS.length})
            </h3>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {PORTS_AND_HUBS.map((hub) => {
                const isSelected = selectedHub.id === hub.id;
                return (
                  <div
                    key={hub.id}
                    onClick={() => setSelectedHub(hub)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/40 shadow'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                      <span>{hub.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          hub.type === 'port' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {hub.type === 'port' ? 'PORT' : 'REPAIR HUB'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>📍 {hub.city}</span>
                      <span>Cap: {(hub.coldStorageCapacityKg / 1000).toLocaleString('en-IN')} T</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hub Deep-Dive Details */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {selectedHub.id}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedHub.name}</h3>
                <p className="text-xs text-slate-400">
                  Coordinates: {selectedHub.coordinates.lat.toFixed(4)}°N, {selectedHub.coordinates.lng.toFixed(4)}°E | Status:{' '}
                  <span className="text-emerald-400 font-semibold">{selectedHub.operationalStatus}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Static Friction Wait</div>
                <div className="text-xl font-bold text-amber-400">+{selectedHub.staticFrictionWaitHours}h</div>
              </div>
            </div>

            {/* Hub Capabilities */}
            {selectedHub.repairHubCapabilities && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Fixed Technicians</div>
                  <div className="text-lg font-bold text-slate-200 mt-0.5">
                    {selectedHub.repairHubCapabilities.fixedTechnicians} Certified
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Mobile Van Units</div>
                  <div className="text-lg font-bold text-sky-400 mt-0.5">
                    {selectedHub.repairHubCapabilities.mobileUnitsCount} Units Ready
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Avg. Response Time</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">
                    {selectedHub.repairHubCapabilities.averageResponseTimeHours} Hours
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[11px] text-slate-400">Spare Part Stock</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    Grade {selectedHub.repairHubCapabilities.sparePartStockGrade}
                  </div>
                </div>
              </div>
            )}

            {/* Maritime Vessel Rendezvous Option */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <span>🚢</span> Sea-Vessel Emergency Repair Rendezvous Protocol
              </h4>
              <p className="text-xs text-slate-300">
                If a reefer container failure occurs at sea (e.g. M/V Sagar Rani in Arabian Sea), shore logistics can issue a signed
                <code className="text-sky-300 mx-1 bg-slate-900 px-1 py-0.5 rounded">REQUEST_REPAIR_RENDEZVOUS</code>
                command to direct the vessel to berth at {selectedHub.name}.
              </p>
              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span>Emergency Transfer Capacity:</span>
                <strong className="text-slate-200">
                  {((selectedHub.repairHubCapabilities?.emergencyTransferCapacityKg || 0) / 1000).toLocaleString('en-IN')} Tons
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fallback Ladder */}
      {activeTab === 'FALLBACK_LADDER' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>❄️</span> Deterministic Temperature-Banded Fallback Ladder
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict physiological hierarchy: Chilled PCM backup before thermal blankets. Ultra-cold / Dry Ice prohibited for tropical produce.
            </p>
          </div>

          <div className="space-y-3">
            {fallbackLadder.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border text-xs space-y-2 ${
                  !step.chillingSensitiveSafe
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                  <span className="font-bold text-sm text-slate-200">{step.level}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        step.chillingSensitiveSafe
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {step.chillingSensitiveSafe ? 'CHILLING SAFE' : 'CHILLING INJURY HAZARD'}
                    </span>
                    <span className="text-slate-400 text-[11px]">Hold: {step.durationLimit}</span>
                  </div>
                </div>

                <div className="text-slate-300">
                  <strong className="text-slate-400">Technology:</strong> {step.tech}
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-300">Optimal Use:</strong> {step.bestFor}
                </div>
                <div className="text-amber-400">
                  <strong className="text-slate-400">Trigger Action:</strong> {step.failureAction}
                </div>

                {step.criticalWarning && (
                  <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded text-[11px] font-semibold flex items-center gap-2 mt-2">
                    <span>⚠️</span>
                    {step.criticalWarning}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Static Corridor Friction Table */}
      {activeTab === 'STATIC_FRICTION' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⏱️</span> Static Corridor & Port Friction Table
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clearly labeled static, baseline dwell and customs friction table (No live wait-time API assumed). A 48–72h shelf-life safety buffer is applied before ETA finalization.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 rounded text-[11px] font-bold">
              STATIC REFERENCE DATA
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                  <th className="py-2.5 px-3">Facility / Corridor</th>
                  <th className="py-2.5 px-3">Location Type</th>
                  <th className="py-2.5 px-3">Static Wait / Dwell (Hours)</th>
                  <th className="py-2.5 px-3">Safety Buffer Applied</th>
                  <th className="py-2.5 px-3">Total Pre-ETA Friction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {PORTS_AND_HUBS.map((hub) => (
                  <tr key={hub.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{hub.name}</td>
                    <td className="py-2.5 px-3 text-slate-400 uppercase text-[10px]">{hub.type}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">+{hub.staticFrictionWaitHours}h</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {hub.type === 'port' ? '+48h (Export Reefer Plug Buffer)' : '+12h (Mandi Gate Buffer)'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100 font-mono">
                      +{hub.staticFrictionWaitHours + (hub.type === 'port' ? 48 : 12)}h
                    </td>
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
