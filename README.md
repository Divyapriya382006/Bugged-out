# 🥬 FreshRoute

**AI-Agent Decision Support for Perishable Produce Distribution: Road, Sea and Offline-First Vessel Edge**

> PS 07: FreshRoute: Intelligent Decision Support for Perishable Produce Distribution
> Status: Hackathon prototype | Synthetic data | Planning and simulation focus
> Architecture lineage: adapted from *MedGuard* (pharma cold-chain resilience) to food

---

## Table of Contents

1. [One-Line Pitch](#1-one-line-pitch)
2. [Problem Statement](#2-problem-statement)
3. [What FreshRoute Does](#3-what-freshroute-does)
4. [PS 07 Compliance Matrix (for evaluators)](#4-ps-07-compliance-matrix-for-evaluators)
5. [Quick Start](#5-quick-start)
6. [5-Minute Evaluator Walkthrough](#6-5-minute-evaluator-walkthrough)
7. [Architecture](#7-architecture)
8. [Feature Details](#8-feature-details)
9. [Economic Cost Model](#9-economic-cost-model)
10. [Baseline Definition](#10-baseline-definition)
11. [Dataset and Scenarios](#11-dataset-and-scenarios)
12. [Security and Cryptography](#12-security-and-cryptography)
13. [Roles and Access Control (RBAC)](#13-roles-and-access-control-rbac)
14.
15. [External Data Sources](#15-external-data-sources)
16. [Sanity Checks and Validation](#16-sanity-checks-and-validation)
17. [Project Structure](#17-project-structure)
18. [Tech Stack](#18-tech-stack)
19. [Limitations and Honest Claims](#19-limitations-and-honest-claims)
20. [Commercial Model](#20-commercial-model)
21. [Team](#21-team)

---

## 1. One-Line Pitch

FreshRoute connects batch-level shelf-life modelling, demand-aware allocation, discounting, value-recovery disposal, rerouting and cold-chain repair into a single **uncertainty-aware, explainable closed loop**. Cryptographically protected vessel-to-shore control keeps it working when the satellite link degrades or drops.

It does not just alert you that a disruption happened. It tells you **which batches will lose shelf life, which markets will go short, what to do about it, how confident the system is, and why.**

---

## 2. Problem Statement

India's Ministry of Food Processing Industries (MoFPI) has published a post-harvest loss study covering 54 commodities across 15 agro-climatic zones (reference period 2020–22). Fruits and vegetables show significant losses. Produce distributors must coordinate:

- inventory and estimated remaining shelf life
- destination demand
- transport time and cost
- market prices
- available capacity

Poor coordination causes **spoilage, unsold inventory, avoidable logistics cost and lost revenue.**

**Our task:** recommend *which batches to dispatch first*, *where to allocate them*, and *when discounting is appropriate*, produce an **explainable distribution plan**, and **compare it against a defined baseline** on spoilage, demand fulfillment and net revenue.

> Note: MoFPI figures are context only. They are not batch-level shelf-life data, and we do not treat them as such.

---

## 3. What FreshRoute Does

| Capability | Summary |
|---|---|
| **Dispatch prioritisation** | Lowest-slack-first (FEFO-style) ranking weighted by value at risk and perishability |
| **Allocation** | Splits batches across destinations under demand, price, transport time and cost, capacity and shelf-life feasibility |
| **Discounting** | Rule-based, tiered, disclosed discounts with elasticity-based uplift and timing (when and how much) |
| **Disposal and value recovery** | Hierarchy: fresh → discount → redirect → process → donate → feed → compost/biogas → landfill |
| **Baseline comparison** | Same simulator, same cost model, side-by-side KPIs |
| **Explainability** | Per-assignment "Why" panel, runner-up alternatives, rejected options with reasons |
| **Uncertainty** | Monte-Carlo (500 runs) with P10/P50/P90 and per-assignment robustness |
| **Replanning** | Disruption simulator with instant replan and a diff view |
| **Impact Graph** | Disruption → infrastructure → lane → vessel → batch → shelf life → stock → unmet demand |
| **Counterfactuals** | Do nothing / reroute / redirect / discount locally / repair / dispose, compared side by side |
| **Sea-vessel offline-first comms** | Vessel edge ↔ shore control over a simulated satellite link with adaptive bandwidth use |
| **Cryptographic integrity** | HMAC-signed messages and commands, AES-GCM encrypted location, SHA-256 hash-chained audit log |
| **Cold-chain repair hubs** | Fixed and mobile repair units, hub cold-storage transfer, repair rendezvous at sea/port |
| **Five agents + controller** | Agent architecture on one shared World State, with a deterministic autonomy controller |
| **Human-in-the-loop** | LOW / MEDIUM / HIGH review with shelf-life-tied deadlines and auto-escalation |
| **RBAC** | 9 roles with role-scoped *data visibility*, not just action rights |
| **-target architecture** | Adapter layer (MOCK | ), service mapping, CDK/Terraform reference skeleton |

---

## 4. PS 07 Compliance Matrix (for evaluators)

### 4.1 Mandatory MVP

| PS 07 Requirement | Status | Where to see it |
|---|---|---|
| Represent inventory batches by commodity, quantity, estimated remaining shelf life | ✅ | **Inventory** tab |
| Allocate stock across destinations using demand, prices, transport time/cost, capacity | ✅ | **Plan** tab |
| Prioritise dispatches by perishability and feasibility (arrival + handling fit within remaining shelf life) | ✅ | **Plan** tab (priority score, feasibility column) and **Explain** tab |
| Recommend discounts for at-risk batches using disclosed rules | ✅ | **Plan** tab (discount column) and **Assumptions** tab (rules) |
| Compare against a baseline: spoilage, demand fulfillment, net revenue after dataset-defined costs | ✅ | **Baseline vs FreshRoute** tab |
| Generate an **explainable** distribution plan | ✅ | **Explain** tab |

### 4.2 Optional Extensions

| PS 07 Extension | Status | Where to see it |
|---|---|---|
| Forecast destination demand (history, seasonality, events) | ✅ | **Uncertainty** tab (baseline forecaster with interval) |
| Optimise discount timing / price reduction under uncertainty | ✅ | **Plan** and **Uncertainty** tabs |
| Replan on route disruption, capacity change, new orders | ✅ | **Disruptions / Replan** tab |
| Uncertainty ranges for shelf life, travel time, demand, with explanation of plan impact | ✅ | **Uncertainty** tab |
| Simulated temperature readings | ✅ (labelled SIMULATED) | **Vessel & Shore** and **Hubs & Repair** tabs |
| Live market-price feeds | ⚪ Optional | Adapter present, mock by default |

### 4.3 Data and Feasibility Expectations

| Expectation | How we meet it |
|---|---|
| Synthetic or anonymised dataset | Seeded, deterministic synthetic dataset; JSON upload for organizer data |
| Documented baseline | Section 10 and the in-app **Assumptions** tab |
| Consistent economic cost model | Section 9: one model, used by both plan and baseline |
| Hidden scenarios | **Load scenario** dropdown plus JSON upload; schema documented in-app |
| One-day MVP focuses on planning and simulation | Yes. No real distributor integration |

### 4.4 Additions Beyond the Problem Statement

- Proper **disposal / value-recovery** engine
- **Cold-chain infrastructure hubs** with repair dispatch
- **Sea routing with offline-first vessel edge** and shore control commands
- **Cryptographic** protection of location and commands, plus a tamper-evident audit chain
- **-target** architecture mapping
- Cyber-silence detection treated as a disruption event

---

## 5. Quick Start

```bash
# 1. Install
npm install

# 2. Run
npm run dev

# 3. Open
http://localhost:3000
```

- **No backend. No API keys required.** All external services and  services run behind adapters with deterministic in-browser mocks.
- Default scenario (**Normal**) loads on startup.
- *(Optional)* To enable natural-language explanations via Gemini, set `VITE_GEMINI_API_KEY` in `.env`. Without it, template-based explanations are used. The LLM never computes allocations, prices, feasibility or legality.
- *(Optional)* Adapter mode in `config.ts`: `ADAPTER_MODE = "MOCK" | ""`. Default is `MOCK`.

---

## 6. 5-Minute Evaluator Walkthrough

| Min | Action | What it proves |
|---|---|---|
| 0:00 | Open app → **Overview** | KPI dashboard on the Normal scenario |
| 0:45 | **Inventory** → **Plan** | Batches ranked by slack; allocation with feasibility, discount and risk flags |
| 1:30 | **Baseline vs FreshRoute** | Spoilage, fulfillment and net revenue vs baseline, with % improvement and net revenue waterfall |
| 2:00 | **Explain** → click any assignment | Why this batch first, why this market vs the next two, why this discount, binding constraint, rejected options |
| 2:30 | **Disposal** | Value recovery by route (kg and ₹) for stock that can't be sold fresh |
| 3:00 | Switch scenario to **Cyclone + port closure + reefer failure** | Instant replan, diff view and Impact Graph highlighting the propagation path |
| 3:45 | **Vessel & Shore Control** → **Kill link** | Vessel keeps monitoring offline; the event queue grows; restore → sync → reconcile → replan |
| 4:15 | **Attacker** button | Forged data, forged command, replayed command and edited audit entry are all visibly rejected |
| 4:45 | Switch role (Market Coordinator) | Same data, but GPS hidden, which proves RBAC data scoping |
| 5:00 | **Uncertainty** tab | P10/P50/P90 and robustness badges |

---

## 7. Architecture

### 7.1 Design Formula

```
FIVE AGENTS + SHARED WORLD STATE + PRODUCE RESILIENCE IMPACT GRAPH
+ PREDICTION WITH UNCERTAINTY + COUNTERFACTUAL SCENARIOS
+ DETERMINISTIC CONTROLS + HUMAN APPROVAL
+ OFFLINE VESSEL EDGE + CRYPTOGRAPHIC INTEGRITY + CONTINUOUS REPLANNING
```

### 7.2 The Five Agents

All agents read and write **one shared World State**. There are no per-agent states. Every other capability (ML, drift, optimisation, disposal, repair, etc.) is a **module inside** one of these agents, never a sixth agent.

| # | Agent | Responsibility |
|---|---|---|
| 1 | **Disruption Sensing** | Ingests weather, disasters, port congestion, maritime-security advisories, tariff changes and geopolitical events. Validates source and recency, requires corroboration, scores confidence and severity, maps to lanes, ports and vessels. Treats a cyber-silent or implausible data feed as a disruption. |
| 2 | **Cold-Chain Monitoring** | Batch-level temperature, humidity and gas (ethylene/CO₂) with GPS across reefer trucks, vessel containers and hubs. Deterministic threshold + duration excursion detection. Separates *equipment faults* from *product excursions*. Works offline. |
| 3 | **Scenario Planning (core)** | Prediction with uncertainty, drift detection, Impact Graph traversal, counterfactual scenarios, cascading impact, ranking, disposal and discount planning. |
| 4 | **Rerouting & Logistics** | Candidate routes, ETA, cost, temperature exposure, shelf-life fit, capacity and compliance scoring. Generates signed vessel control commands. |
| 5 | **Compliance & Audit** | Tariff, phytosanitary, sanctions and permit checks (cache-first, versioned). Permit workflow. Signature verification. Tamper-evident audit chain. |

### 7.3 Autonomy / Confidence Controller (deterministic module, not an agent)

- **Inputs:** event confidence, prediction uncertainty, model drift, impact severity (value at risk), action risk, regulatory status, commodity criticality
- **Output:** `LOW` → auto-execute within guardrails | `MEDIUM` → one-click confirm | `HIGH` → named authorised approver
- **Principle:** autonomy *decreases* as uncertainty, drift or impact rises. The system never blindly auto-executes.
- **Event confidence** ("does the disruption exist?") and **prediction uncertainty** ("what happens next?") are shown **separately** everywhere.

### 7.4 Separation of Concerns

| Concern | Handled by |
|---|---|
| Numerical prediction (ETA, decay, demand, sell-through, spoilage risk) | Statistical / lightweight ML models with intervals |
| Shelf-life feasibility, temperature safety, legality, approval thresholds | **Deterministic rules** |
| Quality disposition (RELEASE / QUARANTINE / REJECT) | **Human** approval, logged |
| Natural-language explanations | Optional GenAI (Gemini), phrasing only |

> The LLM **never** computes allocations, prices, feasibility or legality, and never declares food safe or unsafe.

### 7.5 Closed Loop

```
SENSE → VERIFY → PREDICT → PROPAGATE → SIMULATE → COMPARE
→ COMPLY → APPROVE → ACT → OBSERVE → LEARN → REPLAN
```

Every stage reads and writes the shared World State, so any agent or auditor can reconstruct *why* a decision was made.

---

## 8. Feature Details

### 8.1 Batch Inventory
Batches carry commodity, quantity (kg), quality grade (A/B/C), remaining shelf life (h) with ±uncertainty, current location (farm hub / cold store / vessel container), FEFO rank and value at risk.

### 8.2 Shelf-Life and Feasibility Model (deterministic, disclosed)

```
arrival_RSL = current_RSL
            − Σ (leg_time × decay_factor(temperature, mode, reefer))
            − handling_loss_hours
            − port / customs dwell

FEASIBLE  ⇔  arrival_RSL ≥ destination_min_RSL × (1 + safety_buffer)
```

- Safety buffer default: 10% (adjustable)
- A 48–72 h buffer is applied on long sea/border legs
- Temperature excursions multiply the decay factor
- Reefers reduce decay; chilling-sensitive commodities (e.g. banana) have their own bands
- Every candidate assignment shows its feasibility result. Infeasible ones are listed as **rejected options** with a reason, e.g. *"arrives with 9 h RSL < 14 h required"*.

### 8.3 Dispatch Prioritisation
Priority is the lowest **slack** (remaining shelf life versus best-case transit time), weighted by value at risk and perishability class. This gives FEFO-style ordering and makes feasibility part of the ranking.

### 8.4 Allocation
Splits of each batch go to destinations to **maximise expected net revenue**, subject to:
- destination demand and receiving capacity
- vehicle / vessel / container capacity
- shelf-life feasibility
- lane availability
- tariffs (export)

### 8.5 Discount Engine (rule-based, tiered, disclosed)
- **Trigger:** projected arrival RSL below threshold, or projected sell-through at current price below target
- **Amount:** tiered discount % with a **floor price ≥ marginal cost**
- **Effect:** demand uplift estimated through price elasticity
- **Output:** expected revenue *with vs without* discount, plus **timing**: *dispatch now*, or *discount at destination after X hours*
- All thresholds and tiers are visible in the **Assumptions** tab

### 8.6 Disposal and Value-Recovery Engine
For stock that cannot be sold fresh at an acceptable margin, a deterministic hierarchy selects the best *feasible* route and shows value recovered per option:

```
1. Sell fresh at full price
2. Discount sale
3. Redirect to nearer / alternate market
4. Secondary processing (pulp, puree, juice, dehydration, pickle)
5. Food bank / donation (grade B/C, food-safety conditions)
6. Animal feed
7. Composting / biogas
8. Landfill (last resort, with disposal cost)
```

- **Quality gate:** units with a confirmed unsafe condition (excursion beyond the disclosed rejection rule, visible mould, etc.) are routed **only** to non-food routes after a **human QA disposition** (`RELEASE` / `QUARANTINE` / `REJECT`).
- The system never autonomously declares food safe or unsafe.
- Disposal outcomes (kg and ₹ by route) feed KPIs. **Baseline = all unsold stock landfilled.**

### 8.7 Explainability (per assignment)
- **Why this batch first**: slack, value at risk, perishability
- **Why this destination**: compared with the **next 2 best alternatives**, with numbers
- **Why this discount** (or none)
- **Binding constraint**: demand, capacity, feasibility or tariff
- **Rejected options**: with reasons
- Optional Gemini phrasing of already-computed results; template fallback otherwise

### 8.8 Uncertainty (Monte-Carlo, 500 runs)
Samples shelf life, travel time and demand ranges.
- **P10 / P50 / P90** for net revenue and spoilage
- **Robustness badge** per assignment: probability the batch still arrives feasible
- Explains plan changes, e.g. *"reefer chosen because P(infeasible) dropped from 38% to 6%"*
- Drift detection: when live conditions fall outside the "training" range, scenario exploration widens and autonomy is reduced

### 8.9 Demand Forecast
Seasonality-aware moving-average forecaster with day-of-week and festival multipliers and a prediction interval. Labelled a *baseline forecaster*.

### 8.10 Disruption Simulator and Replanning
Trigger: lane/port closure, capacity cut, new urgent order, heatwave, tariff change, reefer failure, comms blackout, cyber-silent supplier.
- Plan recomputes instantly
- **Diff view** shows what changed and why
- **Produce Resilience Impact Graph**: node-link diagram with the affected path and severities highlighted

```
Disruption → Infrastructure → Lane → Shipment/Vessel → Batch
→ Remaining Shelf Life → Destination Stock → Demand
→ Market Availability → Spoilage / Unmet-Demand Impact
```

### 8.11 Counterfactual Scenario Comparison
For a selected disruption, compare side by side:

| Option | Compared on |
|---|---|
| Do nothing | delay, spoilage, fulfillment, net revenue, temperature exposure, cost, compliance, uncertainty |
| Reroute | (same columns) |
| Redirect to nearer market | |
| Discount and sell locally | |
| Reefer upgrade / repair dispatch | |
| Process or dispose | |

> Terminology: *counterfactual / intervention-aware scenario analysis*. We make no causal-inference claims.

### 8.12 Routing and Compliance Gate
- **Mode branch:** international/long leg is **AIR** (shelf life critical or high-value) *or* **SEA** (reefer container). **ROAD is always the last mile.** Modes are not chained unnecessarily.
- **Compliance gate** (single linear flow):
  - 🔴 **RED**: rejected immediately, never silently routed
  - 🟡 **AMBER**: permit workflow `REQUESTED → PENDING → APPROVED/REJECTED` with a deadline
  - 🟢 **GREEN**: proceeds
  - Permit not granted by deadline → next candidate; none left → escalate to named human
- **Static corridor/port-friction table** (clearly labelled static, since no live wait-time API is assumed)

### 8.13 Cold-Chain Infrastructure and Repair Hubs
- Network of **cold-storage hubs** and **repair hubs** (fixed + mobile) at ports and road corridors
- Each hub has capacity, location, response time, spare-part stock and cold-storage transfer capacity
- When the Cold-Chain Agent detects an **equipment fault** (not a product excursion), Scenario Planning adds:
  - **Remote / mobile repair dispatch**
  - **Transfer to hub cold storage**
  - **Repair rendezvous** at the nearest port (vessels)
- Compared alongside WAIT / REROUTE / TRANSFER / EXPEDITE / ALTERNATE SUPPLIER / SELL LOCALLY / DISPOSE
- Hub network diagram in the **Hubs & Repair** tab

### 8.14 Temperature-Banded Fallback Ladder
There is no one-size-fits-all fallback. Options are tagged by temperature band and checked against availability and remaining preservation time:

| Band | Default | Escalating fallbacks |
|---|---|---|
| Chilled / standard | Active reefer + passive PCM/insulated layer | VIP panels → thermal blankets |
| Frozen / ultra-cold (e.g. frozen pulp) | Active freezer + passive layer | Dry ice → ULT backup |

⚠️ The system warns that dry ice on chilling-sensitive produce can cause freeze damage.

### 8.15 Sea-Vessel Offline-First Communication (Vessel Edge ↔ Shore)

**Link simulator:** `CONNECTED` / `DEGRADED` (latency, packet loss, bandwidth cap) / `BLACKOUT`, with sliders and a **Kill link** button.

**Vessel edge node** (works with no shore contact):
- Local state store, local rule engine, lightweight local model
- Reefer temperature monitoring and deterministic excursion detection
- Local alerts
- Store-and-forward event queue with priority tiers: **P0** critical alarms > **P1** position/cargo status > **P2** routine telemetry
- Safe-default behaviour when no valid command arrives: hold last valid course and setpoint, and apply pre-approved contingency rules

**Vessel → Shore message**
```json
{ "vessel_id": "...", "seq": 0, "timestamp": "...", "nonce": "...",
  "priority": "P0|P1|P2",
  "ciphertext": "<AES-GCM(position + cargo + reefer readings)>",
  "payload_hash": "<SHA-256>", "hmac": "<HMAC-SHA256>" }
```

**Shore control center** ingests telemetry, runs Agents 1–5 using weather, marine routing, tariff, port-congestion and security-advisory data, and sends **signed control commands**:

| Command | Purpose |
|---|---|
| `REROUTE` | New waypoints |
| `CHANGE_SPEED` | Fuel / ETA / reefer-load tradeoff |
| `DIVERT_TO_PORT` | Emergency or repair diversion |
| `SET_REEFER_SETPOINT` / CA gas setpoint | Preserve cargo |
| `SWITCH_TO_BACKUP_COOLING` | Equipment fault response |
| `SET_TELEMETRY_MODE` | Adaptive interval, exceptions-only, delta-compressed payloads |
| `REQUEST_REPAIR_RENDEZVOUS` | Mobile repair at port/sea |
| `STANDBY` | Hold |

**Command format**
```json
{ "command_id": "...", "vessel_id": "...", "seq": 0, "issued_at": "...",
  "expires_at": "...", "nonce": "...", "params": {}, "approver_id": "...",
  "hmac": "<HMAC-SHA256>" }
```

The vessel verifies signature, expiry, sequence, target ID and **safety envelope**. Invalid, expired or replayed commands are rejected and reported. HIGH-review commands require the named approver's recorded approval **before** signing.

**Bandwidth optimisation:** reporting frequency and payload size adapt to link state and cargo risk (more frequent when RSL is low or excursion risk is high, sparse when stable). The UI shows **bandwidth used vs a naive "send everything always" baseline**.

**Reconciliation on reconnect:** ordered sync → duplicate and conflict detection → state reconciliation (shore may be stale) → World State update → re-predict → replan. Before/after diff and metrics (event-loss rate, sync success).

### 8.16 Operating Modes

| Mode | State | Behaviour |
|---|---|---|
| **1: Connected** | Cloud + edge | Full agent workflow, live/cached data, GenAI explanations |
| **2: Network offline** (power on) | Edge only | Monitoring, rules, local model, queue, cached compliance, limited local scenario planning |
| **3: Emergency / degraded power** | Critical only | Temperature monitoring, alarms, safety rules, event log. Non-essential functions disabled |
| **Recovery** | | Sync → reconcile → World State → re-predict → replan |

> We do **not** claim the full AI system continues during emergency power.

### 8.17 Human-in-the-Loop with Timeout and Escalation

| Mode | Behaviour | Typical triggers |
|---|---|---|
| LOW | Auto-execute within guardrails | Low value at risk, low uncertainty, routine action |
| MEDIUM | One-click confirm | Moderate impact or uncertainty |
| HIGH | Named authorised approver, with a **deadline proportional to remaining shelf life** | High-value cargo, major reroute, regulatory uncertainty, high uncertainty/drift, quality disposition |

- Primary approver silent → **auto-escalate** to documented backup approver
- No response before the hard shelf-life cutoff → auto-execute the pre-documented **lowest-risk** option (never "do nothing")
- Every timeout and escalation is written to the audit chain
- Time-accelerated demo clock included

---

## 9. Economic Cost Model

One model, used identically for the plan **and** the baseline:

```
Net Revenue =  Σ (sold_kg × realised_price)               [discounts already included]
             − transport cost
             − handling cost
             − energy / reefer cost
             − tariff
             − spoilage loss          (spoiled_kg × procurement_cost)
             + salvage / disposal value
             − disposal cost
             − holding cost
             − repair / dispatch cost
```

---

## 10. Baseline Definition

| Aspect | Baseline | FreshRoute |
|---|---|---|
| Dispatch order | FIFO | Lowest-slack-first, value-weighted |
| Destination | Nearest / highest-demand market | Net-revenue-optimised allocation |
| Feasibility check | Vehicle capacity only | Full shelf-life, demand, capacity, tariff checks |
| Discounting | None | Tiered, rule-based |
| Unsold stock | Landfilled | Value-recovery hierarchy |
| Disruption response | None (original plan continues) | Replan, reroute, repair dispatch |
| Telemetry | Fixed interval | Adaptive |

Both run on the **same scenario through the same simulator**.

**Reported KPIs:** spoilage (kg, %), demand fulfillment %, gross revenue, transport + handling + tariff cost, disposal recovery, net revenue and % improvement, net revenue waterfall, satcom bandwidth used, security events detected.

---

## 11. Dataset and Scenarios

### 11.1 Synthetic Data (seeded, deterministic)

| Entity | Contents |
|---|---|
| Commodities (10) | tomato, onion, potato, banana, mango, spinach, cauliflower, grapes, apple, pomegranate: shelf life, ideal temperature band, decay multiplier, chilling/ethylene sensitivity, handling loss, procurement cost, base price, salvage per disposal route |
| Batches (30–50) | commodity, qty, grade, RSL ± uncertainty, location, FEFO rank, value at risk |
| Destinations (8–10 domestic + 2–3 export) | demand ± uncertainty, price, elasticity, receiving capacity, min arrival RSL, tariff |
| Infrastructure | Ports (Chennai, Tuticorin, Kochi, Mumbai/JNPT, Mundra, Visakhapatnam), airports, road corridors, static friction table |
| Lanes | mode, time ± uncertainty, cost, reefer availability, disruption status |
| Fleet | ambient truck, reefer truck, reefer container, vessel (waypoints, speed, satcom class) |
| Hubs | cold-storage hubs, fixed and mobile repair units |

### 11.2 Built-in Scenarios

1. **Normal**
2. **Heatwave**: faster shelf-life decay
3. **Cyclone + port closure + reefer failure at sea**
4. **Festival demand surge + tariff change + new urgent order**
5. **Vessel comms blackout + piracy advisory + cyber-silent supplier**

### 11.3 Loading Organizer / Hidden Scenarios
Use the **Load scenario** dropdown or **Upload JSON**. The schema is documented in the **Assumptions** tab. **Download scenario JSON** exports the current scenario in the same format.

---

## 12. Security and Cryptography

All cryptography uses the browser's **WebCrypto API**, implemented for real, not as a mock.

| Goal | Mechanism |
|---|---|
| **Integrity and authenticity** of vessel data and commands | HMAC-SHA256 with per-device keys |
| **Confidentiality** of location and cargo data | AES-GCM encryption |
| **Payload integrity check** | SHA-256 payload hash |
| **Replay protection** | Monotonic sequence numbers, timestamp window, nonce uniqueness, command expiry |
| **Tamper-evident audit** | Append-only hash chain: each entry contains the hash of the previous one |
| **Plausibility / cyber signal** | Speed and teleport checks on reported position |
| **Human access** | JWT-style role claims plus RBAC (simulated login) |
| **Transport** | TLS assumed in transit (documented) |

> **Why not "just hash the location"?** A hash proves a message was not altered, but it cannot hide the data, and shore needs to read it. We therefore use **encryption for confidentiality, HMAC for integrity and authenticity, and hash chaining for the log**.

### 12.1 Attacker Demo (in-app)
The **Attacker** button runs four attacks, each visibly detected and rejected with a stated reason:

| Attack | Expected outcome |
|---|---|
| Alter a vessel position payload | HMAC/hash mismatch → rejected, security event logged, vessel data marked STALE |
| Forge a reroute command | Invalid signature → vessel rejects and reports |
| Replay an old command | Sequence/nonce/expiry check → rejected |
| Modify a past audit entry | **Verify chain** highlights the first broken link |

### 12.2 Production Notes
Production would use  IoT Core X.509 device certificates and KMS-managed keys instead of demo-provisioned shared secrets.

---

## 13. Roles and Access Control (RBAC)

Roles are scoped on **what you can see**, not just what you can do. Use the in-app **role switcher** to verify live.

| # | Role | Access |
|---|---|---|
| 1 | Logistics Planner | Dashboard, scenarios, live GPS. Approves MEDIUM actions |
| 2 | Compliance Officer | Compliance and audit module. Approves regulatory AMBER items |
| 3 | Named Senior Approver | HIGH-risk approvals only |
| 4 | Warehouse / Inventory Manager | Inventory view. Approves transfers within their facility |
| 5 | Supplier / Farmer-Producer (external) | Own capacity and dispatch data only |
| 6 | Carrier / Vessel Operator (external) | Own shipment and GPS data only |
| 7 | Market / Retailer Coordinator | Read-only availability and ETA. **No GPS** |
| 8 | System Administrator | Infrastructure and users only. Never business decisions |
| 9 | Auditor | Read-only, full audit log, no action rights |

---

## 14.  Target Architecture

> ⚠️ **Honest status: -target, mock-integrated. Nothing is deployed on  in this demo.** The code uses an adapter layer (`ADAPTER_MODE = MOCK | `) so the same interfaces can later call real services.

| Layer |  Service |
|---|---|
| Edge messaging | **IoT Core (MQTT)**: per-vessel topics, device certificates |
| Edge runtime | **IoT Greengrass**: local rules, local ML, offline queue |
| Ingestion | **Kinesis / SQS** |
| Event routing | **EventBridge** (disruption events) |
| Agent compute | **Lambda / ECS**: one function or service per agent |
| Orchestration | **Step Functions**: closed loop plus HITL timeout/escalation |
| Shared World State | **DynamoDB / Aurora** |
| Sensor time-series | **Timestream** |
| Audit anchors | **S3 with Object Lock** |
| Key management | **KMS**, **Secrets Manager** |
| Identity and access | **Cognito + IAM** (the 9 roles) |
| API layer | **API Gateway** (TLS) |
| Routing | **Amazon Location Service** / external routing APIs |
| ML | **SageMaker** (training/hosting) |
| Explanations | **Bedrock**: explanation and NL interaction **only** |
| Notifications | **SNS / SES** (approval requests) |
| Observability | **CloudWatch** |

Deliverables: the ** Architecture** tab, `docs/-architecture.md`, and a non-deployed CDK/Terraform skeleton (reference only).

---

## 15. External Data Sources

| Function | Source | Type |
|---|---|---|
| Weather and marine | Open-Meteo, NOAA/NWS, NASA EONET | Live API (free) |
| Disasters | GDACS, ReliefWeb/OCHA | Live API |
| Port congestion | IMF PortWatch, UN/LOCODE | Live API |
| Geopolitical | GDELT, ACLED | Live API |
| Sea routing | SeaRoutes-style adapter | API / mock |
| Air routing | AviationStack / FlightAware-style adapter | API / mock |
| Road routing | OSRM / OpenRouteService | API / mock |
| Maritime security | UKMTO, IMB advisories | **Scraped / cached** |
| Tariff announcements | Trade news, WTO / ITC rate tables | **Scraped / cached** + scheduled pull |
| Regulatory / phytosanitary | Cached, versioned datasets | **Cache-first** |
| Port/border friction | Static reference table | **Static** |

All scraped or cached data is **timestamped and labelled**. We do **not** claim live global regulatory or maritime-security coverage. In the default build, all sources run through deterministic mocks so the demo works offline.

---

## 16. Sanity Checks and Validation

Automatic checks are surfaced in the UI (**Assumptions & Audit** tab):

- ✅ No allocation exceeds demand or capacity
- ✅ No infeasible assignment is dispatched
- ✅ Hash chain verifies end to end
- ✅ Every forged, replayed or tampered message in the Attacker demo is rejected
- ✅ Baseline and FreshRoute use the same cost model
- ✅ Disposal quantities reconcile (sold + disposed + spoiled = total stock)

---

## 17. Project Structure

```
freshroute/
├── README.md
├── docs/
│   └── -architecture.md
├── infra/                    # CDK/Terraform reference skeleton (not deployed)
├── src/
│   ├── data.ts               # seeded dataset + scenarios + schema
│   ├── model.ts              # shelf-life, feasibility, decay
│   ├── optimizer.ts          # allocation + dispatch priority
│   ├── discount.ts           # discount engine
│   ├── disposal.ts           # value-recovery hierarchy
│   ├── simulator.ts          # shared simulator (plan + baseline)
│   ├── agents/               # 5 agents + autonomy controller
│   ├── crypto/               # HMAC, AES-GCM, hash chain, audit
│   ├── vessel/               # edge node, shore control, link simulator
│   ├── adapters/             # MOCK |  adapters, external APIs
│   ├── uncertainty/          # Monte-Carlo, forecast, drift
│   ├── rbac/                 # roles + data scoping
│   ├── config.ts
│   └── components/           # UI tabs
└── package.json
```

---

## 18. Tech Stack

| Layer | Technology |
|---|---|
| UI | React, TypeScript, Tailwind CSS, Recharts |
| Logic | Client-side TypeScript (no backend required) |
| Cryptography | WebCrypto API (HMAC-SHA256, AES-GCM, SHA-256) |
| Optimisation | Greedy + priority queue with local improvement / small flow model |
| Uncertainty | Monte-Carlo, quantile/conformal-style intervals (lightweight) |
| Explanations | Template engine; optional Gemini |
| Target cloud |  (adapter-based, mock-integrated) |

---

## 19. Limitations and Honest Claims

- Prototype on **synthetic data**. MoFPI loss figures are context only, not batch-level shelf-life data.
- Shelf-life, demand and price models are **simplified and disclosed**.
- **No live** regulatory, tariff or maritime-security API is claimed. These are scraped/cached and timestamped.
- The audit log is a **tamper-evident hash chain, not a blockchain**.
- Statistical models are lightweight and illustrative.
- AI/LLM **never** decides legality, food safety or allocation.
- Food-quality disposition is **human-gated**.
- Offline and emergency modes have **reduced capability**. Emergency power preserves only critical functions.
- We do **not** claim that no similar tool exists. The contribution is the **integrated, explainable, uncertainty-aware, offline-resilient planner with a measured baseline comparison.**

---

## 20. Commercial Model

Subscription and licensed supply-chain optimisation software for:
- produce distributors and wholesalers
- food logistics companies
- cold-storage operators
- agricultural supply-chain platforms
- reefer-shipping and export-oriented produce traders

Revenue levers: per-seat subscriptions, per-shipment/vessel tiers, cold-chain hub network add-ons, and compliance-data modules.

**Acknowledgements:** Architecture adapted from the *MedGuard* pharmaceutical cold-chain resilience project.
