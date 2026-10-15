# FreshRoute Production AWS Architecture Reference

## Overview
FreshRoute adapts the **MedGuard Resilience Architecture** (originally engineered for pharmaceutical cold chains) to perishable horticultural produce across Indian road corridors (NH-44, NH-48) and Arabian Sea / Bay of Bengal maritime lanes.

This document outlines the **AWS-target deployment architecture**, providing seamless mapping for all five autonomous agents, edge nodes, and security layers.

> **Status:** AWS-target architecture, mock-integrated. All external integrations operate through deterministic in-browser WebCrypto adapters with zero external API keys required for this demonstration.

---

## 1. Five-Agent Architecture Mapped to AWS

| Agent / Layer | Target AWS Cloud Service | Architectural Role | Demo Mock Implementation |
|---|---|---|---|
| **Vessel & Vehicle Edge Nodes** | **AWS IoT Greengrass v2 & AWS IoT Core** | Local ML models, offline queue, local rule engine, X.509 device certs, delta MQTT topics per vessel | In-browser WebCrypto node with store-and-forward queue |
| **Agent 1: Disruption Sensing** | **Amazon EventBridge + AWS Lambda / ECS Fargate** | Ingest weather (Open-Meteo), disasters (GDACS), port congestion (PortWatch), maritime security (UKMTO) | In-browser corroborated disruption ingestor |
| **Agent 2: Cold-Chain Monitoring** | **Amazon Timestream + AWS IoT Core Rules** | High-throughput temperature, humidity, CO2, and ethylene time-series storage; Q10 Arrhenius decay calculation | Real-time Arrhenius decay multiplier stream |
| **Agent 3: Scenario Planning (Core)** | **Amazon SageMaker + AWS Step Functions** | Counterfactual scenario analysis, 500-run Monte Carlo simulation, Produce Resilience Impact Graph | Deterministic FEFO priority optimizer & Monte Carlo engine |
| **Agent 4: Rerouting & Logistics** | **Amazon Location Service + AWS Lambda** | Multi-modal candidate route evaluation, static port/corridor friction buffers, signed vessel control commands | Multi-modal road/sea router & repair rendezvous solver |
| **Agent 5: Compliance & Audit** | **Amazon DynamoDB + Amazon S3 Object Lock (WORM) + AWS KMS** | Append-only tamper-evident audit log anchored to immutable S3 Object Lock; versioned tariff/phytosanitary cache; HMAC signing keys | Real WebCrypto SHA-256 hash chain & HMAC-SHA256 |
| **Shared World State** | **Amazon DynamoDB (Global Tables)** | Single authoritative source of truth read and written by all 5 agents | In-memory unified World State singleton |
| **Human Approval & Escalation (HITL)** | **AWS Step Functions + Amazon SNS / SES** | State machine for shelf-life-proportional timeout, backup escalation, and safe-default execution | In-browser accelerated demo clock state machine |
| **RBAC & Identity** | **Amazon Cognito User Pools + AWS IAM Role Claims** | Authentication and fine-grained data-scoped authorization across 9 roles | In-browser JWT role simulator with data-scoped views |
| **GenAI Explanations Only** | **Amazon Bedrock (Claude 3.5 Sonnet / Titan)** | Phrasing human-readable explanations of deterministic mathematical decisions (Never calculates allocations or safety) | Template fallback + deterministic narrative generator |

---

## 2. Cryptographic Security & Communication Protocol
1. **Telemetry Confidentiality & Integrity**:
   - Vessel position and cargo data are encrypted using **AES-256-GCM** and authenticated with **HMAC-SHA256**.
   - Sequence monotonicity, timestamp freshness windows, and nonce uniqueness are enforced at shore ingestion to prevent replay attacks.
   - Plausibility speed checks (>35 knots on cargo ships) detect AIS cyber-spoofing.
2. **Audit Chain**:
   - Each audit block stores `prevHash` and computes `hash = SHA256(index + timestamp + eventType + payload + prevHash)`.
   - Signed with HMAC-SHA256 and anchored in WORM S3 Object Lock.
3. **Control Commands**:
   - Shore issues signed commands (`SET_REEFER_SETPOINT`, `DIVERT_TO_PORT`, `CHANGE_SPEED`) with expiration timestamps and named approver signatures.

---

## 3. Reference AWS CDK TypeScript Infrastructure Stack

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as events from 'aws-cdk-lib/aws-events';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class FreshRouteResilienceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for HMAC and Envelope Encryption
    const kmsKey = new kms.Key(this, 'FreshRouteKmsKey', {
      enableKeyRotation: true,
      description: 'Customer managed key for FreshRoute edge telemetry and audit chain signatures',
    });

    // Immutable WORM Audit Storage
    const auditBucket = new s3.Bucket(this, 'FreshRouteAuditBucket', {
      versioned: true,
      objectLockEnabled: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Shared World State (DynamoDB Global Table)
    const worldStateTable = new dynamodb.Table(this, 'FreshRouteWorldState', {
      partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'entityId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    // Cognito User Pool for 9 RBAC Roles
    const userPool = new cognito.UserPool(this, 'FreshRouteUserPool', {
      userPoolName: 'freshroute-rbac-pool',
      selfSignUpEnabled: false,
      mfa: cognito.Mfa.REQUIRED,
    });

    // EventBridge Bus for Disruption Ingestion
    const disruptionBus = new events.EventBus(this, 'DisruptionEventBus', {
      eventBusName: 'freshroute-disruptions',
    });
  }
}
```
