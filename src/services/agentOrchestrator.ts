/**
 * FreshRoute Five Agents Orchestrator & Shared World State
 * Implements the MedGuard architectural pattern adapted for cold-chain & maritime produce resilience.
 * Exactly 5 agents writing to ONE unified World State.
 */

import { BUILT_IN_SCENARIOS, COMMODITIES, DESTINATIONS, INITIAL_BATCHES, INITIAL_LANES, PORTS_AND_HUBS } from '../data/syntheticDataset';
import {
  Batch,
  Destination,
  DisruptionEvent,
  InfrastructureHub,
  OperatingMode,
  PlanAllocation,
  ReviewLevel,
  TransportLane,
  UserRole,
} from '../types';
import { generateBaselinePlan, generateFreshRoutePlan } from './allocationEngine';
import { auditLog } from './cryptoEngine';
import { evaluateDisposalHierarchy } from './disposalEngine';
import { vesselSimulator } from './vesselShoreSimulator';

export interface WorldState {
  currentScenarioId: string;
  operatingMode: OperatingMode;
  simulationClockHours: number; // Accelerated demo clock (e.g. T+0h, T+4h)
  activeDisruptions: DisruptionEvent[];
  batches: Batch[];
  destinations: Destination[];
  lanes: TransportLane[];
  hubs: InfrastructureHub[];
  currentPlan: PlanAllocation[];
  activeApprovalRequests: Array<{
    id: string;
    batchId: string;
    actionDescription: string;
    primaryApprover: string;
    backupApprover: string;
    deadlineHoursFromNow: number;
    hardShelfLifeCutoffHours: number;
    assignedAutonomy: ReviewLevel;
    status: 'PENDING' | 'APPROVED' | 'ESCALATED' | 'TIMED_OUT_EXECUTED_SAFEST';
    lowestRiskSafeDefaultOption: string;
    createdAt: string;
  }>;
  agentHeartbeats: Record<string, { lastRun: string; status: 'ACTIVE' | 'OFFLINE' | 'DEGRADED'; telemetrySummary: string }>;
}

export interface AutonomyEvaluation {
  tier: ReviewLevel;
  eventConfidence: number;
  predictionUncertainty: number;
  distributionShiftDetected: boolean;
  actionRiskScore: number;
  rationale: string;
}

class AgentOrchestrator {
  private state: WorldState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = {
      currentScenarioId: 'SCENARIO_NORMAL',
      operatingMode: 'CONNECTED',
      simulationClockHours: 0,
      activeDisruptions: [],
      batches: JSON.parse(JSON.stringify(INITIAL_BATCHES)),
      destinations: JSON.parse(JSON.stringify(DESTINATIONS)),
      lanes: JSON.parse(JSON.stringify(INITIAL_LANES)),
      hubs: JSON.parse(JSON.stringify(PORTS_AND_HUBS)),
      currentPlan: [],
      activeApprovalRequests: [],
      agentHeartbeats: {
        'AGENT_1_DISRUPTION_SENSING': { lastRun: 'Live', status: 'ACTIVE', telemetrySummary: 'Ingesting IMD weather, GDACS, PortWatch, UKMTO advisories' },
        'AGENT_2_COLD_CHAIN_MONITORING': { lastRun: 'Live', status: 'ACTIVE', telemetrySummary: '12 reefer node streams active, 0 unhandled excursions' },
        'AGENT_3_SCENARIO_PLANNING': { lastRun: 'Live', status: 'ACTIVE', telemetrySummary: 'FEFO ranker & counterfactual impact graph evaluated' },
        'AGENT_4_REROUTING_LOGISTICS': { lastRun: 'Live', status: 'ACTIVE', telemetrySummary: 'Candidate multi-modal routes feasible' },
        'AGENT_5_COMPLIANCE_AUDIT': { lastRun: 'Live', status: 'ACTIVE', telemetrySummary: 'WebCrypto hash chain verified, tariff tables cached' },
      },
    };

    // Initial plan run
    this.runFullOrchestrationCycle();
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): WorldState {
    return this.state;
  }

  /**
   * Deterministic Autonomy Controller (Module, not an agent)
   * Evaluates Event Confidence, Prediction Uncertainty, Distribution Shift, Value at Risk, Commodity Criticality
   */
  public evaluateAutonomy(
    eventConfidence: number,
    predictionUncertainty: number,
    valueAtRiskInr: number,
    isExportOrLongLeg: boolean
  ): AutonomyEvaluation {
    const distributionShiftDetected = predictionUncertainty > 0.25;
    const actionRiskScore = (valueAtRiskInr / 2000000) * 0.5 + (1 - eventConfidence) * 0.3 + predictionUncertainty * 0.2;

    let tier: ReviewLevel = 'LOW';
    let rationale = 'Routine dispatch within defined guardrails. Automatic execution approved.';

    if (valueAtRiskInr > 1000000 || isExportOrLongLeg || distributionShiftDetected) {
      tier = 'HIGH';
      rationale = `High value at risk (₹${(valueAtRiskInr / 100000).toFixed(1)} Lakhs) or distribution shift detected. Mandatory Named Senior Approver signoff required.`;
    } else if (eventConfidence < 0.9 || predictionUncertainty > 0.15 || actionRiskScore > 0.35) {
      tier = 'MEDIUM';
      rationale = `Moderate event confidence (${(eventConfidence * 100).toFixed(0)}%) or transit uncertainty. Logistics Planner one-click confirmation required.`;
    }

    return {
      tier,
      eventConfidence,
      predictionUncertainty,
      distributionShiftDetected,
      actionRiskScore: Number(actionRiskScore.toFixed(2)),
      rationale,
    };
  }

  /**
   * Switch Active Operating Scenario
   */
  public async loadScenario(scenarioId: string) {
    const scenario = BUILT_IN_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    this.state.currentScenarioId = scenarioId;
    this.state.activeDisruptions = JSON.parse(JSON.stringify(scenario.disruptions));

    // Reset base batches and lanes
    this.state.batches = JSON.parse(JSON.stringify(INITIAL_BATCHES));
    this.state.lanes = JSON.parse(JSON.stringify(INITIAL_LANES));
    this.state.hubs = JSON.parse(JSON.stringify(PORTS_AND_HUBS));

    // Apply scenario effects to lanes/batches/ports
    if (scenarioId === 'SCENARIO_HEATWAVE') {
      // Degrade road transit RSL
      this.state.lanes.forEach((lane) => {
        if (lane.mode === 'ROAD') {
          lane.typicalDurationHours += 4;
          lane.status = 'DELAYED';
          lane.disruptionReason = 'Extreme pavement heat & speed limits';
        }
      });
    } else if (scenarioId === 'SCENARIO_CYCLONE_REEFER_SEA') {
      const tuticorin = this.state.hubs.find((h) => h.id === 'PORT_TUTICORIN');
      if (tuticorin) tuticorin.operationalStatus = 'CLOSED';
      const lane = this.state.lanes.find((l) => l.id === 'LANE_TUTICORIN_TO_COLOMBO_FEEDER');
      if (lane) {
        lane.status = 'BLOCKED';
        lane.disruptionReason = 'Port closed due to Cyclonic Storm Michaung-II';
      }
      // Reefer failure on vessel batch
      const seaBatch = this.state.batches.find((b) => b.batchId === 'BATCH_BAN_2026_01');
      if (seaBatch) {
        seaBatch.currentTempC = 19.5; // Severe excursion above 14C
        seaBatch.sensorAnomalyDetected = true;
      }
    } else if (scenarioId === 'SCENARIO_FESTIVAL_TARIFF_SURGE') {
      // Spike Delhi and Mumbai demand
      const delhi = this.state.destinations.find((d) => d.id === 'DEST_DELHI_AZADPUR');
      if (delhi) {
        Object.keys(delhi.demandKg).forEach((k) => {
          delhi.demandKg[k as keyof typeof delhi.demandKg] *= 1.4;
          delhi.pricePerKg[k as keyof typeof delhi.pricePerKg] *= 1.25;
        });
      }
      // Increase export tariff
      this.state.destinations.forEach((d) => {
        if (d.type === 'export_port') {
          d.tariffRatePercent += 15.0;
        }
      });
    } else if (scenarioId === 'SCENARIO_COMMS_BLACKOUT_PIRACY') {
      vesselSimulator.setLinkState('BLACKOUT');
      const supplierBatch = this.state.batches.find((b) => b.batchId === 'BATCH_TOM_2026_01');
      if (supplierBatch) {
        supplierBatch.sensorAnomalyDetected = true; // Stale cyber feed
      }
    }

    await auditLog.appendEntry(
      'SCENARIO_LOADED',
      'SYSTEM_ADMIN',
      'Scenario-Controller',
      `Loaded scenario: "${scenario.name}" with ${scenario.disruptions.length} active disruptions.`,
      { scenarioId, disruptionCount: scenario.disruptions.length }
    );

    this.runFullOrchestrationCycle();
  }

  /**
   * Set System Operating Mode (Connected, Network Offline, Emergency Power)
   */
  public setOperatingMode(mode: OperatingMode) {
    this.state.operatingMode = mode;
    if (mode === 'NETWORK_OFFLINE') {
      vesselSimulator.setLinkState('BLACKOUT');
      this.state.agentHeartbeats['AGENT_1_DISRUPTION_SENSING'].status = 'OFFLINE';
      this.state.agentHeartbeats['AGENT_3_SCENARIO_PLANNING'].telemetrySummary = 'Running edge-local rule fallback';
    } else if (mode === 'EMERGENCY_DEGRADED_POWER') {
      vesselSimulator.setLinkState('BLACKOUT');
      this.state.agentHeartbeats['AGENT_1_DISRUPTION_SENSING'].status = 'OFFLINE';
      this.state.agentHeartbeats['AGENT_3_SCENARIO_PLANNING'].status = 'OFFLINE';
      this.state.agentHeartbeats['AGENT_4_REROUTING_LOGISTICS'].status = 'OFFLINE';
      this.state.agentHeartbeats['AGENT_2_COLD_CHAIN_MONITORING'].telemetrySummary = 'Critical alarms & passive cooling monitor only';
    } else {
      vesselSimulator.setLinkState('CONNECTED');
      Object.keys(this.state.agentHeartbeats).forEach((k) => {
        this.state.agentHeartbeats[k].status = 'ACTIVE';
      });
    }
    this.notify();
  }

  /**
   * Run 5-Agent Pipeline
   */
  public runFullOrchestrationCycle() {
    // 1. Disruption Sensing updates lane & hub status
    this.state.activeDisruptions.forEach((d) => {
      d.affectedLanes.forEach((laneId) => {
        const lane = this.state.lanes.find((l) => l.id === laneId);
        if (lane && lane.status !== 'BLOCKED') {
          lane.status = d.severity === 'CRITICAL' ? 'BLOCKED' : 'DELAYED';
          lane.disruptionReason = d.title;
        }
      });
    });

    // 2. Cold Chain Monitoring tracks batch excursions and updates FEFO rank
    this.state.batches.forEach((b) => {
      const comm = COMMODITIES[b.commodity];
      if (b.currentTempC > comm.idealTempMax) {
        // Accelerate decay
        const excess = b.currentTempC - comm.idealTempMax;
        b.currentRslHours = Math.max(12, b.currentRslHours - excess * 2.5);
      }
    });

    // 3. Scenario Planning & Rerouting Agent generates allocations
    const { allocations } = generateFreshRoutePlan(this.state.batches, this.state.destinations, this.state.lanes);
    this.state.currentPlan = allocations;

    // 4. Update Approval Requests for HIGH review allocations
    this.updateApprovalRequests();

    this.notify();
  }

  /**
   * Human-in-the-Loop Deadline & Escalation logic
   * Deadline is PROPORTIONAL to batch remaining shelf life, never a fixed timer!
   */
  private updateApprovalRequests() {
    const highReviewAllocs = this.state.currentPlan.filter((a) => a.reviewLevel === 'HIGH');
    this.state.activeApprovalRequests = highReviewAllocs.map((alloc) => {
      const batch = this.state.batches.find((b) => b.batchId === alloc.batchId);
      const rsl = batch ? batch.currentRslHours : 48;
      // Proportional deadline: 10% of remaining shelf life (e.g., 48h RSL -> 4.8h deadline)
      const deadlineHours = Number(Math.max(1.5, Math.min(8, rsl * 0.1)).toFixed(1));

      return {
        id: `REQ_HITL_${alloc.batchId}`,
        batchId: alloc.batchId,
        actionDescription: `Approve dispatch of ${alloc.quantityKg}kg ${alloc.commodity} to ${alloc.destinationId} via ${alloc.mode} (Value ₹${(alloc.expectedNetRevenueInr).toLocaleString('en-IN')})`,
        primaryApprover: 'Dr. V. Menon (Chief Cold-Chain Logistics Officer)',
        backupApprover: 'P. Sharma (VP Operations & Risk)',
        deadlineHoursFromNow: deadlineHours,
        hardShelfLifeCutoffHours: Number((rsl * 0.5).toFixed(1)),
        assignedAutonomy: alloc.reviewLevel,
        status: 'PENDING',
        lowestRiskSafeDefaultOption: 'Divert to nearest cold-storage repair hub (HUB_PUNE) for pre-cooling hold',
        createdAt: new Date().toLocaleTimeString(),
      };
    });
  }

  /**
   * Action from Named Approver
   */
  public async respondToApprovalRequest(requestId: string, approved: boolean, role: UserRole, approverName: string) {
    const req = this.state.activeApprovalRequests.find((r) => r.id === requestId);
    if (!req) return;

    req.status = approved ? 'APPROVED' : 'ESCALATED';

    await auditLog.appendEntry(
      approved ? 'HITL_APPROVAL_GRANTED' : 'HITL_APPROVAL_REJECTED',
      role,
      approverName,
      `Action on request ${requestId}: ${approved ? 'APPROVED' : 'REJECTED/ESCALATED'}`,
      { requestId, batchId: req.batchId, approved }
    );

    this.notify();
  }

  /**
   * Advance accelerated demo clock
   * Triggers escalation if deadline passed
   */
  public advanceClock(hours: number) {
    this.state.simulationClockHours += hours;

    this.state.activeApprovalRequests.forEach((req) => {
      if (req.status === 'PENDING') {
        req.deadlineHoursFromNow -= hours;
        if (req.deadlineHoursFromNow <= 0) {
          req.status = 'TIMED_OUT_EXECUTED_SAFEST';
          auditLog.appendEntry(
            'HITL_TIMEOUT_ESCALATION_EXECUTED',
            'SYSTEM_ADMIN',
            'HITL-Escalation-Daemon',
            `Timeout expired for request ${req.id}. Auto-executing lowest-risk safe default: "${req.lowestRiskSafeDefaultOption}".`,
            { requestId: req.id, action: req.lowestRiskSafeDefaultOption }
          );
        }
      }
    });

    this.notify();
  }
}

export const orchestrator = new AgentOrchestrator();
