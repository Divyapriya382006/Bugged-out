/**
 * FreshRoute Assumptions, Limitations & Scientific Transparency Panel
 * Explicit, honest disclosures on synthetic data, physiological models, and boundaries.
 */

import React from 'react';

export const LimitationsView: React.FC = () => {
  const disclosures = [
    {
      title: '1. Synthetic Seeded Datasets & MoFPI Study Context',
      text: 'All batch lots, Mandi demand curves, and wholesale price quotes are synthetic, deterministic representations calibrated to authentic Indian horticultural geography (e.g., Nashik onion, Himachal apple, Kolar tomato). Ministry of Food Processing Industries (MoFPI) post-harvest loss statistics are included strictly for macro contextual understanding, NOT as batch-level biological shelf-life data.',
    },
    {
      title: '2. Simplified & Disclosed Physiological Decay Model',
      text: 'Shelf-life degradation follows a deterministic Q10 Arrhenius-like physiological equation (decay multiplier per +5°C above band) combined with chilling injury rules for tropical produce. While grounded in post-harvest science, actual commercial respiration rates depend on cultivar maturity, field heat removal, and atmospheric gas fractions.',
    },
    {
      title: '3. Versioned Cached Regulatory & Maritime Advisories',
      text: 'No live tariff, phytosanitary MRL, or maritime security (UKMTO/IMB) APIs are accessed directly. All regulatory tables and cyclone tracks operate via versioned, timestamped local cached adapters to ensure 100% deterministic, offline execution.',
    },
    {
      title: '4. Simulated Edge Satcom & In-Browser WebCrypto',
      text: 'Satellite telemetry, latency degradation, and packet drops are simulated within the browser. However, all cryptographic functions — HMAC-SHA256 signatures, AES-GCM payload encryption, and SHA-256 hash chains — are executed with genuine, high-grade WebCrypto browser APIs.',
    },
    {
      title: '5. Tamper-Evident Hash Chain vs. Blockchain',
      text: 'The audit log is an append-only, cryptographic hash chain (each block stores prevHash and an HMAC signature). It is intentionally NOT a decentralized blockchain or distributed ledger, avoiding unnecessary consensus overhead.',
    },
    {
      title: '6. AI Separation of Concerns & Zero Autonomous Safety Declarations',
      text: 'Generative AI (Amazon Bedrock / Gemini) is strictly limited to phrasing human-readable explanations of deterministic mathematical decisions. AI NEVER decides legality, food safety clearances, or allocation quantities. The QA disposition step (Release / Quarantine / Reject) is strictly human-gated.',
    },
    {
      title: '7. Scope & Scholarly Contribution',
      text: 'We make no claim that individual components (FEFO routing, reefer tracking, or discount models) have never existed. The core contribution is the unified, explainable, uncertainty-aware, offline-resilient architecture with cryptographic integrity and an empirically measured baseline benchmark.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">📜</span>
          Architectural Transparency & Limitations Disclosure
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Full disclosure of scientific assumptions, synthetic data scopes, and operational boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disclosures.map((d, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-slate-200">{d.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{d.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
