/**
 * FreshRoute Sea-Vessel & Shore Control Center
 * Satellite link simulator (Connected / Degraded / Blackout),
 * cryptographic telemetry telemetry feed, shore command dispatch,
 * bandwidth optimization tracker, and offline queue reconciliation.
 */

import React, { useEffect, useState } from 'react';
import {
  LinkMetrics,
  SatcomLinkState,
  SecurityIncident,
  vesselSimulator,
  VesselLocalState,
} from '../services/vesselShoreSimulator';
import { ShoreControlCommand } from '../types';
import { ThreeTwinView } from './ThreeTwinView';

export const VesselShoreView: React.FC = () => {
  const [vessel, setVessel] = useState<VesselLocalState>(vesselSimulator.getVesselState());
  const [metrics, setMetrics] = useState<LinkMetrics>(vesselSimulator.getLinkMetrics());
  const [incidents, setIncidents] = useState<SecurityIncident[]>(vesselSimulator.getSecurityIncidents());
  const [recentCommands, setRecentCommands] = useState<ShoreControlCommand[]>([]);
  const [reconciliationDiff, setReconciliationDiff] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll simulator state
  useEffect(() => {
    const timer = setInterval(() => {
      setVessel(vesselSimulator.getVesselState());
      setMetrics(vesselSimulator.getLinkMetrics());
      setIncidents(vesselSimulator.getSecurityIncidents());
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const handleLinkStateChange = (state: SatcomLinkState) => {
    vesselSimulator.setLinkState(state);
    setMetrics(vesselSimulator.getLinkMetrics());
    setVessel(vesselSimulator.getVesselState());
  };

  const handleSendTelemetryPacket = async (priority: 'P0_CRITICAL_ALARM' | 'P1_POSITION_CARGO' | 'P2_ROUTINE') => {
    setIsProcessing(true);
    const packet = await vesselSimulator.generateVesselTelemetry(priority);
    if (metrics.state !== 'BLACKOUT') {
      await vesselSimulator.verifyAndIngestTelemetry(packet);
    }
    setVessel(vesselSimulator.getVesselState());
    setMetrics(vesselSimulator.getLinkMetrics());
    setIsProcessing(false);
  };

  const handleIssueCommand = async (
    type: ShoreControlCommand['commandType'],
    params: Record<string, unknown>
  ) => {
    setIsProcessing(true);
    const cmd = await vesselSimulator.issueShoreCommand(type, params);
    setRecentCommands((prev) => [cmd, ...prev]);

    // If connected, execute at vessel
    if (metrics.state !== 'BLACKOUT') {
      await vesselSimulator.executeCommandAtVessel(cmd);
    }
    setVessel(vesselSimulator.getVesselState());
    setIsProcessing(false);
  };

  const handleReconcileSync = async () => {
    setIsProcessing(true);
    const res = await vesselSimulator.reconcileOnReconnect();
    setReconciliationDiff(
      `Reconciliation Summary:\n${res.summary}\n• Packets successfully verified & ingested: ${res.syncedPacketsCount}\n• Replay/Integrity conflicts blocked: ${res.conflictsResolved}`
    );
    setVessel(vesselSimulator.getVesselState());
    setMetrics(vesselSimulator.getLinkMetrics());
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* 3D Digital Twin Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🚢</span> Real-Time 3D Digital Twin (Sea Vessel & Reefer Unit)
          </h3>
          <span className="text-xs text-sky-400 font-mono">
            Powered by Three.js PBR Studio Engine
          </span>
        </div>
        <ThreeTwinView
          currentTempC={vessel.reeferTempC}
          reeferStatus={vessel.reeferStatus}
          vesselSpeedKnots={vessel.speedKnots}
        />
      </div>

      {/* Satellite Link Simulator Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">🛰️</span>
              Satcom Link & Bandwidth Optimization Simulator
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Simulates low-bandwidth Inmarsat/Iridium maritime link, packet loss, and adaptive delta telemetry.
            </p>
          </div>

          {/* Link Status Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLinkStateChange('CONNECTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                metrics.state === 'CONNECTED'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Connected (64 Kbps)
            </button>
            <button
              onClick={() => handleLinkStateChange('DEGRADED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                metrics.state === 'DEGRADED'
                  ? 'bg-amber-600 border-amber-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              Degraded (9.6 Kbps)
            </button>
            <button
              onClick={() => handleLinkStateChange('BLACKOUT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                metrics.state === 'BLACKOUT'
                  ? 'bg-rose-600 border-rose-500 text-white shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300" />
              Kill Link (Blackout)
            </button>
          </div>
        </div>

        {/* Link Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Latency</div>
            <div className="text-base font-bold text-slate-200 mt-0.5">{metrics.latencyMs} ms</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Packet Loss</div>
            <div className="text-base font-bold text-slate-200 mt-0.5">{metrics.packetLossPercent}%</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Adaptive Satcom Traffic</div>
            <div className="text-base font-bold text-sky-400 mt-0.5">
              {(metrics.totalBytesSentAdaptive / 1024).toFixed(1)} KB
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Naive Baseline Traffic</div>
            <div className="text-base font-bold text-slate-400 mt-0.5">
              {(metrics.totalBytesSentNaiveBaseline / 1024).toFixed(1)} KB
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Bandwidth Saved</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {metrics.bandwidthSavedPercent}% Saved
            </div>
          </div>
        </div>
      </div>

      {/* Vessel Edge Node vs Shore Control Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Vessel Edge Node */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  EDGE NODE
                </span>
                <h3 className="font-bold text-white text-base">{vessel.vesselName}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Cargo: <strong className="text-slate-200">{vessel.cargoCommodity}</strong> ({vessel.cargoQuantityKg.toLocaleString('en-IN')} kg)
              </p>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  vessel.autonomousContingencyActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-800'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-800'
                }`}
              >
                {vessel.autonomousContingencyActive ? 'AUTONOMOUS SAFE-DEFAULT' : 'SHORE SYNCHRONIZED'}
              </span>
            </div>
          </div>

          {/* Real-Time Telemetry Gauges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">Reefer Core Temp</div>
              <div className="text-lg font-bold text-amber-400 mt-1">{vessel.reeferTempC.toFixed(1)}°C</div>
              <div className="text-[10px] text-slate-500">Setpoint: {vessel.reeferSetPointC.toFixed(1)}°C</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">Speed / Heading</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{vessel.speedKnots} kts</div>
              <div className="text-[10px] text-slate-500">{vessel.headingDegrees}° WNW</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400">Position (Encrypted)</div>
              <div className="text-xs font-mono font-bold text-sky-400 mt-2">
                {vessel.currentLat.toFixed(2)}°N, {vessel.currentLng.toFixed(2)}°E
              </div>
            </div>
          </div>

          {/* Edge Store-and-Forward Priority Queue */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>📦</span> Edge Store-and-Forward Queue ({vessel.queuedTelemetry.length} Packets)
              </div>
              {metrics.state !== 'BLACKOUT' && vessel.queuedTelemetry.length > 0 && (
                <button
                  onClick={handleReconcileSync}
                  disabled={isProcessing}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold transition shadow"
                >
                  Sync & Reconcile
                </button>
              )}
            </div>

            {vessel.queuedTelemetry.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Queue empty. Telemetry streaming live to Shore Control.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
                {vessel.queuedTelemetry.map((pkt) => (
                  <div key={pkt.nonce} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-sky-400 font-bold">#{pkt.seq}</span>{' '}
                      <span className="text-amber-300 text-[10px]">[{pkt.priority}]</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{pkt.timestamp.slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trigger Telemetry Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Emit Packet:</span>
            <button
              onClick={() => handleSendTelemetryPacket('P0_CRITICAL_ALARM')}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
            >
              P0 Alarm
            </button>
            <button
              onClick={() => handleSendTelemetryPacket('P1_POSITION_CARGO')}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-bold"
            >
              P1 Telemetry
            </button>
            <button
              onClick={() => handleSendTelemetryPacket('P2_ROUTINE')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
            >
              P2 Routine
            </button>
          </div>
        </div>

        {/* Right Column: Shore Control Command Center */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SHORE CONTROL
                </span>
                <h3 className="font-bold text-white text-base">Fleet Operations Command Center</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative multi-modal routing & authenticated machine-to-machine control
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Gateway: AP-SOUTH-1</span>
          </div>

          {/* Command Actions */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Issue Signed Machine-to-Machine Control Command:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleIssueCommand('SET_REEFER_SETPOINT', { targetTempC: 11.5 })}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
              >
                <div className="font-bold text-sky-400">❄️ Set Reefer Setpoint</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Adjust to 11.5°C pre-cooling target</div>
              </button>

              <button
                onClick={() => handleIssueCommand('SWITCH_TO_BACKUP_COOLING', { reason: 'Primary compressor trip' })}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
              >
                <div className="font-bold text-amber-400">⚡ Switch to Backup Generator</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Engage secondary diesel reefer generator</div>
              </button>

              <button
                onClick={() => handleIssueCommand('CHANGE_SPEED', { knots: 19.5, reason: 'Outrun storm cell' })}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
              >
                <div className="font-bold text-emerald-400">🚀 Expedite Speed (19.5 kts)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Shorten transit time by 18 hours</div>
              </button>

              <button
                onClick={() => handleIssueCommand('REQUEST_REPAIR_RENDEZVOUS', { portId: 'PORT_KOCHI' })}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left transition"
              >
                <div className="font-bold text-rose-400">⚓ Request Kochi Rendezvous</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Divert to nearest repair hub berth</div>
              </button>
            </div>
          </div>

          {/* Recent Commands Issued */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Signed Commands ({recentCommands.length})
            </div>
            {recentCommands.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">No commands issued in this session.</div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
                {recentCommands.slice(0, 4).map((cmd) => (
                  <div key={cmd.commandId} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">{cmd.commandType}</span>{' '}
                      <span className="text-slate-400 text-[10px]">#{cmd.seq}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {cmd.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reconciliation Output */}
          {reconciliationDiff && (
            <div className="p-3 bg-sky-950/40 border border-sky-800 rounded-lg text-xs whitespace-pre-line text-sky-200">
              {reconciliationDiff}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
