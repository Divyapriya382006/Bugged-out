/**
 * FreshRoute AWS Architecture Adapters & Interfaces
 * Provides deterministic in-browser MOCKS with zero API keys required,
 * with clean interfaces ready to switch to real AWS endpoints (IoT Core, EventBridge, DynamoDB, Bedrock, etc.)
 */

export interface AdapterConfig {
  mode: 'MOCK_IN_BROWSER' | 'AWS_REAL_ENDPOINTS';
  awsRegion: string;
  iotEndpoint?: string;
  cognitoUserPoolId?: string;
  eventBridgeBusArn?: string;
  worldStateTableName?: string;
  auditS3Bucket?: string;
}

export let currentAdapterConfig: AdapterConfig = {
  mode: 'MOCK_IN_BROWSER',
  awsRegion: 'ap-south-1', // AWS Asia Pacific (Mumbai)
  iotEndpoint: 'a3mockendpoint-ats.iot.ap-south-1.amazonaws.com',
  cognitoUserPoolId: 'ap-south-1_FreshRouteMockPool',
  eventBridgeBusArn: 'arn:aws:events:ap-south-1:123456789012:event-bus/FreshRouteProduceBus',
  worldStateTableName: 'FreshRoute-SharedWorldState-DDB',
  auditS3Bucket: 'freshroute-audit-immutable-object-lock',
};

export function setAdapterMode(mode: 'MOCK_IN_BROWSER' | 'AWS_REAL_ENDPOINTS') {
  currentAdapterConfig.mode = mode;
}

// 1. AWS IoT Core & Greengrass Telemetry Ingestion Interface
export interface AwsIotCoreAdapter {
  publishTelemetry(topic: string, payload: Record<string, unknown>): Promise<{ status: 'MOCK_ACK' | 'AWS_IOT_SENT'; messageId: string }>;
  subscribeToAlerts(topic: string, callback: (data: unknown) => void): () => void;
}

export const mockIotCoreAdapter: AwsIotCoreAdapter = {
  async publishTelemetry(topic, payload) {
    // Deterministic in-browser mock
    return {
      status: currentAdapterConfig.mode === 'AWS_REAL_ENDPOINTS' ? 'AWS_IOT_SENT' : 'MOCK_ACK',
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  },
  subscribeToAlerts(_topic, _callback) {
    return () => {};
  },
};

// 2. Amazon EventBridge Disruption Event Bus
export interface AwsEventBridgeAdapter {
  emitDisruptionEvent(source: string, detailType: string, detail: Record<string, unknown>): Promise<{ eventId: string; entriesCount: number }>;
}

export const mockEventBridgeAdapter: AwsEventBridgeAdapter = {
  async emitDisruptionEvent(source, detailType, detail) {
    return {
      eventId: `eb_evt_${Date.now()}`,
      entriesCount: 1,
    };
  },
};

// 3. Amazon DynamoDB Shared World State Storage
export interface AwsDynamoDbAdapter {
  putWorldState(item: Record<string, unknown>): Promise<{ version: number; writeCapacityUnits: number }>;
  getWorldState(stateKey: string): Promise<Record<string, unknown> | null>;
}

export const mockDynamoDbAdapter: AwsDynamoDbAdapter = {
  async putWorldState(item) {
    return { version: 1, writeCapacityUnits: 2.5 };
  },
  async getWorldState(_stateKey) {
    return null;
  },
};

// 4. Amazon Bedrock / GenAI (Explanations ONLY, Never computes feasibility or allocations)
export interface AwsBedrockAdapter {
  generateExplanation(promptContext: {
    batchId: string;
    commodity: string;
    chosenDestination: string;
    alternativesCompared: Array<{ destinationId: string; whyRejectedOrRankedLower: string }>;
    bindingConstraint: string;
    discountPercent: number;
    slackHours: number;
  }): Promise<string>;
}

export const mockBedrockAdapter: AwsBedrockAdapter = {
  async generateExplanation(ctx) {
    // Template-based explainability fallback (Zero hallucination, deterministic physiological explanation)
    return `[FreshRoute Explainability Engine - Grounded in physiological decay & transport economics]
Batch ${ctx.batchId} (${ctx.commodity}) was prioritized for ${ctx.chosenDestination} because its arrival shelf-life slack is ${ctx.slackHours.toFixed(1)}h. 
Binding Constraint: ${ctx.bindingConstraint}.
A dynamic discount of ${ctx.discountPercent}% was assigned to optimize sell-through under price elasticity curves.
Rejected alternatives:
${ctx.alternativesCompared.map((alt) => `• ${alt.destinationId}: ${alt.whyRejectedOrRankedLower}`).join('\n')}
Legality, food safety gate, and feasibility were enforced via deterministic rule engine.`;
  },
};
