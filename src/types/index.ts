/**
 * FreshRoute Core Data Types & Enums
 * Perishable produce cold-chain & maritime resilience architecture
 */

export type CommodityType =
  | 'tomato'
  | 'onion'
  | 'potato'
  | 'banana'
  | 'mango'
  | 'spinach'
  | 'cauliflower'
  | 'grapes'
  | 'apple'
  | 'pomegranate';

export interface CommodityConfig {
  id: CommodityType;
  name: string;
  hindiName: string;
  baseShelfLifeHours: number;
  idealTempMin: number; // °C
  idealTempMax: number; // °C
  decayPer5CAboveBand: number; // Multiplier per 5°C
  chillingSensitive: boolean;
  chillingThresholdTemp?: number; // Below this temp causes chilling injury
  ethyleneProducer: 'low' | 'medium' | 'high';
  ethyleneSensitive: boolean;
  handlingLossPercentPerTransfer: number;
  procurementCostPerKg: number; // ₹/kg
  baseMarketPricePerKg: number; // ₹/kg
  priceElasticity: number; // Demand elasticity (e.g., -1.2 means 10% discount -> 12% demand increase)
  salvageValues: {
    discountFloorPricePerKg: number;
    processingPricePerKg: number; // Pulp, puree, dehydrated
    donationSocialValuePerKg: number;
    animalFeedPricePerKg: number;
    compostBiogasPricePerKg: number;
    landfillCostPerKg: number; // Negative value (cost to dump)
  };
}

export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';

export interface Batch {
  batchId: string;
  commodity: CommodityType;
  quantityKg: number;
  qualityGrade: QualityGrade;
  currentLocationId: string;
  locationType: 'farm_packhouse' | 'cold_store_hub' | 'vessel_reefer' | 'in_transit_truck';
  harvestTime: string;
  currentRslHours: number; // Remaining shelf life
  uncertaintyHours: number; // ± hours
  valueAtRiskInr: number;
  fefoRank: number;
  tempHistory: Array<{ timestamp: string; tempC: number; rhPercent: number; co2Percent?: number }>;
  currentTempC: number;
  assignedContainerId?: string;
  carrierId?: string;
  sensorAnomalyDetected?: boolean;
}

export interface Destination {
  id: string;
  name: string;
  stateCountry: string;
  type: 'domestic_mandi' | 'export_port' | 'distribution_center';
  demandKg: Record<CommodityType, number>;
  demandUncertaintyPercent: number;
  pricePerKg: Record<CommodityType, number>;
  receivingCapacityKgPerDay: number;
  minRslOnArrivalHours: number;
  tariffRatePercent: number; // For export markets
  importComplianceTier: 'GREEN' | 'AMBER' | 'RED';
  coordinates: { lat: number; lng: number };
}

export interface InfrastructureHub {
  id: string;
  name: string;
  type: 'port' | 'cold_storage_hub' | 'repair_hub' | 'multimodal_terminal';
  city: string;
  coordinates: { lat: number; lng: number };
  staticFrictionWaitHours: number; // Static corridor/border/port friction
  coldStorageCapacityKg: number;
  repairHubCapabilities?: {
    fixedTechnicians: number;
    mobileUnitsCount: number;
    sparePartStockGrade: 'A' | 'B' | 'C';
    averageResponseTimeHours: number;
    emergencyTransferCapacityKg: number;
  };
  operationalStatus: 'NORMAL' | 'CONGESTED' | 'DISRUPTED' | 'CLOSED';
}

export interface TransportLane {
  id: string;
  fromId: string;
  toId: string;
  mode: 'ROAD' | 'SEA' | 'AIR';
  typicalDurationHours: number;
  durationUncertaintyHours: number;
  freightCostPerKg: number;
  reeferAvailability: boolean;
  reeferEnergyCostPerKgHour: number;
  status: 'OPEN' | 'DELAYED' | 'BLOCKED';
  disruptionReason?: string;
}

export type ReviewLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PlanAllocation {
  id: string;
  batchId: string;
  commodity: CommodityType;
  quantityKg: number;
  destinationId: string;
  laneId: string;
  mode: 'ROAD' | 'SEA' | 'AIR';
  assignedVehicleVesselId: string;
  departureTime: string;
  estimatedArrivalHours: number;
  estimatedArrivalRslHours: number;
  safetyBufferHours: number;
  isFeasible: boolean;
  rejectionReason?: string;
  discountPercent: number;
  discountTiming: 'DISPATCH_NOW' | 'DESTINATION_T_PLUS_12H' | 'NO_DISCOUNT';
  expectedRealizedPricePerKg: number;
  expectedSellThroughPercent: number;
  expectedNetRevenueInr: number;
  expectedSpoilageKg: number;
  reviewLevel: ReviewLevel;
  autonomyTier: 'AUTO_EXECUTED' | 'PENDING_CONFIRMATION' | 'ESCALATED_TO_SENIOR';
  bindingConstraint: string;
  alternativeOptionsCompared: Array<{
    destinationId: string;
    score: number;
    whyRejectedOrRankedLower: string;
  }>;
}

export type DisposalRoute =
  | 'SELL_FRESH_FULL'
  | 'DISCOUNT_SALE'
  | 'REDIRECT_NEARER'
  | 'SECONDARY_PROCESSING'
  | 'FOOD_BANK_DONATION'
  | 'ANIMAL_FEED'
  | 'COMPOSTING_BIOGAS'
  | 'LANDFILL';

export interface DisposalEvaluation {
  batchId: string;
  commodity: CommodityType;
  quantityKg: number;
  recommendedRoute: DisposalRoute;
  expectedValueRecoveredInr: number;
  netCostOrGainInr: number;
  qaDispositionStatus: 'RELEASE' | 'QUARANTINE' | 'REJECT';
  humanApproverRequired: boolean;
  rejectionReasonsPerRoute: Record<DisposalRoute, string>;
}

export type UserRole =
  | 'LOGISTICS_PLANNER'
  | 'COMPLIANCE_OFFICER'
  | 'SENIOR_APPROVER'
  | 'WAREHOUSE_MANAGER'
  | 'FARMER_SUPPLIER'
  | 'CARRIER_OPERATOR'
  | 'RETAILER_COORDINATOR'
  | 'SYSTEM_ADMIN'
  | 'AUDITOR';

export type OperatingMode =
  | 'CONNECTED' // Cloud + Edge, full AI and live/cached APIs
  | 'NETWORK_OFFLINE' // Power on, vessel edge autonomous rules & queue
  | 'EMERGENCY_DEGRADED_POWER'; // Critical safety/temp telemetry only

export interface AuditBlock {
  index: number;
  timestamp: string;
  eventType: string;
  role: UserRole;
  actor: string;
  dataSummary: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
  signatureHmac: string;
}

export interface VesselEdgeTelemetry {
  vesselId: string;
  seq: number;
  timestamp: string;
  nonce: string;
  priority: 'P0_CRITICAL_ALARM' | 'P1_POSITION_CARGO' | 'P2_ROUTINE';
  ciphertext: string; // AES-GCM encrypted payload
  ivHex: string;
  payloadHash: string; // SHA-256 of plaintext
  hmac: string; // HMAC-SHA256 signature
  unencryptedHeaders: {
    latApprox: number;
    lngApprox: number;
    speedKnots: number;
    engineStatus: 'NORMAL' | 'FAULT' | 'STOPPED';
    reeferPowerStatus: 'MAIN' | 'BACKUP_GEN' | 'FAULT';
  };
}

export interface ShoreControlCommand {
  commandId: string;
  vesselId: string;
  seq: number;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  commandType:
    | 'REROUTE'
    | 'CHANGE_SPEED'
    | 'DIVERT_TO_PORT'
    | 'SET_REEFER_SETPOINT'
    | 'SWITCH_TO_BACKUP_COOLING'
    | 'SET_TELEMETRY_MODE'
    | 'REQUEST_REPAIR_RENDEZVOUS'
    | 'STANDBY';
  params: Record<string, unknown>;
  approverId: string;
  hmac: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}

export interface DisruptionEvent {
  id: string;
  title: string;
  type:
    | 'HEATWAVE'
    | 'CYCLONE_PORT_CLOSURE'
    | 'REEFER_COMPRESSOR_FAILURE'
    | 'FESTIVAL_SURGE'
    | 'TARIFF_CHANGE'
    | 'SATCOM_BLACKOUT'
    | 'MARITIME_PIRACY_ALERT'
    | 'CYBER_SILENT_SUPPLIER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eventConfidence: number; // 0 to 1
  sourceAuthority: string;
  corroborated: boolean;
  affectedLanes: string[];
  affectedPorts: string[];
  affectedVesselIds: string[];
  description: string;
  active: boolean;
}
