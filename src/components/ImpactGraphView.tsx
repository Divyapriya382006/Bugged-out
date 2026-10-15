/**
 * FreshRoute Produce Resilience Impact Graph & Counterfactuals
 * Visualizes the 9-node cascading failure propagation:
 * Disruption → Infrastructure → Lane → Shipment/Vessel → Batch → RSL Decay → Destination Stock → Demand Fulfillment → Spoilage & Financial Impact
 * Includes counterfactual comparison matrix across 6 interventions.
 */

import React, { useState } from 'react';
import { DisruptionEvent } from '../types';

interface ImpactGraphViewProps {
  activeDisruptions: DisruptionEvent[];
  scenarioName: string;
}

export const ImpactGraphView: React.FC<ImpactGraphViewProps> = ({ activeDisruptions, scenarioName }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('DISRUPTION');
  const [activeIntervention, setActiveIntervention] = useState<string>('REROUTE_OPTIMIZED');

  const nodes = [
    {
      id: 'DISRUPTION',
      label: '1. Disruption Signal',
      sub: activeDisruptions.length > 0 ? activeDisruptions[0].title : 'Nominal Conditions (No Alert)',
      tier: activeDisruptions.length > 0 ? 'CRITICAL' : 'NORMAL',
      icon: '⚡',
      details: 'Ingested via Disruption Sensing Agent. Validated against authoritative sources (IMD/UKMTO). Corroborated confidence: 94%.',
    },
    {
      id: 'INFRASTRUCTURE',
      label: '2. Infrastructure Impact',
      sub: activeDisruptions.length > 0 ? 'Tuticorin Port / NH-48 Corridor Stress' : 'Ports & Hubs Uncongested',
      tier: activeDisruptions.length > 0 ? 'HIGH' : 'NORMAL',
      icon: '🏗️',
      details: 'Static friction wait increased +18h; port reefer plugs at 95% capacity; mobile repair team on standby.',
    },
    {
      id: 'LANE',
      label: '3. Transport Lane State',
      sub: activeDisruptions.length > 0 ? 'LANE_TUTICORIN_FEEDER: BLOCKED' : 'Road & Sea Lanes Clear',
      tier: activeDisruptions.length > 0 ? 'CRITICAL' : 'NORMAL',
      icon: '🛣️',
      details: 'Gale winds & sea state 6 prevent feeder navigation; road corridor ambient pavement temp 45°C.',
    },
    {
      id: 'SHIPMENT',
      label: '4. Vessel / Vehicle Unit',
      sub: 'M/V Sagar Rani / Reefer #4011',
      tier: activeDisruptions.length > 0 ? 'HIGH' : 'NORMAL',
      icon: '🚢',
      details: 'Compressor anomaly detected on reefer container #4011. Local edge telemetry signed with HMAC-SHA256.',
    },
    {
      id: 'BATCH',
      label: '5. Horticultural Batch',
      sub: 'BATCH_BAN_2026_01 (14,000 kg Cavendish)',
      tier: activeDisruptions.length > 0 ? 'HIGH' : 'NORMAL',
      icon: '🍌',
      details: 'Chilling sensitive & ethylene producer. Current temp 19.5°C vs ideal [13-14°C].',
    },
    {
      id: 'RSL_DECAY',
      label: '6. RSL Accelerated Decay',
      sub: activeDisruptions.length > 0 ? 'Decay Rate 2.85x Baseline (-4.2h/hr)' : 'Decay Rate 1.0x Baseline',
      tier: activeDisruptions.length > 0 ? 'CRITICAL' : 'NORMAL',
      icon: '⏱️',
      details: 'Q10 physiological model computes rapid degradation. RSL dropped from 144h to 68h.',
    },
    {
      id: 'DEST_STOCK',
      label: '7. Destination Stock Level',
      sub: 'Dubai Jebel Ali / Mumbai APMC Buffer',
      tier: activeDisruptions.length > 0 ? 'MEDIUM' : 'NORMAL',
      icon: '🏬',
      details: 'Receiving terminal safety buffer violated if arrival delayed beyond 72h window.',
    },
    {
      id: 'DEMAND',
      label: '8. Retail Fulfillment',
      sub: 'Fulfillment Risk: 24,000 kg Unmet',
      tier: activeDisruptions.length > 0 ? 'HIGH' : 'NORMAL',
      icon: '📈',
      details: 'Price elasticity dictates 12% price escalation if urban wholesale stock runs out.',
    },
    {
      id: 'SPOILAGE_LOSS',
      label: '9. Spoilage & Financial Impact',
      sub: activeDisruptions.length > 0 ? '₹6.44 Lakhs at Risk without Action' : 'Spoilage within 3.2% Target',
      tier: activeDisruptions.length > 0 ? 'CRITICAL' : 'NORMAL',
      icon: '📉',
      details: 'Unmitigated outcome leads to 100% loss dumped at landfill penalty. FreshRoute intervention saves ₹4.82 Lakhs.',
    },
  ];

  const counterfactuals = [
    {
      id: 'DO_NOTHING',
      name: 'Baseline / Do Nothing',
      action: 'Hold course, standard schedule, no discounting or rerouting',
      delayHours: '+42h',
      spoilageKg: '14,000 kg (100%)',
      fulfillmentPercent: '0%',
      netRevenueInr: -28000,
      tempExposureC: '19.5°C (Excursion)',
      extraCostInr: '₹0',
      complianceTier: 'FAIL (Spoiled on Arrival)',
      uncertainty: '±2%',
      recommended: false,
    },
    {
      id: 'REROUTE_OPTIMIZED',
      name: 'FreshRoute Reroute & Mobile Hub Repair',
      action: 'Divert vessel to Kochi ICTT; dispatch mobile reefer technician; discount 12%',
      delayHours: '+8h',
      spoilageKg: '1,400 kg (10%)',
      fulfillmentPercent: '90%',
      netRevenueInr: 512000,
      tempExposureC: '13.2°C (Restored)',
      extraCostInr: '₹45,000 (Hub repair fee)',
      complianceTier: 'GREEN (Phyto Cleared)',
      uncertainty: '±6%',
      recommended: true,
    },
    {
      id: 'REDIRECT_NEARER',
      name: 'Emergency Redirect to Local Mandi',
      action: 'Unload immediately at JNPT; redirect to Vashi APMC with 25% discount',
      delayHours: '+3h',
      spoilageKg: '2,100 kg (15%)',
      fulfillmentPercent: '85%',
      netRevenueInr: 395000,
      tempExposureC: '15.0°C (Moderate)',
      extraCostInr: '₹18,000 (Local freight)',
      complianceTier: 'GREEN (Domestic Mandi)',
      uncertainty: '±8%',
      recommended: false,
    },
    {
      id: 'PROCESS_PULP',
      name: 'Secondary Industrial Processing',
      action: 'Transfer lot directly to Pune Fruit Processing Cluster for banana puree/chips',
      delayHours: '+6h',
      spoilageKg: '700 kg (5% trim loss)',
      fulfillmentPercent: '95% (Processed)',
      netRevenueInr: 210000,
      tempExposureC: '18.0°C (Non-critical for puree)',
      extraCostInr: '₹22,000 (Processing transfer)',
      complianceTier: 'GREEN (Industrial Food Grade)',
      uncertainty: '±4%',
      recommended: false,
    },
    {
      id: 'DONATE_FOOD_BANK',
      name: 'Food Bank / Charitable Donation',
      action: 'Expedited release to Akshaya Patra cold hub; QA release step required',
      delayHours: '+4h',
      spoilageKg: '1,100 kg (8%)',
      fulfillmentPercent: '92% (Charity)',
      netRevenueInr: 168000, // Social value
      tempExposureC: '14.0°C (Chilled)',
      extraCostInr: '₹12,000 (NGO logistics subsidy)',
      complianceTier: 'AMBER (Requires QA Clearance)',
      uncertainty: '±5%',
      recommended: false,
    },
    {
      id: 'COMPOST_BIOGAS',
      name: 'Biogas Anaerobic Digestion',
      action: 'Municipal biomethanation plant conversion to CNG and organic compost',
      delayHours: '+1h',
      spoilageKg: '14,000 kg (Full conversion)',
      fulfillmentPercent: '0% (Non-food)',
      netRevenueInr: 28000, // ₹2/kg salvage
      tempExposureC: 'Uncontrolled',
      extraCostInr: '₹4,000 (Tipping fee)',
      complianceTier: 'GREEN (Organic Waste)',
      uncertainty: '±1%',
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">🕸️</span>
              Produce Resilience Impact Graph
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic propagation modeling from infrastructure shock to physiological batch decay and market loss.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs">
            <span className="text-slate-400">Current Context:</span>
            <span className="font-semibold text-sky-400">{scenarioName}</span>
          </div>
        </div>

        {/* 9-Node Cascading Path */}
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="flex items-center gap-3 min-w-[1000px]">
            {nodes.map((node, i) => {
              const isSelected = selectedNode === node.id;
              const isCritical = node.tier === 'CRITICAL';
              const isHigh = node.tier === 'HIGH';

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNode(node.id)}
                    className={`cursor-pointer flex-1 p-3 rounded-lg border transition-all text-left relative ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/60 shadow-lg scale-105'
                        : isCritical
                        ? 'border-rose-600/70 bg-rose-950/30 hover:border-rose-400'
                        : isHigh
                        ? 'border-amber-600/70 bg-amber-950/30 hover:border-amber-400'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-base mb-1">
                      <span>{node.icon}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {node.tier}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{node.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{node.sub}</div>
                  </div>
                  {i < nodes.length - 1 && (
                    <div className="text-slate-600 font-bold text-sm shrink-0">➔</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Node Detail Drawer */}
        {selectedNode && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-4 text-xs">
            <div className="text-2xl">
              {nodes.find((n) => n.id === selectedNode)?.icon}
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-200">
                {nodes.find((n) => n.id === selectedNode)?.label}:{' '}
                <span className="text-sky-400">{nodes.find((n) => n.id === selectedNode)?.sub}</span>
              </div>
              <p className="text-slate-400 mt-1">
                {nodes.find((n) => n.id === selectedNode)?.details}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Counterfactual Scenario Analysis Matrix */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⚖️</span> Counterfactual Scenario Analysis Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic comparison of 6 operational interventions against the same disruption shock.
            </p>
          </div>
          <span className="text-xs bg-sky-950 border border-sky-800 text-sky-300 px-3 py-1 rounded-full font-medium">
            Strict Separation: Predict with ML, Govern with Rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70">
                <th className="py-2.5 px-3">Intervention Option</th>
                <th className="py-2.5 px-3">Action Description</th>
                <th className="py-2.5 px-3">Transit Delay</th>
                <th className="py-2.5 px-3">Est. Spoilage</th>
                <th className="py-2.5 px-3">Fulfillment</th>
                <th className="py-2.5 px-3 text-right">Net Revenue</th>
                <th className="py-2.5 px-3">Temp Exposure</th>
                <th className="py-2.5 px-3">Compliance Tier</th>
                <th className="py-2.5 px-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {counterfactuals.map((cf) => {
                const isRec = cf.recommended;
                return (
                  <tr
                    key={cf.id}
                    className={`transition ${
                      isRec
                        ? 'bg-sky-950/30 hover:bg-sky-950/50 font-medium'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      {isRec && <span className="text-sky-400 text-sm">★</span>}
                      {cf.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-[220px]">{cf.action}</td>
                    <td className="py-3 px-3 text-slate-300">{cf.delayHours}</td>
                    <td className="py-3 px-3 text-rose-400">{cf.spoilageKg}</td>
                    <td className="py-3 px-3 text-slate-300">{cf.fulfillmentPercent}</td>
                    <td
                      className={`py-3 px-3 text-right font-bold ${
                        cf.netRevenueInr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ₹{cf.netRevenueInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{cf.tempExposureC}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          cf.complianceTier.includes('GREEN')
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : cf.complianceTier.includes('AMBER')
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {cf.complianceTier}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isRec ? (
                        <span className="px-2.5 py-1 bg-sky-500 text-white rounded text-[10px] font-bold shadow-sm">
                          CHOSEN PLAN
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Sub-optimal</span>
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
