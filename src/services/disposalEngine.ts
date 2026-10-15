/**
 * FreshRoute Disposal & Value-Recovery Engine
 * Deterministic 8-step Value-Recovery Hierarchy with QA Human Disposition Gate
 */

import { COMMODITIES } from '../data/syntheticDataset';
import { Batch, CommodityType, DisposalEvaluation, DisposalRoute } from '../types';
import { auditLog } from './cryptoEngine';

export interface RouteOptionDetail {
  route: DisposalRoute;
  name: string;
  isFeasible: boolean;
  valuePerKgInr: number;
  totalValueInr: number;
  rejectionReason?: string;
  foodSafetyCategory: 'HUMAN_CONSUMPTION' | 'NON_FOOD_ANIMAL' | 'ORGANIC_RECOVERY' | 'LANDFILL_WASTE';
}

/**
 * Evaluates the full 8-step hierarchy for any batch or degraded lot
 */
export function evaluateDisposalHierarchy(
  batch: Batch,
  qaStatus: 'RELEASE' | 'QUARANTINE' | 'REJECT' = 'RELEASE',
  currentRslHours = batch.currentRslHours
): {
  evaluation: DisposalEvaluation;
  optionsBreakdown: RouteOptionDetail[];
} {
  const comm = COMMODITIES[batch.commodity];
  const qty = batch.quantityKg;

  // Track each candidate route's feasibility and rejection reasons
  const rejectionReasons: Record<DisposalRoute, string> = {
    SELL_FRESH_FULL: '',
    DISCOUNT_SALE: '',
    REDIRECT_NEARER: '',
    SECONDARY_PROCESSING: '',
    FOOD_BANK_DONATION: '',
    ANIMAL_FEED: '',
    COMPOSTING_BIOGAS: '',
    LANDFILL: '',
  };

  const options: RouteOptionDetail[] = [];

  // Step 1: Sell Fresh Full Price
  const canSellFull = qaStatus === 'RELEASE' && currentRslHours >= 48 && batch.qualityGrade === 'A';
  if (!canSellFull) {
    rejectionReasons.SELL_FRESH_FULL =
      qaStatus !== 'RELEASE'
        ? `QA disposition is ${qaStatus} (unapproved for premium fresh food).`
        : currentRslHours < 48
        ? `Remaining shelf life (${currentRslHours.toFixed(1)}h) is below fresh retail minimum (48h).`
        : `Quality grade is ${batch.qualityGrade} (requires Grade A).`;
  }
  options.push({
    route: 'SELL_FRESH_FULL',
    name: '1. Sell Fresh at Full Market Price',
    isFeasible: canSellFull,
    valuePerKgInr: comm.baseMarketPricePerKg,
    totalValueInr: canSellFull ? qty * comm.baseMarketPricePerKg : 0,
    rejectionReason: rejectionReasons.SELL_FRESH_FULL,
    foodSafetyCategory: 'HUMAN_CONSUMPTION',
  });

  // Step 2: Discount Sale
  const canDiscount = qaStatus === 'RELEASE' && currentRslHours >= 24 && batch.qualityGrade !== 'REJECT';
  if (!canDiscount) {
    rejectionReasons.DISCOUNT_SALE =
      qaStatus !== 'RELEASE'
        ? `Unsafe QA state (${qaStatus}). Cannot distribute for direct retail.`
        : currentRslHours < 24
        ? `RSL (${currentRslHours.toFixed(1)}h) too short to achieve retail clearance.`
        : `Lot flagged as ${batch.qualityGrade}.`;
  }
  options.push({
    route: 'DISCOUNT_SALE',
    name: '2. Dynamic Clearance Discount Sale',
    isFeasible: canDiscount,
    valuePerKgInr: comm.salvageValues.discountFloorPricePerKg,
    totalValueInr: canDiscount ? qty * comm.salvageValues.discountFloorPricePerKg : 0,
    rejectionReason: rejectionReasons.DISCOUNT_SALE,
    foodSafetyCategory: 'HUMAN_CONSUMPTION',
  });

  // Step 3: Redirect to Nearer / Alternate Local Market
  const canRedirect = qaStatus === 'RELEASE' && currentRslHours >= 18;
  if (!canRedirect) {
    rejectionReasons.REDIRECT_NEARER =
      qaStatus !== 'RELEASE'
        ? `Lot in QA ${qaStatus}.`
        : `Insufficient shelf life (${currentRslHours.toFixed(1)}h) even for local short-haul mandi.`;
  }
  options.push({
    route: 'REDIRECT_NEARER',
    name: '3. Urgent Redirection to Local / Alternate Mandi',
    isFeasible: canRedirect,
    valuePerKgInr: comm.salvageValues.discountFloorPricePerKg * 0.9,
    totalValueInr: canRedirect ? qty * (comm.salvageValues.discountFloorPricePerKg * 0.9) : 0,
    rejectionReason: rejectionReasons.REDIRECT_NEARER,
    foodSafetyCategory: 'HUMAN_CONSUMPTION',
  });

  // Step 4: Secondary Industrial Processing (Pulp, Puree, Juice, Dehydration, Pickle)
  const canProcess =
    qaStatus === 'RELEASE' &&
    currentRslHours >= 10 &&
    (batch.commodity === 'tomato' ||
      batch.commodity === 'mango' ||
      batch.commodity === 'banana' ||
      batch.commodity === 'grapes' ||
      batch.commodity === 'apple' ||
      batch.commodity === 'potato' ||
      batch.commodity === 'onion' ||
      batch.commodity === 'cauliflower');
  if (!canProcess) {
    rejectionReasons.SECONDARY_PROCESSING =
      qaStatus !== 'RELEASE'
        ? `Industrial food processing requires QA RELEASE approval.`
        : currentRslHours < 10
        ? `Physiological degradation beyond processing threshold (<10h RSL).`
        : `Commodity ${batch.commodity} does not have viable secondary processing facility in current radius.`;
  }
  options.push({
    route: 'SECONDARY_PROCESSING',
    name: '4. Secondary Processing (Pulp / Puree / IQF / Dehydration)',
    isFeasible: canProcess,
    valuePerKgInr: comm.salvageValues.processingPricePerKg,
    totalValueInr: canProcess ? qty * comm.salvageValues.processingPricePerKg : 0,
    rejectionReason: rejectionReasons.SECONDARY_PROCESSING,
    foodSafetyCategory: 'HUMAN_CONSUMPTION',
  });

  // Step 5: Food Bank / Charitable Donation (Akshaya Patra / Feeding India partner hubs)
  // Grade B or C, edible, non-toxic, short turnaround
  const canDonate = qaStatus === 'RELEASE' && currentRslHours >= 12;
  if (!canDonate) {
    rejectionReasons.FOOD_BANK_DONATION =
      qaStatus !== 'RELEASE'
        ? `Food safety protocols prohibit non-cleared food from donation.`
        : `Shelf life (${currentRslHours.toFixed(1)}h) too fragile for NGO distribution logistics.`;
  }
  options.push({
    route: 'FOOD_BANK_DONATION',
    name: '5. Institutional Food Bank & Donation Network',
    isFeasible: canDonate,
    valuePerKgInr: comm.salvageValues.donationSocialValuePerKg,
    totalValueInr: canDonate ? qty * comm.salvageValues.donationSocialValuePerKg : 0,
    rejectionReason: rejectionReasons.FOOD_BANK_DONATION,
    foodSafetyCategory: 'HUMAN_CONSUMPTION',
  });

  // Step 6: Livestock & Animal Feed (Non-human safe feed mills)
  const canAnimalFeed = qaStatus !== 'REJECT' || !batch.sensorAnomalyDetected;
  if (!canAnimalFeed) {
    rejectionReasons.ANIMAL_FEED = 'Confirmed chemical/fungal contamination hazard. Rejected from feed supply.';
  }
  options.push({
    route: 'ANIMAL_FEED',
    name: '6. Livestock Feed Mill Processing',
    isFeasible: canAnimalFeed,
    valuePerKgInr: comm.salvageValues.animalFeedPricePerKg,
    totalValueInr: canAnimalFeed ? qty * comm.salvageValues.animalFeedPricePerKg : 0,
    rejectionReason: rejectionReasons.ANIMAL_FEED,
    foodSafetyCategory: 'NON_FOOD_ANIMAL',
  });

  // Step 7: Composting & Biogas Anaerobic Digestion
  const canCompost = true; // Always feasible for organic biomass
  options.push({
    route: 'COMPOSTING_BIOGAS',
    name: '7. Industrial Composting & Biogas Energy Generation',
    isFeasible: canCompost,
    valuePerKgInr: comm.salvageValues.compostBiogasPricePerKg,
    totalValueInr: qty * comm.salvageValues.compostBiogasPricePerKg,
    rejectionReason: '',
    foodSafetyCategory: 'ORGANIC_RECOVERY',
  });

  // Step 8: Sanitary Landfill (Last resort with municipal tipping fee)
  options.push({
    route: 'LANDFILL',
    name: '8. Municipal Sanitary Landfill (Penalty Cost)',
    isFeasible: true,
    valuePerKgInr: comm.salvageValues.landfillCostPerKg, // Negative number
    totalValueInr: qty * comm.salvageValues.landfillCostPerKg,
    rejectionReason: '',
    foodSafetyCategory: 'LANDFILL_WASTE',
  });

  // Pick top feasible route in hierarchy order
  const feasibleChoice = options.find((opt) => opt.isFeasible && opt.totalValueInr > 0) || options[options.length - 1];

  const evaluation: DisposalEvaluation = {
    batchId: batch.batchId,
    commodity: batch.commodity,
    quantityKg: qty,
    recommendedRoute: feasibleChoice.route,
    expectedValueRecoveredInr: feasibleChoice.totalValueInr,
    netCostOrGainInr: feasibleChoice.totalValueInr,
    qaDispositionStatus: qaStatus,
    humanApproverRequired: qaStatus === 'QUARANTINE' || feasibleChoice.route === 'LANDFILL',
    rejectionReasonsPerRoute: rejectionReasons,
  };

  return { evaluation, optionsBreakdown: options };
}

/**
 * Submit Human QA Disposition to Audit Log
 */
export async function logQaDispositionDecision(
  batchId: string,
  disposition: 'RELEASE' | 'QUARANTINE' | 'REJECT',
  inspectorName: string,
  inspectorNotes: string
) {
  await auditLog.appendEntry(
    'QA_HUMAN_DISPOSITION_RECORDED',
    'COMPLIANCE_OFFICER',
    inspectorName,
    `Batch ${batchId} disposition set to ${disposition}: "${inspectorNotes}"`,
    {
      batchId,
      disposition,
      inspectorNotes,
      enforcedPolicy: 'No autonomous clearance of compromised produce (MedGuard Section 6)',
    }
  );
}
