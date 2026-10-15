/**
 * FreshRoute AWS Architecture Reference & CDK Skeleton
 * Clearly labeled reference architecture for deployment on AWS.
 */

export const AWS_SERVICES_MAPPING = [
  {
    agentOrLayer: 'Edge Node (Vessels & Reefer Trucks)',
    awsService: 'AWS IoT Core & AWS IoT Greengrass v2',
    purpose: 'Local ML models, offline queue, local rule engine, X.509 mutual TLS, delta MQTT topics per vessel.',
    mockStatus: 'Deterministic in-browser simulated WebCrypto node',
  },
  {
    agentOrLayer: 'Agent 1: Disruption Sensing',
    awsService: 'Amazon EventBridge + AWS Lambda / ECS Fargate',
    purpose: 'Event ingestion from IMD weather, GDACS, PortWatch, UKMTO advisories. Corroboration and event severity scoring.',
    mockStatus: 'In-browser corroborated event evaluator',
  },
  {
    agentOrLayer: 'Agent 2: Cold-Chain Monitoring',
    awsService: 'Amazon Timestream + AWS IoT Core Rules Engine',
    purpose: 'High-throughput temperature, humidity, CO2 time-series storage and deterministic physiological excursion detection.',
    mockStatus: 'In-browser Q10 Arrhenius decay stream',
  },
  {
    agentOrLayer: 'Agent 3: Scenario Planning (Core)',
    awsService: 'Amazon SageMaker (Training/Endpoints) + AWS Step Functions',
    purpose: 'Counterfactual scenario analysis, Monte Carlo simulation, Produce Resilience Impact Graph traversal.',
    mockStatus: 'In-browser 500-run Monte Carlo & FEFO ranker',
  },
  {
    agentOrLayer: 'Agent 4: Rerouting & Logistics',
    awsService: 'Amazon Location Service + AWS Lambda',
    purpose: 'Multi-modal candidate route evaluation, static port/corridor friction buffer calculations, signed vessel control commands.',
    mockStatus: 'In-browser road/sea router & repair rendezvous solver',
  },
  {
    agentOrLayer: 'Agent 5: Compliance & Audit',
    awsService: 'Amazon DynamoDB + Amazon S3 Object Lock (WORM) + AWS KMS',
    purpose: 'Append-only tamper-evident audit log anchored to immutable S3 Object Lock; versioned tariff/phytosanitary cache; HMAC signing keys.',
    mockStatus: 'Real browser WebCrypto SHA-256 hash chain & HMAC',
  },
  {
    agentOrLayer: 'Shared World State',
    awsService: 'Amazon DynamoDB (Global Tables with ACID transactions)',
    purpose: 'Single authoritative source of truth read and written by all 5 agents.',
    mockStatus: 'In-memory unified World State singleton',
  },
  {
    agentOrLayer: 'Human Approval & Escalation (HITL)',
    awsService: 'AWS Step Functions + Amazon SNS / SES',
    purpose: 'State machine for shelf-life-proportional timeout, backup escalation, and safe-default execution.',
    mockStatus: 'In-browser accelerated demo clock state machine',
  },
  {
    agentOrLayer: 'RBAC & Identity',
    awsService: 'Amazon Cognito User Pools + AWS IAM Role Claims',
    purpose: 'Authentication and fine-grained data-scoped authorization across 9 roles.',
    mockStatus: 'In-browser JWT role simulator with data-scoped views',
  },
  {
    agentOrLayer: 'GenAI Explanations Only',
    awsService: 'Amazon Bedrock (Claude 3.5 Sonnet / Titan)',
    purpose: 'Phrasing human-readable explanations of deterministic mathematical decisions (Never calculates allocations or safety).',
    mockStatus: 'Template fallback + deterministic narrative generator',
  },
];

export const REFERENCE_CDK_TYPESCRIPT = `// FreshRoute AWS CDK Stack (TypeScript)
// Reference Architecture for Enterprise Cold-Chain & Maritime Resilience
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as events from 'aws-cdk-lib/aws-events';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class FreshRouteResilienceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. AWS KMS Key for HMAC and Telemetry Envelope Encryption
    const kmsKey = new kms.Key(this, 'FreshRouteKmsKey', {
      enableKeyRotation: true,
      description: 'Customer managed key for FreshRoute edge telemetry and audit chain signatures',
    });

    // 2. Immutable WORM Audit Storage (S3 Object Lock)
    const auditBucket = new s3.Bucket(this, 'FreshRouteAuditBucket', {
      versioned: true,
      objectLockEnabled: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 3. Shared World State (DynamoDB Global Table)
    const worldStateTable = new dynamodb.Table(this, 'FreshRouteWorldState', {
      partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'entityId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    // 4. Amazon Cognito User Pool with 9 RBAC Role Groups
    const userPool = new cognito.UserPool(this, 'FreshRouteUserPool', {
      userPoolName: 'freshroute-rbac-pool',
      selfSignUpEnabled: false,
      mfa: cognito.Mfa.REQUIRED,
    });

    // 5. Amazon EventBridge Bus for Disruption Sensing
    const disruptionBus = new events.EventBus(this, 'DisruptionEventBus', {
      eventBusName: 'freshroute-disruptions',
    });

    // Outputs
    new cdk.CfnOutput(this, 'WorldStateTableName', { value: worldStateTable.tableName });
    new cdk.CfnOutput(this, 'AuditBucketName', { value: auditBucket.bucketName });
  }
}`;
