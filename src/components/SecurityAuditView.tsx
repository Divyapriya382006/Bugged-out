/**
 * FreshRoute Security, Cryptographic Audit Chain & 9-Role RBAC
 * Real WebCrypto SHA-256 hash chain verification, Attacker tamper demo,
 * and live role-scoped data visibility.
 */

import React, { useEffect, useState } from 'react';
import { auditLog } from '../services/cryptoEngine';
import { vesselSimulator } from '../services/vesselShoreSimulator';
import { AuditBlock, UserRole } from '../types';

interface SecurityAuditViewProps {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ currentRole, onRoleChange }) => {
  const [chain, setChain] = useState<AuditBlock[]>([]);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenIndex: number | null;
    reason: string | null;
    totalBlocksChecked: number;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Attacker Demo state
  const [attackLogs, setAttackLogs] = useState<Array<{ id: string; title: string; result: string; blocked: boolean; timestamp: string }>>([]);

  const roles: Array<{ role: UserRole; label: string; permissionsDesc: string }> = [
    { role: 'LOGISTICS_PLANNER', label: '1. Logistics Planner', permissionsDesc: 'Full planning, dispatch routing, discount override, candidate simulation' },
    { role: 'COMPLIANCE_OFFICER', label: '2. Compliance Officer', permissionsDesc: 'QA human disposition (Release/Quarantine/Reject), phytosanitary permits, sanctions' },
    { role: 'SENIOR_APPROVER', label: '3. Named Senior Approver', permissionsDesc: 'Mandatory signoff on HIGH autonomy allocations (>₹10 Lakhs, export routes)' },
    { role: 'WAREHOUSE_MANAGER', label: '4. Warehouse / Cold Hub Mgr', permissionsDesc: 'Inventory intake, packhouse FEFO management, pre-cooling logs' },
    { role: 'FARMER_SUPPLIER', label: '5. Farmer / FPO Supplier', permissionsDesc: 'Scoped DATA visibility: Own harvest lots and payout rates only' },
    { role: 'CARRIER_OPERATOR', label: '6. Carrier / Vessel Operator', permissionsDesc: 'Scoped DATA visibility: Own vessel/truck telemetry, GPS, and speed commands only' },
    { role: 'RETAILER_COORDINATOR', label: '7. Market / Retailer Coordinator', permissionsDesc: 'Scoped DATA visibility: Arrival ETA and produce availability ONLY (NO GPS tracking)' },
    { role: 'SYSTEM_ADMIN', label: '8. System Administrator', permissionsDesc: 'Infra adapters, AWS switch, key rotation (Cannot make business decisions)' },
    { role: 'AUDITOR', label: '9. Independent Auditor', permissionsDesc: 'Read-only full access to WebCrypto hash chain, signatures, and compliance logs' },
  ];

  const refreshChain = () => {
    setChain(auditLog.getChain());
  };

  useEffect(() => {
    refreshChain();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    const res = await auditLog.verifyIntegrity();
    setVerificationResult(res);
    setIsVerifying(false);
  };

  const runAttack = async (type: 'TAMPER_POSITION' | 'FORGE_COMMAND' | 'REPLAY_COMMAND' | 'BREAK_AUDIT') => {
    const res = await vesselSimulator.simulateAttack(type);
    setAttackLogs((prev) => [
      {
        id: `att_${Date.now()}`,
        title: res.title,
        result: res.result,
        blocked: res.blocked,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    refreshChain();
    // Re-verify if audit was broken
    if (type === 'BREAK_AUDIT') {
      await handleVerifyChain();
    }
  };

  const handleResetAudit = () => {
    auditLog.resetChain();
    refreshChain();
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Role Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">🛡️</span>
              Cryptographic Security, RBAC & Immutable Audit Chain
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real WebCrypto API HMAC-SHA256 signatures, AES-GCM confidentiality, and append-only hash chains.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow"
            >
              <span>{isVerifying ? '⏳' : '🔍'}</span>
              Verify WebCrypto Hash Chain
            </button>
            <button
              onClick={handleResetAudit}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Reset Chain
            </button>
          </div>
        </div>

        {/* Verification Result Banner */}
        {verificationResult && (
          <div
            className={`p-4 rounded-lg border text-xs mb-5 flex items-center justify-between ${
              verificationResult.isValid
                ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                : 'bg-rose-950/40 border-rose-600/70 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{verificationResult.isValid ? '✅' : '🚨'}</span>
              <div>
                <strong className="text-sm font-bold block">
                  {verificationResult.isValid ? 'Chain Integrity Intact' : 'TAMPER DETECTED IN AUDIT CHAIN'}
                </strong>
                <span>{verificationResult.reason}</span>
              </div>
            </div>
            <span className="font-mono text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {verificationResult.totalBlocksChecked} Blocks Verified
            </span>
          </div>
        )}

        {/* 9-Role RBAC Switcher */}
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Security Role (Simulating AWS Cognito JWT Claims & Data-Scoped Access):
            </span>
            <span className="text-xs text-sky-400 font-mono">Current: {currentRole}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {roles.map((r) => {
              const isActive = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => onRoleChange(r.role)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    isActive
                      ? 'border-sky-500 bg-sky-950/60 shadow-md'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-200">{r.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.permissionsDesc}</div>
                </button>
              );
            })}
          </div>

          {/* Scoped Data Visibility Proof */}
          <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
            <div className="text-slate-300">
              <strong className="text-slate-400">Scoped Data Visibility Rule:</strong>{' '}
              {currentRole === 'RETAILER_COORDINATOR' ? (
                <span className="text-amber-400 font-semibold">
                  ⚠️ GPS tracking and vessel coordinates REDACTED. Produce ETA & Available Mandi Volumes visible only.
                </span>
              ) : currentRole === 'FARMER_SUPPLIER' ? (
                <span className="text-sky-400 font-semibold">
                  🌿 Scoped to FPO farm packhouse lots only. External carrier/export costs redacted.
                </span>
              ) : currentRole === 'AUDITOR' ? (
                <span className="text-emerald-400 font-semibold">
                  📜 Read-only immutable access to full cryptographic audit chain & HMAC nonces.
                </span>
              ) : (
                <span className="text-slate-400">Full operational data scope enabled for {currentRole}.</span>
              )}
            </div>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
              Cognito Group: {currentRole}
            </span>
          </div>
        </div>
      </div>

      {/* Attacker Tamper Simulator Panel */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1 bg-rose-500/20 text-rose-400 rounded">🦹</span>
              Interactive Attacker & Tamper Demo
            </h3>
            <p className="text-xs text-slate-400">
              Trigger simulated malicious attack vectors to witness real WebCrypto cryptographic and plausibility rejection.
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            Hardware / In-Browser WebCrypto Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => runAttack('TAMPER_POSITION')}
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-rose-900/60 hover:border-rose-600 rounded-lg text-left text-xs transition"
          >
            <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
              <span>🛰️</span> 1. Corrupt Vessel Telemetry
            </div>
            <div className="text-[11px] text-slate-400">
              Flip bits in AES-GCM ciphertext in transit to test shore decryption authentication tag check.
            </div>
          </button>

          <button
            onClick={() => runAttack('FORGE_COMMAND')}
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-rose-900/60 hover:border-rose-600 rounded-lg text-left text-xs transition"
          >
            <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
              <span>🏴‍☠️</span> 2. Forge Shore Command
            </div>
            <div className="text-[11px] text-slate-400">
              Transmit unauthorized vessel diversion command with forged HMAC to test vessel key validation.
            </div>
          </button>

          <button
            onClick={() => runAttack('REPLAY_COMMAND')}
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-rose-900/60 hover:border-rose-600 rounded-lg text-left text-xs transition"
          >
            <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
              <span>🔄</span> 3. Replay Old Command
            </div>
            <div className="text-[11px] text-slate-400">
              Replay a valid previously-captured speed command to test sequence monotonicity & nonce uniqueness.
            </div>
          </button>

          <button
            onClick={() => runAttack('BREAK_AUDIT')}
            className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-rose-900/60 hover:border-rose-600 rounded-lg text-left text-xs transition"
          >
            <div className="font-bold text-rose-400 flex items-center gap-1.5 mb-1">
              <span>⛓️</span> 4. Mutate Past Audit Log
            </div>
            <div className="text-[11px] text-slate-400">
              Tamper with Block #1 summary to prove how the hash chain algorithm immediately detects corrupted records.
            </div>
          </button>
        </div>

        {/* Attack Execution Live Feed */}
        {attackLogs.length > 0 && (
          <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 max-h-48 overflow-y-auto space-y-2 text-xs">
            {attackLogs.map((log) => (
              <div key={log.id} className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-start justify-between">
                <div>
                  <span className="font-bold text-slate-200">{log.title}:</span>{' '}
                  <span className={log.blocked ? 'text-emerald-400' : 'text-rose-400'}>{log.result}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Append-Only Tamper-Evident Audit Log Hash Chain Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>⛓️</span> Append-Only Tamper-Evident Audit Log Chain ({chain.length} Blocks)
            </h3>
            <p className="text-xs text-slate-400">
              Every block anchors the SHA-256 hash of the preceding block with an HMAC-SHA256 signature.
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded font-mono">
            Genesis Anchor: 000000000000...
          </span>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/70 sticky top-0">
                <th className="py-2.5 px-3"># Block</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Actor / Role</th>
                <th className="py-2.5 px-3">Summary Description</th>
                <th className="py-2.5 px-3 font-mono">Previous Hash</th>
                <th className="py-2.5 px-3 font-mono">Block Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {chain.map((block) => {
                const isCorrupted = verificationResult?.brokenIndex === block.index;
                return (
                  <tr
                    key={block.index}
                    className={`transition ${
                      isCorrupted
                        ? 'bg-rose-950/60 text-rose-200 border-2 border-rose-500'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-sky-400">#{block.index}</td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap font-sans">
                      {block.timestamp.slice(11, 19)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 font-sans">{block.eventType}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      {block.actor} <span className="text-[10px] text-slate-500">({block.role})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans max-w-[280px] truncate" title={block.dataSummary}>
                      {block.dataSummary}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">{block.prevHash.slice(0, 10)}...</td>
                    <td className="py-2.5 px-3 text-emerald-400 text-[10px] font-bold">{block.hash.slice(0, 10)}...</td>
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
