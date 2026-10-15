/**
 * FreshRoute Deterministic Shelf-Life & Temperature Decay Engine
 * Disclosed physiological model for post-harvest horticultural decay.
 */

import { COMMODITIES } from '../data/syntheticDataset';
import { Batch, CommodityType, Destination, TransportLane } from '../types';

export interface LegDecayResult {
  legDurationHours: number;
  effectiveDecayFactor: number;
  effectiveHoursLost: number;
  handlingLossHours: number;
  portFrictionDwellHours: number;
  temperatureObservedC: number;
  excursionDetected: boolean;
  chillingInjuryDetected: boolean;
  excursionExplanation?: string;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  arrivalRslHours: number;
  requiredMinRslHours: number;
  safetyBufferHours: number;
  slackHours: number; // arrivalRsl - (requiredMinRsl + safetyBuffer)
  decayBreakdown: LegDecayResult;
  rejectionReason?: string;
}

/**
 * Calculates temperature-dependent decay factor
 * Follows Q10 Arrhenius-like post-harvest physiology:
 * Rate multiplier = (decayPer5C) ^ ((T - T_max) / 5) for temperatures above the ideal band.
 */
export function calculateTemperatureDecayFactor(
  commodityType: CommodityType,
  actualTempC: number,
  isReeferActive: boolean
): {
  factor: number;
  isExcursion: boolean;
  isChillingInjury: boolean;
  explanation: string;
} {
  const comm = COMMODITIES[commodityType];
  const { idealTempMin, idealTempMax, decayPer5CAboveBand, chillingSensitive, chillingThresholdTemp } = comm;

  // Check chilling injury (critically dangerous for tropical fruit: banana, tomato, mango, pomegranate)
  if (chillingSensitive && chillingThresholdTemp !== undefined && actualTempC < chillingThresholdTemp) {
    const chillingDiff = chillingThresholdTemp - actualTempC;
    return {
      factor: 2.2 * Math.pow(1.3, chillingDiff),
      isExcursion: true,
      isChillingInjury: true,
      explanation: `Chilling injury risk! Temp ${actualTempC.toFixed(1)}°C is below physiological threshold ${chillingThresholdTemp}°C. Cell membranes suffer irreversible pitting/browning.`,
    };
  }

  // Within ideal temperature band
  if (actualTempC >= idealTempMin && actualTempC <= idealTempMax) {
    return {
      factor: 1.0,
      isExcursion: false,
      isChillingInjury: false,
      explanation: `Optimal cold chain: ${actualTempC.toFixed(1)}°C inside ideal band [${idealTempMin}°C - ${idealTempMax}°C]. Decay rate = 1.0x baseline.`,
    };
  }

  // High temperature excursion
  if (actualTempC > idealTempMax) {
    const deltaT = actualTempC - idealTempMax;
    // Arrhenius multiplier per 5C above max band
    const factor = Math.pow(decayPer5CAboveBand, deltaT / 5);
    const excursionSeverity = deltaT > 8 ? 'CRITICAL EXCURSION' : 'MODERATE EXCURSION';

    return {
      factor: Number(factor.toFixed(2)),
      isExcursion: true,
      isChillingInjury: false,
      explanation: `${excursionSeverity}: Temp ${actualTempC.toFixed(1)}°C is +${deltaT.toFixed(1)}°C above ideal max (${idealTempMax}°C). Respiration & senescence accelerated to ${factor.toFixed(2)}x baseline.`,
    };
  }

  // Cool but above freezing / non-chilling-sensitive sub-optimal
  return {
    factor: 1.1,
    isExcursion: false,
    isChillingInjury: false,
    explanation: `Slightly below optimal band but non-chilling sensitive. Decay rate ~1.1x.`,
  };
}

/**
 * Evaluates feasibility of delivering a batch across a candidate lane to a destination.
 * Formula:
 * arrival_RSL = current_RSL - Sum(leg_time * decay_factor) - handling_loss_h - customs_dwell
 * Feasible iff arrival_RSL >= destination.minRslOnArrivalHours * (1 + safety_buffer)
 */
export function evaluateBatchFeasibility(
  batch: Batch,
  lane: TransportLane,
  destination: Destination,
  ambientTempC = 34,
  portFrictionWaitHours = 0
): FeasibilityResult {
  const comm = COMMODITIES[batch.commodity];

  // Determine transit temperature
  // If reefer is active, average reefer setpoint is ideal midpoint; if disrupted or ambient truck, it tracks ambient
  const isReefer = lane.reeferAvailability && lane.status !== 'DELAYED';
  const transitTempC = isReefer
    ? (comm.idealTempMin + comm.idealTempMax) / 2
    : Math.min(ambientTempC, 38);

  const decayEval = calculateTemperatureDecayFactor(batch.commodity, transitTempC, isReefer);

  // Transit leg hours
  const legHours = lane.typicalDurationHours;
  const effectiveHoursLost = legHours * decayEval.factor;

  // Handling loss in hours equivalent based on handling loss %
  // E.g., 2.5% transfer handling damage diminishes 2.5% of remaining shelf life
  const handlingLossHours = batch.currentRslHours * (comm.handlingLossPercentPerTransfer / 100);

  // Port and customs dwell (e.g. export reefer plug wait or mandi checkpost)
  const portFrictionHours = portFrictionWaitHours;

  const totalHoursLost = effectiveHoursLost + handlingLossHours + portFrictionHours;
  const arrivalRslHours = Math.max(0, batch.currentRslHours - totalHoursLost);

  // Safety buffer: 48-72h buffer applied to long sea/international legs, 12-24h for long domestic road
  const safetyBufferHours = lane.mode === 'SEA' ? 48 : lane.typicalDurationHours > 20 ? 18 : 6;
  const requiredThreshold = destination.minRslOnArrivalHours + safetyBufferHours;
  const slackHours = arrivalRslHours - requiredThreshold;

  let isFeasible = arrivalRslHours >= requiredThreshold;
  let rejectionReason: string | undefined;

  if (arrivalRslHours <= 0) {
    isFeasible = false;
    rejectionReason = `Batch expires completely in transit! (Lost ${totalHoursLost.toFixed(1)}h RSL vs current ${batch.currentRslHours}h).`;
  } else if (!isFeasible) {
    rejectionReason = `Arrival RSL (${arrivalRslHours.toFixed(1)}h) fails minimum destination threshold (${destination.minRslOnArrivalHours}h) plus safety buffer (${safetyBufferHours}h). Deficit: ${Math.abs(slackHours).toFixed(1)}h.`;
  } else if (lane.status === 'BLOCKED') {
    isFeasible = false;
    rejectionReason = `Transport lane ${lane.id} is BLOCKED due to active disruption (${lane.disruptionReason || 'Unscheduled stoppage'}).`;
  }

  return {
    isFeasible,
    arrivalRslHours: Number(arrivalRslHours.toFixed(1)),
    requiredMinRslHours: destination.minRslOnArrivalHours,
    safetyBufferHours,
    slackHours: Number(slackHours.toFixed(1)),
    decayBreakdown: {
      legDurationHours: legHours,
      effectiveDecayFactor: decayEval.factor,
      effectiveHoursLost: Number(effectiveHoursLost.toFixed(1)),
      handlingLossHours: Number(handlingLossHours.toFixed(1)),
      portFrictionDwellHours: portFrictionHours,
      temperatureObservedC: transitTempC,
      excursionDetected: decayEval.isExcursion,
      chillingInjuryDetected: decayEval.isChillingInjury,
      excursionExplanation: decayEval.explanation,
    },
    rejectionReason,
  };
}
